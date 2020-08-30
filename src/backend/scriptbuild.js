/**
 * 生成安全的脚本
 */
import axios from "axios";
import utils from "./utils";

/**
 *
 * @param {soulsign.Task} task 脚本允许访问的
 */
export default function(task) {
	let request = axios.create({timeout: 10e3});
	request.interceptors.request.use(function(config) {
		let m = /https?:\/\/([^:\/]+)/.exec(config.url);
		if (!m) return Promise.reject(`domain配置不正确`);
		let ss = m[1].split(".");
		if (
			!task.domains.reduce(function(a, b) {
				if (a) return true;
				if ('*' == b) return true;
				let dd = b.split('.');
				if (dd.length != ss.length) return false;
				for (let i = 0; i < ss.length; i++) {
					if (dd[i] != "*" && ss[i] != dd[i]) return false;
				}
				return true;
			}, false)
		)
			return Promise.reject(`domain配置不正确`);
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
		tools: utils.extTask(),
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
				icon: 'chrome://favicon/https://' + task.domains[0]
			});
			n.onclick = function() {
				this.close();
				if (url) chrome.tabs.create({url});
			};
			setTimeout(function() {
				n.close();
			}, timeout || 300e3);
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
