// ==UserScript==
// @name              几鸡签到
// @namespace         https://soulsign.inu1255.cn?account=iosleep
// @version           1.0.0
// @author            iOSleep
// @loginURL          https://j01.space/user
// @updateURL         https://raw.githubusercontent.com/iOSleep/soulsign-chrome/master/public/demos/jiji.js
// @expire            900000
// @domain            j01.space
// @grant            cookie
// ==/UserScript==

exports.run = async function (param) {
    var { data } = await axios.post('https://j01.space/user/checkin');
    // console.log(data);
    if (data.ret == 1) {
        if (/获取/.test(data)) return "签到成功";
    } else if (data.ret == 500) {
        return "签到过了";
    }
    throw '需要登录';
};

exports.check = async function (param) {
    var { data } = await axios.get('https://j01.space/xiaoma/get_user');
    if (data.code == 200) {
        let last = data.data.last_check_in_time * 1000;
        if (new Date(last).toDateString() === new Date().toDateString()) {
            return "签到过了";
        }
        throw '需要登录';
    }
    throw '需要登录';
};
