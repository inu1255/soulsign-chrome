import config from './config';
import utils from './utils';
import scriptbuild from './scriptbuild';

export default {
	"config/get"() {
		return config;
	},
	"config/set"(body) {
		Object.assign(config, body)
		return utils.syncSave({ config });
	},
	"task/list"() {
		return utils.getTasks();
	},
	"task/del"(name) {
		return utils.delTask(name)
	},
	"task/add"(task) {
		return utils.addTask(scriptbuild(task))
	},
	"task/set"(task) {
		return utils.setTask(task)
	},
	"task/run"(name) {
		return utils.runTask(name)
	},
}