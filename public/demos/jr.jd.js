// ==UserScript==
// @name              京东金融PC
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.3
// @author            inu1255
// @loginURL          http://passport.jd.com/new/login.aspx
// @updateURL         https://soulsign.inu1255.cn/script/inu1255/%E4%BA%AC%E4%B8%9C%E9%87%91%E8%9E%8DPC.js
// @expire            900e3
// @domain            vip.jr.jd.com
// @domain            passport.jd.com
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

exports.run = async function() {
	var {data} = await axios.post("https://vip.jr.jd.com/newSign/doSign", null, {headers: {Referer: "https://vip.jr.jd.com/"}});
	if (data.signSuccess) return "签到成功";
	throw data.message;
};

exports.check = async function(param) {
	var {data} = await axios.post("https://vip.jr.jd.com/newSign/doSign", null, {headers: {Referer: "https://vip.jr.jd.com/"}});
	if (data.signSuccess) return true;
	if (!(param.name && param.pwd)) return false;
	// 使用浏览器打开登录界面，并获取窗口句柄
	await open("http://passport.jd.com/new/login.aspx", /** 调试时设置成true */ false, async (fb) => {
		// 点击 【账号登录】
		await fb.click(".login-tab.login-tab-r", 10);
		// 等待 1 秒
		await tools.sleep(1e3);
		// 输入账号密码
		await fb.value("#loginname", param.name);
		await fb.value("#nloginpwd", param.pwd);
		// 点击登录
		await fb.click("#loginsubmit");
		// 等待跳转完成
		await fb.waitLoaded();
		// 登录结束，释放句柄，关闭窗口
	});
	return true;
};
