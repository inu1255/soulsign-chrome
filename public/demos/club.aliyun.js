// ==UserScript==
// @name              阿里云签到
// @namespace         https://soulsign.inu1255.cn?account=inu1255
// @version           1.0.2
// @author            inu1255
// @loginURL          https://account.aliyun.com/login/qr_login.htm?oauth_callback=https%3A%2F%2Fclub.aliyun.com%2F%23%2F
// @updateURL         https://soulsign.inu1255.cn/script/inu1255/阿里云签到
// @expire            900000
// @domain            club.aliyun.com
// @domain            account.aliyun.com
// @domain            passport.aliyun.com
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

const opts = {headers: {referer: "https://club.aliyun.com/?spm=5176.12825654.amxosvpfn.27.45162c4a6Uuc9T"}};
exports.run = async function(param) {
	var {data} = await axios.get("https://club.aliyun.com/json/UserSignIn.json?signSource=pc&signCompany=aliyun", opts);
	await axios.get("https://club.aliyun.com/json/GetUserSignInfo.json?signSource=pc&signCompany=aliyun", opts);
	if (data.success) return `获得${data.data.todayPoints}金币`;
	throw JSON.stringify(data);
};

exports.check = async function(param) {
	var {data} = await axios.get("https://club.aliyun.com/json/GetUserAllPoint.json", opts);
	if (data.success) return true;
	if (!(param.name && param.pwd)) return false;
	return await open("https://account.aliyun.com/login/qr_login.htm?oauth_callback=https%3A%2F%2Fclub.aliyun.com%2F%23%2F", /** 调试时设置成true */ false, async (fb) => {
		// 获取页面所有iframe
		let frames = await fb.iframes();
		for (let fb of frames) {
			// 定位目标iframe,并模拟登录
			if (fb.url.startsWith("https://passport.aliyun.com/mini_login.htm")) {
				await fb.value("#fm-login-id", param.name);
				await fb.value("#fm-login-password", param.pwd);
				await fb.click(".fm-button.fm-submit.password-login");
				await fb.waitLoaded();
				return true;
			}
		}
		return false;
	});
};
