<template>
	<div class="root">
		<mu-appbar color="primary">
			<div @click="go('#')" class="mu-appbar-title">{{ manifest.name }}<small class="sup">{{ manifest.version }}</small></div>
			<mu-button @click="go('#cross')" flat slot="right">跨域管理</mu-button>
			<mu-button @click="go('#')" flat slot="right">脚本管理</mu-button>
			<mu-button @click="go('https://soulsign.inu1255.cn/',1)" flat slot="right">脚本推荐</mu-button>
			<mu-button @click="go('https://donate.inu1255.cn/inu1255/soulsign-chrome',1)" flat slot="right">捐赠</mu-button>
			<mu-button @click="go('https://github.com/inu1255/soulsign-chrome',1)" flat slot="right">源码</mu-button>
		</mu-appbar>
		<br>
		<Cross v-if="path=='cross'"></Cross>
		<mu-container v-else style="margin-bottom: 245px;">
			<div class="tar">
				<mu-button @click="upload()" color="primary">导入脚本</mu-button>
				<mu-button @click="download()" color="primary">导出脚本</mu-button>
				<mu-button @click="clear()" color="primary">清空计数</mu-button>
				<mu-button @click="edit()" color="primary">添加脚本</mu-button>
			</div>
			<br>
			<mu-data-table :sort.sync="sort" :loading="loading" :columns="columns" :data="list" stripe :hover="false">
				<template slot-scope="{row,$index}">
					<td>{{row.author}}</td>
					<td>
						<a class="app" v-if="row.namespace" :href="row.loginURL" target="_blank">{{row.name}}</a>
						<span v-else>{{row.name}}</span>
						<a v-if="row.updateURL" class="nowrap" :href="'#'+row.updateURL">{{ver[row.key]?'更新':'重装'}}</a>
					</td>
					<td>
						<a v-if="ver[row.key]" :href="'#'+row.updateURL">{{row.version}}</a>
						<span v-else>{{row.version}}</span>
					</td>
					<td>
						<span v-for="domain in row.domains" :key="domain" :title="domain">
							<img :src="'chrome://favicon/https://'+domain3(domain)" :alt="domain">
						</span>
					</td>
					<td>
						<a target="_blank" :href="row.loginURL" v-if="row.loginURL&&row.online_at<0">不在线</a>
						<i-date v-else-if="row.online_at>0" :value="row.online_at"></i-date>
						<span v-else>未检查</span>
					</td>
					<td>
						<i-date :value="row.run_at"></i-date>
					</td>
					<td>
						<mu-button flat @click="go(`#details:${$index};`+row.updateURL)" title="查看日志" class="btn" :class="row.success_at>row.failure_at?'green':'red'">
							<div v-html="row.result.summary"></div>
						</mu-button>
					</td>
					<td>
						<i-rate v-if="row.cnt" class="tac" width="72px" :value="row.ok/row.cnt||0">{{row.ok}}/{{row.cnt}}</i-rate>
						<span v-else>未执行</span>
					</td>
					<td>
						<mu-switch :input-value="row.enable" @change="toggle(row)"></mu-switch>
					</td>
					<td>
						<mu-button v-if="row.params" @click="set(row,$index)" title="配置参数" icon small>
							<mu-icon value="settings"></mu-icon>
						</mu-button>
						<mu-button @click="run(row)" title="立即执行" icon small :disabled="running">
							<mu-icon value="play_arrow"></mu-icon>
						</mu-button>
						<mu-button @click="edit(row)" title="编辑" icon small>
							<mu-icon value="edit"></mu-icon>
						</mu-button>
						<mu-button @click="del(row)" title="删除" icon small>
							<mu-icon value="delete"></mu-icon>
						</mu-button>
					</td>
				</template>
			</mu-data-table>
		</mu-container>
		<mu-dialog :width="480" :open="Boolean(body)" :fullscreen="fullscreen" @update:open="body=false">
			<mu-flex align-items="center" wrap="wrap" class="icon-flex-wrap">
				<mu-button @click="pick" color="primary">上传文件</mu-button>
				<div style="flex:1"></div>
				<mu-button style="margin-top:4px;" color="blue" icon @click="fullscreen=!fullscreen">
					<mu-icon :value="fullscreen?'fullscreen_exit':'fullscreen'"></mu-icon>
				</mu-button>
			</mu-flex>
			<mu-text-field style="margin:16px 0 0 0;" v-model="body.code" full-width multi-line :rows="windowRows" placeholder="在这里粘贴代码 或 拖拽脚本文件到这里 或 粘贴脚本URL" @dragover.prevent="()=>0" @drop="drop" @paste="paste"></mu-text-field>
			<mu-button slot="actions" flat color="success" @click="setDebugParam(body.code)">调试参数</mu-button>
			<mu-button slot="actions" flat color="success" @click="testTask('check', body.code)">调试check</mu-button>
			<mu-button slot="actions" flat color="success" @click="testTask('run', body.code)">调试run</mu-button>
			<mu-button slot="actions" flat @click="body=false">取消</mu-button>
			<mu-button slot="actions" flat color="primary" @click="onAdd">保存</mu-button>
		</mu-dialog>
		<div v-show="log" class="console">
			<mu-container>
				<div class="title">
					<span class="h3">{{log.author}}/{{log.name}} - 日志</span>
					<mu-icon class="btn fr" value="close" @click="log=false" :size="16"></mu-icon>
				</div>
				<mu-divider></mu-divider>
				<ul class="scrollY">
					<li v-for="(line,i) in log.logs" :key="i">
						<span class="small">{{line.time|format('YYYY-MM-DD hh:mm:ss')}}</span>
						<span :class="line.type||'info'">{{line.text}}</span>
					</li>
				</ul>
			</mu-container>
		</div>
		<i-form :open.sync="debugTask._params" title="调试参数" :params="debugTask.params" :submit="debugSetting"></i-form>
		<i-form :open.sync="settingTask._params" :title="settingTask.name" :params="settingTask.params" :submit="setting"></i-form>
		<Preview :open.sync="url" @submit="add"></Preview>
		<Details :open.sync="detail.script" :task="tasks[detail.row]"></Details>
	</div>
</template>
<script>
import utils from '../common/client'
import Cross from './pages/Cross.vue'
import Preview from './pages/Preview.vue'
import Details from './pages/Details.vue'
import JSZip from 'jszip'
import beUtils from '../backend/utils'

export default {
	data() {
		return {
			loading: false,
			log: false, // 当前查看log的任务,
			body: false, // 添加/编辑脚本,
			running: false,
			tasks: [],
			sort: { name: '', order: 'asc' },
			url: false, // 导入url,
			detail: { script: false, row: 0 }, // 查看细节日志
			more: false, // 插件推荐,
			path: '',
			settingTask: {
				name: '',
				_params: false,
				params: [],
			},
			debugTaskParam: {},
			debugTask: {
				name: '',
				_params: false,
				params: [],
			},
			config: {},
			ver: {},
			fullscreen: !!localStorage.getItem('fullscreen'), // 代码编辑全屏
			manifest: {},
		}
	},
	watch: {
		fullscreen() {
			localStorage.setItem('fullscreen', this.fullscreen)
		}
	},
	computed: {
		columns() {
			return [{
				title: "作者",
				name: 'author',
				width: 96,
				sortable: true,
			}, {
				title: "脚本名",
				name: 'name',
				sortable: true,
			}, {
				title: "版本",
				name: 'version',
				width: 64,
				sortable: true,
			}, {
				title: '站点',
				name: 'domains',
				width: 72,
				sortable: true,
			}, {
				title: '是否在线',
				name: 'online_at',
				width: 96,
				sortable: true,
			}, {
				title: '最近执行时间',
				name: 'run_at',
				width: 96,
				sortable: true,
			}, {
				title: '执行结果',
				name: 'result',
				sortable: true,
			}, {
				title: '成功次数',
				name: 'ok',
				width: 96,
				sortable: true,
			}, {
				title: "已启用",
				name: 'enable',
				width: 62,
				sortable: true,
			}, {
				title: '操作',
				width: 168,
			}]
		},
		list() {
			this.update_at = Date.now()
			let tasks = this.tasks
			let name = this.sort.name
			let o = this.sort.order == 'asc' ? 1 : -1
			if (name == 'domains') {
				tasks.sort((a, b) => {
					var v = a.domains.length - b.domains.length
					if (v) return o * v
					return o * (a.domains[0] >= b.domains[0] ? 1 : -1)
				})
			} else if (name == 'result') {
				tasks.sort((a, b) => {
					return o * ((a.success_at - a.failure_at) - (b.success_at - b.failure_at))
				})
			} else if (["author", "name", "version",].indexOf(name) >= 0) {
				tasks.sort((a, b) => {
					return o * (a[name] >= b[name] ? 1 : -1)
				})
			} else {
				tasks.sort((a, b) => {
					return o * (a[name] - b[name])
				})
			}
			return tasks
		},
		windowRows() {
			return Math.floor((window.innerHeight - 180) / 24)
		},
	},
	methods: {
		async refresh() {
			let tasks = await utils.request('task/list')
			let oldTasks = []
			for (let task of tasks) {
				task.key = task.author + "/" + task.name
				if (!task.result.summary) oldTasks.push(task)
			}
			for (let task of oldTasks) {
				beUtils.filTask(task)
				beUtils.localSave({ [task.key]: task })
			}
			this.tasks = tasks
			this.manifest = beUtils.getManifest()
		},
		domain3(domain) {
			return domain.split('.').slice(-3).join('.')
		},
		async upgrade() {
			let tasks = this.tasks;
			let map = {}
			for (let task of tasks)
				map[task.key] = '';
			for (let task of tasks) {
				if (task.updateURL) {
					try {
						let { data } = await utils.axios.get(task.updateURL);
						let item = utils.compileTask(data);
						if (0 < (beUtils.compareVersions(item.version, task.version))) {
							map[task.key] = item.version;
						}
					} catch (error) {
						console.error(task.name, '获取更新失败');
					}
				}
			}
			this.ver = map;
		},
		async setting(body) {
			let task = this.settingTask.task //this.tasks[this.settingTask.i]
			Object.assign(task._params, body)
			if (await utils.request('task/set', {
				author: task.author,
				name: task.name,
				_params: task._params,
			})) {
				this.$toast.success(`${this.settingTask.name} 保存成功`)
				this.settingTask._params = false
			} else {
				this.$toast.error(`${this.settingTask.name} 保存失败`)
			}
		},
		debugSetting(body) {
			Object.assign(this.debugTaskParam, body)
		},
		set(task, i) {
			let { name, _params, params } = task
			this.settingTask = { name, _params, params, task }
		},
		run(row) {
			this.$with('running', async () => {
				let prev = row.success_at
				this.$toast.message(`${row.name} 开始执行`)
				let task = await utils.request('task/run', row.author + '/' + row.name);
				if (task) Object.assign(row, task);
				if (row.success_at == prev)
					this.$toast.error(`${row.name} 执行失败`)
				else
					this.$toast.success(`${row.name} 执行成功`)
			})
		},
		async upload() {
			let file = await utils.pick('.soulsign')
			this.$with(async () => {
				try {
					var zip = new JSZip();
					await zip.loadAsync(file)
					var text = await zip.file('config.json').async("string")
					let config = JSON.parse(text);
					await utils.request('config/set', config);
					var text = await zip.file('tasks.json').async("string")
					let tasks = JSON.parse(text)
					let add_cnt = 0;
					let set_cnt = 0;
					for (let task of tasks) {
						if (await utils.request('task/add', task))
							set_cnt++;
						else
							add_cnt++;
					}
					this.$toast.success(`成功导入${add_cnt}条,更新${set_cnt}条`)
				} catch (e) {
					console.error(e)
					this.$toast.error(`导入出错:${e}`)
				}
			})
		},
		async download() {
			let config = await utils.request('config/get')
			var zip = new JSZip();
			zip.file('config.json', JSON.stringify(config));
			zip.file('tasks.json', JSON.stringify(this.tasks));
			let content = await zip.generateAsync({ type: 'blob' })
			utils.download(content, utils.format(Date.now(), 'YYYY-MM-DD_hh-mm-ss.soulsign'))
		},
		async clear() {
			for (let task of this.tasks) {
				let { author, name } = task;
				await utils.request('task/set', {
					author, name,
					ok: 0,
					cnt: 0,
					success_at: 0,
				});
			}
		},
		edit(row) {
			let body = Object.assign({ code: '', _params: {} }, row)
			this.debugTaskParam = Object.assign({}, body._params)
			this.body = body
		},
		async del(row) {
			let { result } = await this.$message.confirm('你确定要删除吗?')
			if (result) utils.request('task/del', row.author + '/' + row.name)
		},
		add(task) {
			this.$with(async () => {
				if (this.url) {
					this.url = false
					location.href = '#'
				}
				try {
					await utils.request('task/add', task)
					this.$toast.success('添加/修改成功')
				} catch (e) {
					console.log(e)
					this.$toast.error(e + '')
				}
				this.body = false
			})
		},
		onAdd() {
			try {
				let task = utils.compileTask(this.body.code)
				this.add(task)
			} catch (error) {
				this.$toast.error(error + '')
			}
		},
		async toggle(row) {
			let { author, name, enable } = row;
			enable = !enable;
			await utils.request('task/set', { author, name, enable })
			row.enable = enable
		},
		async pick() {
			let file = await utils.pick()
			this.body.code = await utils.readAsText(file)
		},
		async drop(e) {
			let files = e.dataTransfer.files;
			if (files.length > 0) {
				e.preventDefault();
				this.body.code = await utils.readAsText(files[0])
				return;
			}
		},
		async paste(e) {
			let isEmpty = this.body.code.trim().length == 0
			if (e.clipboardData.items) {
				var items = e.clipboardData.items;
				for (var i = 0; i < items.length; ++i) {
					var item = items[i];
					if (isEmpty && item.kind == "string" && item.type == "text/plain") {
						item.getAsString(r => {
							if (/^https?:\/\//.test(r)) {
								utils.axios.get(r).then(({ data }) => {
									document.execCommand('undo')
									this.body.code = data
								})
							}
						});
					}
				}
			}
		},
		go(url, flag) {
			if (flag) window.open(url)
			else location.href = url
		},
		created() {
			this.refresh()
		},
		onHashChange() {
			let hash = location.hash.slice(1)
			let match = {}
			if (hash == 'cross') this.path = 'cross'
			else this.path = ''
			if (!!(match = hash.match(/details:([^;]+);(.*)/))) {
				this.detail = { script: match[2], row: match[1] }
			} else if (/^https?:\/\//.test(hash)) this.url = hash
		},
		setDebugParam(text) {
			try {
				let task = utils.buildScript(text)
				let { name, _params, params } = task
				try {
					_params = this.debugTaskParam || {}
				} catch (error) {
					_params = {}
				}
				this.debugTask = { name, _params, params }
			} catch (e) {
				this.$toast.error(`脚本有错误，请查看develop console`)
				console.error(e)
			}
		},
		async testTask(key, text) {
			try {
				let _params = this.debugTaskParam || {};
				let task = utils.buildScript(text)
				let ok = await task[key](_params);
				this.$toast.success(`返回结果: ${ok}`)
				console.log(ok)
			} catch (e) {
				this.$toast.error(`运行出错，请查看develop console`)
				console.error(e)
			}
		},
	},
	components: {
		Preview,
		Cross,
		Details
	},
	mounted() {
		window.addEventListener('hashchange', this.onHashChange)
		this.onHashChange()
		this.refresh().then(() => this.upgrade());
		let prev
		chrome.storage.onChanged.addListener((changes, areaName) => {
			if (areaName == 'local' || areaName == 'sync' && changes.tasks) {
				if (prev) clearTimeout(prev)
				prev = setTimeout(() => {
					this.refresh();
				}, 300);
			}
		})
		if (!chrome.webNavigation) {
			this.$message.confirm('新增模拟登录功能，该功能无法自动更新，是否下载新的插件?').then(({ result }) => {
				if (result) window.open('https://github.com/inu1255/soulsign-chrome#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95')
			})
		}
	}
}
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
}
</style>
