/**
 * 生成安全的脚本
 */
import axios from "axios";
import utils from "./utils";

const evt = document.createElement("div");
chrome.tabs.onUpdated.addListener(function(tabId, info) {
	let event = new CustomEvent(tabId + ":" + info.status, {detail: info});
	evt.dispatchEvent(event);
});

function checkDomain(domains, url) {
	let m = /https?:\/\/([^:\/]+)/.exec(url);
	if (!m) return false;
	let ss = m[1].split(".");
	return domains.reduce(function(a, b) {
		if (a) return true;
		if ("*" == b) return true;
		let dd = b.split(".");
		if (dd.length != ss.length) return false;
		for (let i = 0; i < ss.length; i++) {
			if (dd[i] != "*" && ss[i] != dd[i]) return false;
		}
		return true;
	}, false);
}

function frameRunner(tabId, frameId, domains, url) {
	return {
		url,
		eval(code) {
			return new Promise(function(resolve, reject) {
				chrome.tabs.executeScript(tabId, {code, frameId, runAt: "document_end"}, function(result) {
					resolve(result && result[0]);
				});
			});
		},
		waitLoaded(timeout) {
			return new Promise(function(resolve, reject) {
				function fn() {
					resolve(true);
					evt.removeEventListener(tabId + ":complete", fn);
				}
				evt.addEventListener(tabId + ":complete", fn);
				if (timeout > 0)
					setTimeout(function() {
						resolve(false);
						evt.removeEventListener(tabId + ":complete", fn);
					}, timeout);
			});
		},
		async waitUntil(selector, retryCount = 10) {
			while (--retryCount >= 0) {
				if (await this.eval(`!!document.querySelector(${JSON.stringify(selector)})`)) return true;
				await utils.sleep(1e3);
			}
			return await this.eval(`!!document.querySelector(${JSON.stringify(selector)})`);
		},
		async click(selector, waitCount = 10) {
			if (await this.waitUntil(selector, waitCount)) {
				await this.eval(`document.querySelector(${JSON.stringify(selector)}).click()`);
				return true;
			}
			return false;
		},
		async value(selector, value, waitCount = 10) {
			if (await this.waitUntil(selector, waitCount)) {
				await this.eval(`document.querySelector(${JSON.stringify(selector)}).value=${JSON.stringify(value)}`);
				return true;
			}
			return false;
		},
		iframes() {
			return new Promise(function(resolve, reject) {
				chrome.webNavigation.getAllFrames({tabId: tabId}, function(details) {
					resolve(details.filter((x) => checkDomain(domains, x.url)).map((x) => frameRunner(tabId, x.frameId, domains, x.url)));
				});
			});
		},
	};
}

/**
 *
 * @param {soulsign.Task} task 脚本允许访问的
 */
export default function(task) {
	let request = axios.create({timeout: 10e3});
	const domains = task.domains.concat();
	request.interceptors.request.use(function(config) {
		if (!checkDomain(domains, config.url)) return Promise.reject(`domain配置不正确`);
		if (config.headers) {
			if (config.headers["Referer"]) {
				config.headers["_referer"] = config.headers["Referer"];
				delete config.headers["Referer"];
			} else if (config.headers["referer"]) {
				config.headers["_referer"] = config.headers["referer"];
				delete config.headers["referer"];
			}
			if (config.headers["Origin"]) {
				config.headers["_origin"] = config.headers["Origin"];
				delete config.headers["Origin"];
			} else if (config.headers["origin"]) {
				config.headers["_origin"] = config.headers["origin"];
				delete config.headers["origin"];
			}
		}
		return config;
	});
	let grant = new Set(task.grants);
	let inject = {
		axios: request,
		tools: utils.extTask(task),
		/**
		 * 引入第三方JS脚本
		 * @param {string} url
		 */
		require(url) {
			if (!grant.has("require")) return Promise.reject("需要@grant require");
			return axios.get(url, {validateStatus: () => true}).then(function({data}) {
				let module = {exports: {}};
				new Function("exports", "module", data)(module.exports, module);
				return module.exports;
			});
		},
		/**
		 * 获取指定url指定名字的cookie
		 * @param {string} url
		 * @param {string} name
		 */
		getCookie(url, name) {
			if (!grant.has("cookie")) return Promise.reject("需要@grant cookie");
			return new Promise((resolve, reject) => {
				chrome.cookies.get({url, name}, (x) => resolve(x && x.value));
			});
		},
		/**
		 * 设置指定url指定名字的cookie
		 * @param {string} url
		 * @param {string} name
		 * @param {string} value
		 */
		setCookie(url, name, value) {
			if (!grant.has("cookie")) return Promise.reject("需要@grant cookie");
			return new Promise((resolve, reject) => {
				chrome.cookies.set({url, name, value}, (x) => resolve(x && x.value));
			});
		},
		$(html) {
			var div = document.createElement("div");
			div.innerHTML = html;
			return div.childNodes.length > 1 ? Array.from(div.childNodes) : div.childNodes[0];
		},
		notify(body, url, timeout) {
			if (!grant.has("notify")) throw "需要@grant notify";
			let n = new Notification(task.name, {
				body,
				icon: "chrome://favicon/https://" + task.domains[0],
			});
			n.onclick = function() {
				this.close();
				if (url) chrome.tabs.create({url});
			};
			setTimeout(function() {
				n.close();
			}, timeout || 300e3);
		},
		open(url, dev, fn) {
			if (!checkDomain(domains, url)) return Promise.reject(`domain配置不正确`);
			return new Promise(function(resolve, reject) {
				chrome.windows.create(
					dev ? {left: 0, top: 0, width: window.screen.availWidth, height: window.screen.availHeight, focused: true} : {state: "minimized", focused: false},
					function(w) {
						chrome.tabs.create({url, active: true, selected: true, windowId: w.id}, function(tab) {
							Promise.resolve(frameRunner(tab.id, 0, domains, url))
								.then((x) => x.waitLoaded().then(() => x))
								.then(fn)
								.then(resolve, reject)
								.finally(() => chrome.windows.remove(w.id));
						});
					}
				);
			});
		},
	};
	if (!grant.has("eval")) {
		// 脚本中屏蔽以下内容
		Object.assign(inject, {
			window: undefined,
			document: undefined,
			Notification: undefined,
			location: undefined,
			eval: undefined,
			Function: undefined,
			chrome: undefined,
			globalThis: undefined,
		});
	}
	let inject_keys = Object.keys(inject);
	let inject_values = Object.values(inject);
	task = Object.assign({}, utils.TASK_EXT, task);
	let module = {exports: {}};
	new Function("exports", "module", ...inject_keys, task.code)(module.exports, module, ...inject_values);
	task.check = module.exports.check;
	task.run = module.exports.run;
	return task;
}
