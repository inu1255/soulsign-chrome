<template>
	<div class="root">
		<mu-appbar color="primary">
			<div class="mu-appbar-title" @click="go('#')">
				{{ manifest.name }}<small class="sup">{{ manifest.version }}</small>
			</div>
			<mu-button slot="right" flat @click="go('#cross')">跨域管理</mu-button>
			<mu-button slot="right" flat @click="go('#')">脚本管理</mu-button>
			<mu-button slot="right" flat @click="go('https://soulsign.inu1255.cn/', 1)"
				>脚本推荐</mu-button
			>
			<mu-button slot="right" flat @click="go('https://github.com/inu1255/soulsign-chrome', 1)"
				>源码</mu-button
			>
		</mu-appbar>
		<br />
		<Cross v-if="path == 'cross'"></Cross>
		<mu-container v-else style="margin-bottom: 245px">
			<div class="tar head-tools">
				<mu-button color="primary" @click="upload()">导入脚本</mu-button>
				<mu-button color="primary" @click="download()">导出脚本</mu-button>
				<mu-button color="primary" @click="clear()">清空计数</mu-button>
				<mu-button color="primary" @click="edit()">添加脚本</mu-button>
				<mu-button color="primary" @click="recordTask._params = recordTask.def">录制脚本</mu-button>
			</div>
			<br />
			<mu-data-table
				:sort.sync="sort"
				:loading="loading"
				:columns="columns"
				:data="list"
				stripe
				:hover="false"
			>
				<template slot-scope="{row, $index}">
					<td>{{ row.author }}</td>
					<td>
						<a v-if="row.loginURL" class="app" :href="row.loginURL" target="_blank">{{
							row.name
						}}</a>
						<span v-else>{{ row.name }}</span>
						<a v-if="row.updateURL" class="nowrap" :href="'#' + row.updateURL">{{
							ver[row.key] ? "更新" : "重装"
						}}</a>
					</td>
					<td>
						<a v-if="ver[row.key]" :href="'#' + row.updateURL">{{ row.version }}</a>
						<span v-else>{{ row.version }}</span>
					</td>
					<td>
						<span v-for="domain in row.domains" :key="domain" :title="domain">
							<img :src="$icon('https://' + domain3(domain))" :alt="domain" />
						</span>
					</td>
					<td>
						<a v-if="row.loginURL && row.online_at < 0" target="_blank" :href="row.loginURL"
							>不在线</a
						>
						<i-date v-else-if="row.online_at > 0" :value="row.online_at"></i-date>
						<span v-else>未检查</span>
					</td>
					<td>
						<i-date :value="row.run_at"></i-date>
					</td>
					<td>
						<mu-button
							flat
							title="查看日志"
							class="btn"
							:class="row.success_at > row.failure_at ? 'green' : 'red'"
							@click="go(`#details:${$index};` + row.updateURL)"
						>
							<div v-html="row.result.summary"></div>
						</mu-button>
					</td>
					<td>
						<i-rate v-if="row.cnt" class="tac" width="72px" :value="row.ok / row.cnt || 0"
							>{{ row.ok }}/{{ row.cnt }}</i-rate
						>
						<span v-else>未执行</span>
					</td>
					<td>
						<mu-switch :input-value="row.enable" @change="toggle(row)"></mu-switch>
					</td>
					<td>
						<mu-button v-if="row.params" title="配置参数" icon small @click="set(row, $index)">
							<mu-icon value="settings"></mu-icon>
						</mu-button>
						<mu-button title="立即执行" icon small :disabled="running" @click="run(row)">
							<mu-icon value="play_arrow"></mu-icon>
						</mu-button>
						<mu-button title="编辑" icon small @click="edit(row)">
							<mu-icon value="edit"></mu-icon>
						</mu-button>
						<mu-button title="删除" icon small @click="del(row)">
							<mu-icon value="delete"></mu-icon>
						</mu-button>
					</td>
				</template>
			</mu-data-table>
		</mu-container>
		<mu-dialog
			:overlay-close="false"
			:width="480"
			:open="Boolean(body)"
			:fullscreen="fullscreen"
			@update:open="body = false"
		>
			<mu-flex align-items="center" wrap="wrap" class="icon-flex-wrap">
				<mu-button color="primary" @click="pick">上传文件</mu-button>
				<div style="flex: 1"></div>
				<mu-button style="margin-top: 4px" color="blue" icon @click="fullscreen = !fullscreen">
					<mu-icon :value="fullscreen ? 'fullscreen_exit' : 'fullscreen'"></mu-icon>
				</mu-button>
			</mu-flex>
			<prism-editor
				v-model="body.code"
				class="my-editor"
				:highlight="highlighter"
				line-numbers
			></prism-editor>
			<mu-button slot="actions" flat color="success" @click="setDebugParam(body.code)"
				>调试参数</mu-button
			>
			<mu-button slot="actions" flat color="success" @click="testTask('check', body.code)"
				>调试check</mu-button
			>
			<mu-button slot="actions" flat color="success" @click="testTask('run', body.code)"
				>调试run</mu-button
			>
			<mu-button slot="actions" flat @click="body = false">取消</mu-button>
			<mu-button slot="actions" flat color="primary" @click="onAdd">保存</mu-button>
		</mu-dialog>
		<div v-show="log" class="console">
			<mu-container>
				<div class="title">
					<span class="h3">{{ log.author }}/{{ log.name }} - 日志</span>
					<mu-icon class="btn fr" value="close" :size="16" @click="log = false"></mu-icon>
				</div>
				<mu-divider></mu-divider>
				<ul class="scrollY">
					<li v-for="(line, i) in log.logs" :key="i">
						<span class="small">{{ format(line.time) }}</span>
						<span :class="line.type || 'info'">{{ line.text }}</span>
					</li>
				</ul>
			</mu-container>
		</div>
		<i-form
			:open.sync="debugTask._params"
			title="调试参数"
			:params="debugTask.params"
			:submit="debugSetting"
		></i-form>
		<i-form
			:open.sync="settingTask._params"
			:title="settingTask.name"
			:params="settingTask.params"
			:submit="setting"
		></i-form>
		<i-form
			:open.sync="recordTask._params"
			title="脚本录制"
			:params="recordTask.params"
			:submit="record"
		></i-form>
		<Preview :open.sync="url" @submit="add"></Preview>
		<Details :open.sync="detail.script" :task="tasks[detail.row]"></Details>
	</div>
</template>
<script>
import Cross from "./pages/Cross.vue";
import Preview from "./pages/Preview.vue";
import Details from "./pages/Details.vue";
import JSZip from "jszip";
import {getManifest, localSave, sendMessage} from "@/common/chrome";
import {compileTask, filTask, buildScript} from "@/backend/utils";
import compareVersions from "compare-versions";
import {download, format, pick, readFile} from "@/common/utils";
import axios from "@/common/axios";

// import Prism Editor
import {PrismEditor} from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css"; // import the styles somewhere

// import highlighting library (you can use any library you want just return html string)
import {highlight, languages} from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css"; // import syntax highlighting styles

const defaultCode = `
// ==UserScript==
// @name              SCRIPT_NAME
// @version           1.0.0
// @author            SCRIPT_AUTHOR
// @loginURL          https://www.example.com/login
// @expire            300e3
// @domain            example.com
// ==/UserScript==
`;

export default {
	components: {
		Preview,
		Cross,
		Details,
		PrismEditor,
	},
	data() {
		return {
			loading: false,
			log: false, // 当前查看log的任务,
			body: {
				code: defaultCode,
			}, // 添加/编辑脚本,
			running: false,
			tasks: [],
			sort: {name: "", order: "asc"},
			url: false, // 导入url,
			detail: {script: false, row: 0}, // 查看细节日志
			more: false, // 插件推荐,
			path: "",
			settingTask: {
				name: "",
				_params: false,
				params: [],
			},
			debugTaskParam: {},
			debugTask: {
				name: "",
				_params: false,
				params: [],
			},
			config: {},
			ver: {},
			fullscreen: !!localStorage.getItem("fullscreen"), // 代码编辑全屏
			manifest: {},
			recordTask: {
				_params: false,
				def: {mode: 0},
				params: [
					{
						name: "url",
						type: "text",
						label: "签到网址",
					},
					{
						name: "mode",
						label: "录制模式",
						type: "select",
						options: [
							{label: "模拟操作", value: 0},
							{label: "模拟请求(暂未实现)", value: 1},
						],
					},
				],
			},
		};
	},
	computed: {
		columns() {
			return [
				{
					title: "作者",
					name: "author",
					width: 96,
					sortable: true,
				},
				{
					title: "脚本名",
					name: "name",
					sortable: true,
				},
				{
					title: "版本",
					name: "version",
					width: 64,
					sortable: true,
				},
				{
					title: "站点",
					name: "domains",
					width: 72,
					sortable: true,
				},
				{
					title: "是否在线",
					name: "online_at",
					width: 96,
					sortable: true,
				},
				{
					title: "最近执行时间",
					name: "run_at",
					width: 96,
					sortable: true,
				},
				{
					title: "执行结果",
					name: "result",
					sortable: true,
				},
				{
					title: "成功次数",
					name: "ok",
					width: 96,
					sortable: true,
				},
				{
					title: "已启用",
					name: "enable",
					width: 62,
					sortable: true,
				},
				{
					title: "操作",
					width: 168,
				},
			];
		},
		list() {
			// eslint-disable-next-line vue/no-side-effects-in-computed-properties
			this.update_at = Date.now();
			let tasks = this.tasks;
			let name = this.sort.name;
			let o = this.sort.order == "asc" ? 1 : -1;
			if (name == "domains") {
				tasks.sort((a, b) => {
					var v = a.domains.length - b.domains.length;
					if (v) return o * v;
					return o * (a.domains[0] >= b.domains[0] ? 1 : -1);
				});
			} else if (name == "result") {
				tasks.sort((a, b) => {
					return o * (a.success_at - a.failure_at - (b.success_at - b.failure_at));
				});
			} else if (["author", "name", "version"].indexOf(name) >= 0) {
				tasks.sort((a, b) => {
					return o * (a[name] >= b[name] ? 1 : -1);
				});
			} else {
				tasks.sort((a, b) => {
					return o * (a[name] - b[name]);
				});
			}
			return tasks;
		},
		windowRows() {
			return Math.floor((window.innerHeight - 180) / 24);
		},
	},
	watch: {
		fullscreen() {
			localStorage.setItem("fullscreen", this.fullscreen);
		},
	},
	mounted() {
		window.addEventListener("hashchange", this.onHashChange);
		this.onHashChange();
		this.refresh().then(() => this.upgrade());
		let prev;
		chrome.storage.onChanged.addListener((changes, areaName) => {
			if (areaName == "local" || (areaName == "sync" && changes.tasks)) {
				if (prev) clearTimeout(prev);
				prev = setTimeout(() => {
					this.refresh();
				}, 300);
			}
		});
		if (!chrome.webNavigation) {
			this.$message
				.confirm("新增模拟登录功能，该功能无法自动更新，是否下载新的插件?")
				.then(({result}) => {
					if (result)
						window.open(
							"https://github.com/inu1255/soulsign-chrome#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95"
						);
				});
		}
	},
	methods: {
		highlighter(code) {
			return highlight(code, languages.js); // languages.<insert language> to return html with markup
		},
		async refresh() {
			let tasks = await sendMessage("task/list");
			let oldTasks = [];
			for (let task of tasks) {
				task.key = task.author + "/" + task.name;
				if (!task.result.summary) oldTasks.push(task);
			}
			for (let task of oldTasks) {
				filTask(task);
				localSave({[task.key]: task});
			}
			this.tasks = tasks;
			this.manifest = getManifest();
		},
		domain3(domain) {
			return domain.split(".").slice(-3).join(".");
		},
		async upgrade() {
			let tasks = this.tasks;
			let map = {};
			for (let task of tasks) map[task.key] = "";
			for (let task of tasks) {
				if (task.updateURL) {
					try {
						let {data} = await axios.get(task.updateURL);
						let item = compileTask(data);
						if (compareVersions(item.version, task.version) > 0) {
							map[task.key] = item.version;
						}
					} catch (error) {
						console.error(task.name, "获取更新失败");
					}
				}
			}
			this.ver = map;
		},
		async setting(body) {
			let task = this.settingTask.task; // this.tasks[this.settingTask.i]
			Object.assign(task._params, body);
			if (
				await sendMessage("task/set", {
					author: task.author,
					name: task.name,
					_params: task._params,
				})
			) {
				this.$toast.success(`${this.settingTask.name} 保存成功`);
				this.settingTask._params = false;
			} else {
				this.$toast.error(`${this.settingTask.name} 保存失败`);
			}
		},
		debugSetting(body) {
			Object.assign(this.debugTaskParam, body);
		},
		set(task, i) {
			let {name, _params, params} = task;
			this.settingTask = {name, _params, params, task};
		},
		run(row) {
			this.$with("running", async () => {
				let prev = row.success_at;
				this.$toast.message(`${row.name} 开始执行`);
				let task = await sendMessage("task/run", row.author + "/" + row.name);
				if (task) Object.assign(row, task);
				if (row.success_at == prev) this.$toast.error(`${row.name} 执行失败`);
				else this.$toast.success(`${row.name} 执行成功`);
			});
		},
		async upload() {
			let file = await pick(".soulsign");
			this.$with(async () => {
				try {
					var zip = new JSZip();
					await zip.loadAsync(file);
					var text = await zip.file("config.json").async("string");
					let config = JSON.parse(text);
					await sendMessage("config/set", config);
					var text = await zip.file("tasks.json").async("string");
					let tasks = JSON.parse(text);
					let add_cnt = 0;
					let set_cnt = 0;
					for (let task of tasks) {
						if (await sendMessage("task/add", task)) set_cnt++;
						else add_cnt++;
					}
					this.$toast.success(`成功导入${add_cnt}条,更新${set_cnt}条`);
				} catch (e) {
					console.error(e);
					this.$toast.error(`导入出错:${e}`);
				}
			});
		},
		async download() {
			let config = await sendMessage("config/get");
			var zip = new JSZip();
			zip.file("config.json", JSON.stringify(config));
			zip.file("tasks.json", JSON.stringify(this.tasks));
			let content = await zip.generateAsync({type: "blob"});
			download(content, format("YYYY-MM-DD_hh-mm-ss.soulsign"));
		},
		async clear() {
			for (let task of this.tasks) {
				let {author, name} = task;
				await sendMessage("task/set", {
					author,
					name,
					ok: 0,
					cnt: 0,
					success_at: 0,
				});
			}
		},
		edit(row) {
			let body = Object.assign({code: defaultCode, _params: {}}, row);
			this.debugTaskParam = Object.assign({}, body._params);
			this.body = body;
		},
		async del(row) {
			let {result} = await this.$message.confirm("你确定要删除吗?");
			if (result) sendMessage("task/del", row.author + "/" + row.name);
		},
		add(task) {
			this.$with(async () => {
				if (this.url) {
					this.url = false;
					location.href = "#";
				}
				try {
					await sendMessage("task/add", task);
					this.$toast.success("添加/修改成功");
				} catch (e) {
					console.log(e);
					this.$toast.error(e + "");
				}
				this.body = false;
			});
		},
		onAdd() {
			try {
				let task = compileTask(this.body.code);
				this.add(task);
			} catch (error) {
				this.$toast.error(error + "");
			}
		},
		async toggle(row) {
			let {author, name, enable} = row;
			enable = !enable;
			await sendMessage("task/set", {author, name, enable});
			row.enable = enable;
		},
		async pick() {
			let file = await pick();
			this.body.code = await readFile(file);
		},
		async drop(e) {
			let files = e.dataTransfer.files;
			if (files.length > 0) {
				e.preventDefault();
				this.body.code = await readFile(files[0]);
			}
		},
		async paste(e) {
			let isEmpty = this.body.code.trim().length == 0;
			if (e.clipboardData.items) {
				var items = e.clipboardData.items;
				for (var i = 0; i < items.length; ++i) {
					var item = items[i];
					if (isEmpty && item.kind == "string" && item.type == "text/plain") {
						item.getAsString((r) => {
							if (/^https?:\/\//.test(r)) {
								axios.get(r).then(({data}) => {
									document.execCommand("undo");
									this.body.code = data;
								});
							}
						});
					}
				}
			}
		},
		go(url, flag) {
			if (flag) window.open(url);
			else location.href = url;
		},
		created() {
			this.refresh();
		},
		onHashChange() {
			let hash = location.hash.slice(1);
			let match = {};
			if (hash == "cross") this.path = "cross";
			else this.path = "";
			if ((match = hash.match(/details:([^;]+);(.*)/))) {
				this.detail = {script: match[2], row: match[1]};
			} else if (/^https?:\/\//.test(hash)) this.url = hash;
		},
		setDebugParam(text) {
			try {
				let task = buildScript(text);
				let {name, _params, params} = task;
				try {
					_params = this.debugTaskParam || {};
				} catch (error) {
					_params = {};
				}
				if (!params) return this.$toast.error(`脚本设置 @param 参数`);
				this.debugTask = {name, _params, params};
			} catch (e) {
				this.$toast.error(`脚本有错误，请查看develop console`);
				console.error(e);
			}
		},
		async testTask(key, text) {
			try {
				let _params = this.debugTaskParam || {};
				let task = buildScript(text);
				let ok = await task[key](_params);
				this.$toast.success(`返回结果: ${ok}`);
				console.log(ok);
			} catch (e) {
				this.$toast.error(`运行出错，请查看develop console`);
				console.error(e);
			}
		},
		async record(body) {
			let m = /^https?:\/\/([^\/]+)/.exec(body.url);
			if (!m) return this.$toast.error(`URL格式不正确`);
			let domains = new Set([m[1]]);
			sendMessage("record/start", body);
			window.onfocus = async () => {
				let code = await sendMessage("record/end");
				window.onfocus = null;
				code.replace(/https?:\/\/([^\/]+)/g, function (x0, x1) {
					domains.add(x1);
				});
				code = `// ==UserScript==
// @name              ${m[1]}
// @version           1.0.0
// @author            魂签录制
// @loginURL          ${body.url}
// @expire            300e3
${Array.from(domains)
	.map((x) => `// @domain            ${x}`)
	.join("\n")}
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

exports.run = async function(param) {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open(${JSON.stringify(body.url)}, /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		${code.split("\n").join("\n\t\t")}
		return "签到成功";
	});
};

exports.check = async function(param) {
	return true;
};
`;
				this.edit({code});
			};
		},
		format(v) {
			return format("YYYY-MM-DD hh:mm:ss", v);
		},
	},
};
</script>
<style lang="less">
.root {
	td button.mu-button.btn.mu-flat-button {
		height: auto;
		line-height: unset;
		min-width: unset;
		font-size: unset;
		text-transform: none;
	}
	a.ok {
		color: #4caf50;
	}
	a.error {
		color: #f44336;
	}
	a.app {
		color: #000;
		text-decoration: underline;
	}
	td img {
		height: 20px;
		margin: 0 1px;
	}
	.console {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 240px;
		background: #eee;
		border-top: 1px solid #555;
		ul {
			padding: 0;
			margin: 0;
			height: 216px;
		}
		li {
			list-style: none;
			.small {
				color: #aaa;
			}
			> .info {
				color: #00c853;
			}
			> .error {
				color: #f44336;
			}
			> .warning {
				color: #ffeb3b;
			}
		}
	}
	.head-tools {
		.mu-button {
			margin-left: 10px;
		}
	}
}
/* required class */
.my-editor {
	background: #2d2d2d;
	color: #ccc;

	/* you must provide font-family font-size line-height. Example: */
	font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
	font-size: 14px;
	line-height: 1.5;
	padding: 5px;
	height: 600px;
}

/* optional class for removing the outline */
.prism-editor__textarea:focus {
	outline: none;
}
</style>
