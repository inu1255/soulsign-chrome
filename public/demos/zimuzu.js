// ==UserScript==
// @name              字幕组签到
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.3
// @author            inu1255
// @loginURL          http://www.rrys2019.com/
// @updateURL         https://gitee.com/inu1255/soulsign-chrome/raw/master/public/demos/zimuzu.js
// @expire            900e3
// @domain            www.rrys2019.com
// ==/UserScript==

exports.run = async function() {
    var { data } = await axios.get('http://www.rrys2019.com/user/login/getCurUserTopInfo', { headers: { 'Referer': 'http://www.rrys2019.com/' } });
    if (data.status == 1) {
        if (data.data.new_login)
            return `签到成功,共${data.data.userinfo.point}积分`;
        return `已签到,共${data.data.userinfo.point}积分`;
    }
    throw '需要登录';
};

exports.check = async function() {
    var { data } = await axios.get('http://www.rrys2019.com/user/login/getCurUserTopInfo', { headers: { 'Referer': 'http://www.rrys2019.com/' } });
    return data.status == 1;
};
