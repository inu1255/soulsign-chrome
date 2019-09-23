// ==UserScript==
// @name            Pter
// @namespace       https://github.com/inu1255/soulsign-chrome
// @version         1.0.0
// @author          sununs
// @loginURL        https://pter.club
// @updateURL       https://gitee.com/inu1255/soulsign-chrome/raw/master/public/demos/pter.js
// @expire          14400e3
// @domain          pter.club
// ==/UserScript==

exports.run = async function() {
    var { data,status } = await axios.get('https://pter.club/attendance-ajax.php');
    if (data.status== 1) return '签到成功';
    if (data.status== 0) return '今日已签';
    throw data.error_msg || "失败";
};

exports.check = async function() {
    var { data } = await axios.get('https://pter.club/index.php');
    return /欢迎回来/.test(data);
};
