let config = {
	version: 10000,
	/** 通知时间 */
	notify_at: 0,
	/** 检查更新时间 */
	upgrade_at: 0,
	/** 掉线通知频率(秒),默认10分钟 */
	notify_freq: 600,
	/** 重试间隔时间(秒),默认10分钟 */
	retry_freq: 600,
	/** 任务循环间隔时间(秒) */
	loop_freq: 5,
	/** 每天几点开始签到,默认8点 */
	begin_at: 28800,
	/** 是否自动更新 */
	upgrade: true,
	/** 检查更新间隔时间(秒) */
	upgrade_freq: 86400,
	/** 任务超时时间 */
	timeout: 60,
	cross: true,
	allow_cross: {},
	cross_header: "",
	/** 开启捐赠, 跳转到京东返利链接 */
	donate: false,
};

export default config;
