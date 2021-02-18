// ==UserScript==
// @name              飞客PC
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.0
// @author            badass
// @loginURL          https://www.flyertea.com
// @updateURL         https://gitee.com/inu1255/soulsign-chrome/raw/master/public/demos/flyer.tea.js
// @expire            900e3
// @domain            www.flyertea.com
// @domain            u.flyertea.com
// ==/UserScript==

exports.run = async function() {
        var { data } = await axios.get('https://www.flyertea.com/portal.php');
        if(/已签到/.test(data)){
            return '已签到';
        }else if(/登录/.test(data)){
            return '请登陆';
        }
        var urlArray = /showWindow\(\'qiandao\', \'(.*?)\'\, \'get\', 0\)/.exec(data)
        console.log(urlArray);
        var getUri = "https://www.flyertea.com/"+urlArray[1];
        var temp = document.createElement("div"); 
        temp.innerHTML = getUri; 
        getUri = temp.innerText || temp.textContent; 
        var { data } = await axios.get(getUri);
        if (/签到成功/.test(data)){
            return '签到成功';
        } else{
            throw '失败';
        }
};


