import Vue from 'vue';
import Root from './Root.vue';

import 'muse-ui/dist/muse-ui.css';
import MuseUI from 'muse-ui';
Vue.use(MuseUI);
// Helpers
import Helpers from 'muse-ui/lib/Helpers';
Vue.use(Helpers);
// 进度条
import 'muse-ui-progress/dist/muse-ui-progress.css';
import MuseUIProgress from 'muse-ui-progress';
Vue.use(MuseUIProgress, {
	color: 'red'
});
// toast
import Toast from 'muse-ui-toast';
Vue.use(Toast, {
	position: 'top'
});
// loading
import 'muse-ui-loading/dist/muse-ui-loading.css'; // load css
import Loading from 'muse-ui-loading';
Vue.use(Loading);
// 提示框
import 'muse-ui-message/dist/muse-ui-message.css';
import Message from 'muse-ui-message';
Vue.use(Message);
import '../components';
import '../common/extends';
import '../common/base.less';

Vue.config.productionTip = false;

import VueClipboard from 'vue-clipboard2';
Vue.use(VueClipboard);
VueClipboard.config.autoSetContainer = true;

/* eslint-disable no-new */
let vue = new Vue({
	el: '#root',
	render: h => h(Root)
});

var link = document.createElement('link');
link.type = 'text/css';
link.rel = 'stylesheet';
link.href = 'https://cdn.bootcss.com/material-design-icons/3.0.1/iconfont/material-icons.css';
document.head.appendChild(link);