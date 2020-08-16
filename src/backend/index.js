import config from './config';
import utils from './utils';
import backapi from './backapi';
import dayjs from 'dayjs';

chrome.runtime.onMessage.addListener(function(info, sender, cb) {
	(async () => {
		let api = backapi[info.path]
		if (api) try {
			let data = await api(info.body);
			return cb({ no: 200, data });
		} catch (msg) {
			return cb({ no: 500, msg });
		}
		return cb({ no: 404, msg: 'not found' });
	})();
	return true;
})

const TAIL_KEYWORD = '#soulsign-install';
chrome.tabs.onUpdated.addListener(function(tabId, tabInfo, tab) {
	if (tabInfo.url && tabInfo.url.endsWith(TAIL_KEYWORD)) {
		chrome.tabs.update(tabId, {
			url: chrome.runtime.getURL('/pages/options.html#' + tabInfo.url.slice(0, -TAIL_KEYWORD.length))
		})
	}
	if (!config.donate) return;
	let url = 'https://union-click.jd.com/jdc?e=&p=AyIGZRprFDJWWA1FBCVbV0IUWVALHFRBEwQAQB1AWQkrGn0HSFEFTit2UVZMFnwsQQsQWgtlOxkOIgdTGloXCxcGUxhrFQMTB1cZWxEGEDdlG1olSXwGZRhaFQEbDlIbWxEyEgNcGF0SChcOVhNcFTIVB1wrGUlAFwVUGVMUCiI3ZRhrJTISB2Uba0pGT1plGVoUBhs%3D'
	if (tabInfo.url && tabInfo.url.endsWith('//www.jd.com/')) {
		chrome.tabs.update(tabId, { url });
	}
})

function race(pms, ms) {
	return Promise.race([utils.sleep(ms || (config.timeout * 1e3)), pms]);
}

function init() {
	return new Promise(function(resolve, reject) {
		chrome.storage.sync.get('config', function(data) {
			if (!data || !data.config) { // 旧版本或者新安装，尝试升级
				chrome.storage.local.get(Object.keys(config), function(data) {
					if (Object.keys(data).length) { // 旧版本
						console.log('旧版本升级');
						Object.assign(config, data);
						chrome.storage.local.get('tasks', function({ tasks }) {
							chrome.storage.local.clear(function() {
								chrome.storage.sync.set({ config });
								let sync = { tasks: [] }
								let local = {}
								for (let task of tasks) {
									let name = task.author + '/' + task.name;
									sync.tasks.push(name)
									local[name] = task;
								}
								new Notification('升级成功');
								resolve(Promise.all([
									utils.localSave(local),
									utils.syncSave(sync),
								]))
							})
						})
					} else { // 新安装
						console.log('新安装');
						resolve()
					}
				});
			} else {
				Object.assign(config, data.config);
				resolve()
			}
		})
	});
}

async function loop() {
	let tasks = await utils.getTasks();
	let today = dayjs().add(-config.begin_at, 'second').startOf('day').add(config.begin_at, 'second');
	let err_cnt = 0;
	for (let task of tasks) {
		if (!task.enable) continue;
		let changed = false;
		if (task.check) { // 有检查是否在线的函数
			let now = Date.now();
			if (task.online_at + task.expire < now) { // 没有检查过|之前不在线|到了再次检查时间了
				changed = true;
				let ok = false;
				try {
					ok = await race(task.check(task._params));
				} catch (err) {
					if (/Network Error|timeout/.test(err)) return; // 网络中断载时
					task.result = err + '';
					console.error(task.name, '开始检查是否在线失败', err);
				}
				if (!ok) { // 不在线，直接跳过
					err_cnt++;
					if (config.notify_at + config.notify_freq * 1e3 < now) {
						// 距离上次不在线15分钟了
						new Notification(`${task.name}不在线`, {
							body: '点此去登录或禁用它',
							icon: `chrome://favicon/https://${task.domains[0]}`,
						}).onclick = function() {
							chrome.tabs.create({ url: task.loginURL || '/pages/options.html' });
						};
						config.notify_at = now;
						await utils.syncSave({ config });
					}
					task.online_at = -now;
					await utils.setTask(task);
					continue;
				}
				task.online_at = now;
			}
		}
		if (dayjs(task.success_at).isBefore(today)) {
			// 今天没有执行成功过
			if (task.failure_at + config.retry_freq * 1e3 <= new Date().getTime()) { // 运行失败后要歇10分钟
				changed = true;
				await race(utils.runTask(task));
			}
		}
		if (task.failure_at > task.success_at) err_cnt++;
		if (changed) await utils.setTask(task);
	}
	if (err_cnt) {
		chrome.browserAction.setBadgeBackgroundColor({ color: '#F44336' });
		chrome.browserAction.setBadgeText({ text: err_cnt + '' })
	} else {
		chrome.browserAction.setBadgeText({ text: '' })
	}
}

async function upgrade() {
	let now = Date.now();
	if (config.upgrade_at + (config.upgrade_freq * 1e3) > now) return;
	console.log('开始检查更新');
	new Notification('开始检查并更新脚本');
	let tasks = await utils.getTasks();
	let li = [];
	for (let task of tasks) {
		if (!task.enable) continue;
		if (task.updateURL) {
			try {
				let { data } = await utils.axios.get(task.updateURL);
				let item = utils.compileTask(data);
				if (item.version != task.version) {
					let changed = false;
					for (let k of ['author', 'name', 'grants', 'domains']) {
						if (item[k] != task[k]) {
							changed = true;
							break;
						}
					}
					if (changed)
						chrome.tabs.create({ url: '/pages/options.html#' + task.updateURL })
					else {
						li.push(task.name);
						utils.addTask(tasks, item);
					}
				}
			} catch (error) {
				console.error(task.name, '更新失败');
			}
		}
	}
	if (li.length) {
		let title = li[0];
		if (li.length > 1) title += `等${li.length}个脚本`;
		new Notification(title + ' 升级成功').onclick = () => chrome.tabs.create({ url: '/pages/options.html' });
	}
	config.upgrade_at = now;
	await utils.syncSave({ config });
}

let originMap = {};

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
	let requestHeaders = details.requestHeaders;
	for (var i = 0; i < requestHeaders.length; ++i) {
		var header = requestHeaders[i];
		if (header.name === 'Origin') {
			if (!details.url.startsWith(header.value)) {
				originMap[details.requestId] = header.value;
			}
		}
	}
	// 只有插件才加
	var initiaor = details.initiator || details.documentUrl
	if (!initiaor || !/^\w+-extension:/.test(initiaor)) return;
	var edit = false;
	for (var i = 0; i < requestHeaders.length; ++i) {
		var header = requestHeaders[i];
		if (header.name === "_referer") {
			edit = true;
			for (let j = 0; j < requestHeaders.length; j++) {
				if (/^(Referer|_referer)$/.test(requestHeaders[j].name)) requestHeaders.splice(j--, 1);
			}
			requestHeaders.unshift({name: "Referer", value: header.value});
		} else if (header.name === "_origin") {
			edit = true;
			for (let j = 0; j < requestHeaders.length; j++) {
				if (/^(Origin|_origin)$/.test(requestHeaders[j].name)) requestHeaders.splice(j--, 1);
			}
			requestHeaders.unshift({name: "Origin", value: header.value});
		}
	}
	if (edit) return {requestHeaders};
}, { urls: ["<all_urls>"], types: ['xmlhttprequest'] }, utils.isFirefox ? ["blocking", "requestHeaders"] : ["blocking", "requestHeaders", "extraHeaders"]);

chrome.webRequest.onHeadersReceived.addListener(function(details) {
	if (!config.cross) return;
	let origin = originMap[details.requestId];
	if (origin) {
		delete originMap[details.requestId];
		// 只有跨域了才加
		let flag = config.allow_cross[details.initiator];
		if (!flag) return; // 不允许跨域
		let responseHeaders = details.responseHeaders;
		for (var i = 0; i < responseHeaders.length; ++i) {
			if (responseHeaders[i].name.toLowerCase() === 'access-control-allow-origin') {
				// 已经有了就不加了
				return;
			}
		}
		responseHeaders.push({ name: 'Access-Control-Allow-Origin', value: origin });
		if (flag & 2) responseHeaders.push({ name: 'Access-Control-Allow-Credentials', value: 'true' });
		responseHeaders.push({ name: 'Access-Control-Allow-Headers', value: config.cross_header });
		return { responseHeaders };
	}
}, { urls: ["<all_urls>"], types: ['xmlhttprequest'] }, ["blocking", "responseHeaders"]);

async function main() {
	await init();
	while (true) {
		try {
			await loop();
			if (config.upgrade) await upgrade();
		} catch (error) {
			console.error(error);
		}
		await utils.sleep(config.loop_freq * 1e3);
	}
}

main().catch(err => {
	console.log(`崩溃`, err);
});