import utils from '../common/utils';
import scriptbuild from './scriptbuild';
// chrome.storage.sync = chrome.storage.local;
const TASK_EXT = {
	online_at: 0,
	run_at: 0,
	success_at: 0,
	failure_at: 0,
	result: '',
	enable: true,
	ok: 0,
	cnt: 0,
	_params: {},
};

function localSave(data) {
	return new Promise(function(resolve, reject) {
		if (utils.isFirefox) data = JSON.parse(JSON.stringify(data));
		chrome.storage.local.set(data, resolve)
	});
}

function localGet(keys) {
	return new Promise(function(resolve, reject) {
		chrome.storage.local.get(keys, function(data) {
			if (typeof keys === "string") resolve(data[keys])
			else resolve(data)
		});
	});
}

function syncSave(data) {
	return new Promise(function(resolve, reject) {
		if (utils.isFirefox) data = JSON.parse(JSON.stringify(data));
		chrome.storage.sync.set(data, resolve)
	});
}

function syncGet(keys) {
	return new Promise(function(resolve, reject) {
		chrome.storage.sync.get(keys, function(data) {
			if (typeof keys === "string") resolve(data[keys])
			else resolve(data)
		});
	});
}

let cacheTasks
/**
 * @returns {Promise<soulsign.Task[]>}
 */
function getTasks() {
	return new Promise(function(resolve, reject) {
		if (cacheTasks) return resolve(cacheTasks);
		chrome.storage.sync.get('tasks', ({ tasks: names }) => {
			if (!names || !names.length) return resolve(cacheTasks = []);
			chrome.storage.local.get(names, function(tmap) {
				let tasks = []
				for (let name of names) {
					try {
						tasks.push(scriptbuild(tmap[name]));
					} catch (e) {
						console.error(`脚本${name}错误`, e);
					}
				}
				resolve(cacheTasks = tasks);
			})
		})
	});
}

/**
 * @param {string[]} names 
 */
function saveTaskNames(names) {
	return syncSave({ tasks: names });
}

/**
 * @param {soulsign.Task} task 
 * @returns {boolean} exist
 */
function addTask(task) {
	if (typeof task.run != 'function' && typeof task.check != 'function')
		return Promise.reject('脚本需要run/check函数')
	return getTasks().then(tasks => {
		let exist = false;
		for (let i = 0; i < tasks.length; i++) {
			let oldtask = tasks[i];
			if (oldtask.name == task.name && oldtask.author == task.author) {
				for (let k in TASK_EXT) { // 复制原有变量
					if (task[k] == null || TASK_EXT[k] != null)
						task[k] = oldtask[k];
				}
				tasks.splice(i, 1, task);
				exist = true;
				break;
			}
		}
		let pms = Promise.resolve()
		let name = task.author + '/' + task.name
		if (!exist) {
			pms = localGet(name).then(oldtask => {
				if (oldtask) {
					for (let k in TASK_EXT) { // 复制原有变量
						if (task[k] == null || TASK_EXT[k] != null)
							task[k] = oldtask[k];
					}
				}
				tasks.push(task)
			})
		}
		return pms.then(() => Promise.all([
			saveTaskNames(tasks.map(x => x.author + '/' + x.name)),
			localSave({
				[name]: task
			}),
		]).then(() => exist));
	});
}

/**
 * @param {string} name 
 * @returns {Promise<soulsign.Task>}
 */
function getTask(name) {
	return getTasks().then(tasks => {
		for (let task of tasks) {
			if (task.author + '/' + task.name == name)
				return task;
		}
	})
}

/**
 * @param {string} name 
 * @returns {boolean} exist
 */
function delTask(name) {
	return getTasks().then(tasks => {
		let names = tasks.map(x => x.author + '/' + x.name);
		let exist = false;
		for (let i = 0; i < names.length; i++) {
			if (name == names[i]) {
				tasks.splice(i, 1);
				names.splice(i, 1);
				exist = true;
				break;
			}
		}
		if (exist) return saveTaskNames(names).then(() => exist);
		return exist;
	})
}

/**
 * @param {string|soulsign.Task} task 
 * @returns {soulsign.Task}
 */
async function runTask(task) {
	if (typeof task === "string")
		task = await getTask(task);
	let now = Date.now(),
		result = "";
	task.run_at = now;
	task.cnt++;
	console.log(task.name, '开始签到');
	try {
		result = await task.run(task._params);
		task.success_at = now;
		task.ok++;
		console.log(task.name, '签到成功');
	} catch (err) {
		result = (err || '失败');
		task.failure_at = now;
		console.error(task.name, '签到失败', err);
	}
	task.result = await task.filter(result);
	return task;
}

/**
 * @param {soulsign.Task} task 
 */
function setTask(task) {
	let name = task.author + '/' + task.name;
	return getTask(name).then(function(oldtask) {
		if (oldtask) {
			Object.assign(oldtask, task)
			localSave({
				[name]: oldtask
			});
		}
		return !!oldtask;
	})
}

export default Object.assign({}, utils, {
	TASK_EXT,
	getTasks,
	addTask,
	setTask,
	delTask,
	getTask,
	runTask,
	localSave,
	localGet,
	syncSave,
	syncGet,
});