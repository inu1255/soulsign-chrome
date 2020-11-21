// ==UserScript==
// @name              时光相册签到
// @namespace         https://soulsign.inu1255.cn?account=iosleep
// @version           1.0.0
// @author            iosleep
// @loginURL          https://web.everphoto.cn/#signin
// @updateURL         https://api.everphoto.cn/
// @expire            900000
// @domain            api.everphoto.cn
// @grant            cookie
// ==/UserScript==

exports.run = async function(param) {
var { data } = await axios.post('https://api.everphoto.cn/users/self/checkin/v2');
    if (data.code == 0) {
        if (data.data.checkin_result)
            return `签到成功,共签到${data.data.continuity}天`;
        return `已签到,共签到${data.data.continuity}天`;
    }
    throw '需要登录';
};

exports.check = async function(param) {
var { data } = await axios.post('https://api.everphoto.cn/users/self/checkin/v2');
if (data.code == 0) {
return !data.data.can_checkin;
}
return fasle;
};
