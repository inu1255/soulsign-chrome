// ==UserScript==
// @name              freeperson
// @namespace         https://soulsign.inu1255.cn?account=iosleep
// @version           1.0.0
// @author            iOSleep
// @loginURL          https://freeperson.xyz/user
// @updateURL         https://raw.githubusercontent.com/iOSleep/soulsign-chrome/master/public/demos/zyrs.js
// @expire            14400000
// @domain            freeperson.xyz
// ==/UserScript==

exports.run = async function(param) {
    var { data } = await axios.get('https://freeperson.xyz/user');
    if (/已签到/.test(data)) return "已经签到";
    var { data } = await axios.post('https://freeperson.xyz/user/checkin');
    if (/您获得了/.test(data)) return '签到成功';
    if (data.ret == 0) {
        return data.msg;
    }
    throw '签到失败';
};

exports.check = async function(param) {
    var { data } = await axios.get('https://freeperson.xyz/user');
    if (/已签到/.test(data)) return "已经签到";
    if (!m) return false;
};