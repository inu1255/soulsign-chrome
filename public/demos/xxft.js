// ==UserScript==
// @name              星星饭团
// @namespace         https://soulsign.inu1255.cn?account=iosleep
// @version           1.0.0
// @author            iOSleep
// @loginURL          https://xxft.cc/
// @updateURL         https://raw.githubusercontent.com/iOSleep/soulsign-chrome/master/public/demos/xxft.js
// @expire            900000
// @domain            xxft.cc
// @grant            cookie
// ==/UserScript==

exports.run = async function (param) {
    var { data } = await axios.post('https://xxft.cc/user/checkin');
    if (data.ret == 1 || data.ret == 0) {
        return data.msg;
    }
    throw '需要登录';
};

exports.check = async function (param) {
    var { data } = await axios.post('https://xxft.cc/user/checkin');
    if (data.ret == 1 || data.ret == 0) {
        return data.msg;
    }
    if (data.msg) throw data.msg;
    throw '需要登录';  
};