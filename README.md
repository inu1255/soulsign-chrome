### 功能

自动签到,每天只要打开浏览器就可以自动签到,不用填写账号密码,不用手动抓取cookie,只需要 添加脚本+登录账号

### 使用方法

1. 手动安装: 下载[build.zip](https://github.com/inu1255/soulsign-chrome/blob/master/build.zip)并解压，选项->更多工具->扩展程序->开发者模式->加载已解压的扩展程序
2. [chrome网上应用店安装](https://chrome.google.com/webstore/detail/%E9%AD%82%E7%AD%BE/llbielhggjekmfjikgkcaloghnibafdl?hl=zh-CN)

**firefox** [安装](https://addons.mozilla.org/zh-CN/firefox/addon/%E9%AD%82%E7%AD%BE/)

### 安装脚本

1. 最简单的方法，点击插件图标->任务管理->脚本推荐->挑选安装
2. 第三方或者自用脚本安装方法, 点击插件图标->任务管理->添加脚本->上传脚本文件/粘贴脚本代码/拖拽脚本文件/粘贴脚本链接

### 更新:

20181207: 支持用户填写参数,用于用户填写账号密码进行自动登录的场景。使用方法参考 `public/demos/m.jd.js`, 需要版本1.0.4+
![示例](https://ww1.sinaimg.cn/large/bfdf4e9fly1fy2smvzik7j20tt0bbwgk)
20190326: 支持引用外部js,支持获取指定网页的cookie
[示例/public/demo/xiami.js](https://github.com/inu1255/soulsign-chrome/blob/master/public/demos/xiami.js)  
20190428: 支持域名模糊匹配, *.baidu.com 将匹配 xxoo.baidu.com 或 www.baidu.com 但不能匹配 baidu.com  
20191205: 代码重构，清理了一些逻辑，将任务管理等操作统一到了后端，保证数据一至性；增加导入导出功能；增强脚本安全性，新增@grant用于权限申请  
20191208: 增加了返利捐赠开关, 访问`https://www.jd.com/`时将跳转到作者的返利链接  
20191218: 优化代码结构,支持脚本导出/导入,增加脚本网站  

### 计划:

1. ~~低版本支持(自带babel)~~ 无明显需求,所以放弃
1. 脚本更新(手动/自动) ✅
1. [脚本发布站点](https://soulsign.inu1255.cn) ✅

### 脚本开发

示例:
``` javascript
// ==UserScript==
// @name              v2ex签到
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.0
// @author            inu1255
// @loginURL          https://www.v2ex.com/signin
// @expire            900e3
// @domain            www.v2ex.com
// ==/UserScript==

/**
 * 签到接口，可以使用axios库发起请求,请求url域名必须通过@domain声明
 * throw 签到失败并抛出失败原因
 * return 签到成功并返回成功信息
 */
exports.run = async function() {
    var ret = await axios.get('https://www.v2ex.com/mission/daily');
    if (ret.status != 200) throw '需要登录';
    if (/每日登录奖励已领取/.test(ret.data)) return '已领取';
    let m = /redeem\?once=(.*?)'/.exec(ret.data);
    if (!m) throw '失败1';
    await axios.get('https://www.v2ex.com/mission/daily/redeem?once=' + m[1]);
    var ret = await axios.get('https://www.v2ex.com/mission/daily');
    if (/每日登录奖励已领取/.test(ret.data)) return '成功';
    throw '失败2';
};

/**
 * 检查是否在线接口，可以使用axios库发起请求,请求url域名必须通过@domain声明
 * return true 代表在线
 */
exports.check = async function() {
    var ret = await axios.get('https://www.v2ex.com/mission/daily');
    return ret.status == 200;
};
```

说明:
1. 前面的 ==UserScript== 不可少
1. @name              脚本名称  
1. @namespace         脚本官方网址
1. @version           脚本版本
1. @author            脚本作者
1. @loginURL          登录链接(帮助用户通过这个链接去登录)
1. @expire            会话过期时间(毫秒),系统会隔一段时间调用一次check接口检查在线状态并保持会话活跃
1. @domain            请求域名(向用户申明该脚本会访问的域名)
1. @domain            另一个请求域名(@domain支持多个)
1. @param             参数键 [参数类型,选填,默认text] 参数说明
1. (@author,@name)唯一确定一个脚本,重复会被当成一个脚本
1. 后面的 ==/UserScript== 不可少

更多[demos](https://github.com/inu1255/soulsign-chrome/tree/master/public/demos)  
<small>ps: 作者自己写的脚本用到了async/await不支持低版本浏览器</small>

### 思路

作者以前用[puppeteer](https://github.com/GoogleChrome/puppeteer#readme)做过一套签到工具，用nodejs做过签到站点，不过两者都有一个短板--拿cookie不方便。做成插件的好处就是不用管理cookie,插件不用记录cookie信息,用户不用抓取cookie只需要在浏览器登录账号就行了。

