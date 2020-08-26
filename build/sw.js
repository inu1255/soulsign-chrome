const UPDATE_URL = "http://soulsignchrome.inu1255.cn";
const UPDATE_FREQ = 5000; // 检查更新间隔
// ----- change above -----
var checkAt = 0; // 上次检查更新时间
var files; // 文件md5版本
const VERSION = "v1";
self.addEventListener("install", function(event) {
	console.log("sw install");
	event.waitUntil(
		fetch("/files.json")
			.then((x) => x.json())
			.then(
				(m) =>
					caches.open(VERSION).then(function(cache) {
						var changes = [];
						for (var k in m) {
							(function(url) {
								console.log("install: " + url);
								changes.push(
									fetch(url).then(function(response) {
										return cache.put(new Request(UPDATE_URL + url), response.clone());
									})
								);
							})(k);
						}
						files = m;
						return Promise.all(changes);
					}),
				(e) => (files = {})
			)
			.then(function() {
				return self.skipWaiting();
			})
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

// 发起请求时去根据uri去匹配缓存，无法命中缓存则发起请求，并且缓存请求
self.addEventListener("fetch", function(event) {
	/** @type {Request} */
	var req = event.request;
	if (!req.url.startsWith("chrome-extension://")) return;
	var url = req.url.replace(/^[^:]+:\/\/[^/]+/, UPDATE_URL);
	var idx = url.indexOf("?");
	if (idx >= 0) url = url.slice(0, idx);
	req = new Request(url);
	var pms = Promise.resolve();
	if (checkAt + UPDATE_FREQ < Date.now()) {
		console.log(checkAt);
		checkAt = Date.now();
		// 检查更新
		pms = fetch(UPDATE_URL + "/files.json")
			.then(function(resp) {
				return resp.json();
			})
			.then(function(m) {
				return caches.open(VERSION).then(function(cache) {
					var changes = [];
					files = files || {};
					for (var k in m) {
						var v = m[k];
						if (v == files[k]) delete files[k];
						else
							(function(req) {
								console.log("update: " + req.url);
								changes.push(
									fetch(req).then(function(response) {
										return cache.put(req, response.clone());
									})
								);
							})(new Request(UPDATE_URL + k));
					}
					for (let k in files) {
						changes.push(cache.delete(k));
					}
					files = m;
					return Promise.all(changes);
				});
			})
			.catch(console.error);
	}
	event.respondWith(
		pms.then(function() {
			return caches.match(req).then(function(resp) {
				return (
					resp ||
					fetch(req).then(function(response) {
						return caches.open(VERSION).then(function(cache) {
							console.log("req: " + req.url);
							cache.put(req, response.clone());
							return response;
						});
					})
				);
			});
		})
	);
});
