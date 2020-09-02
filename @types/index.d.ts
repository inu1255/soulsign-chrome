interface FrameRunner {
	/** 初始url不会随页面跳转更新 */
	url: string;
	/** 执行脚本(仅返回可以序列化的对象) */
	eval(code: string): Promise<any>;
	/** 等待元素出现, 每次重试间隔1秒 */
	waitUntil(selector: string, retryCount = 10): Promise<boolean>;
	/** 等待页面跳转结束 */
	waitLoaded(timeout?: number): Promise<boolean>;
	/** 点击元素, 如果元素不存在则waitUntil */
	click(selector: string, retryCount = 10): Promise<boolean>;
	/** 设置元素value, 如果元素不存在则waitUntil */
	value(selector: string, value: string, retryCount = 10): Promise<boolean>;
	/** 获取页面的所有iframe页面 */
	iframes(): Promise<FrameRunner[]>;
}
/** 使用浏览器打开页面
 * @param url
 * @param devMode 是否开发模式(窗口会显示出来,否则窗口会隐藏)
 * @param cb 回调，返回promise,promise结束后窗口会关闭
 */
declare function open<T>(url: string, devMode: boolean, cb: (fb: FrameRunner) => Promise<T>): Promise<T>;
declare namespace tools {
	declare function version(ver: string, extVer?: string): 0 | -1 | 1;
	declare function sleep(ms: number): Promise<void>;
}
