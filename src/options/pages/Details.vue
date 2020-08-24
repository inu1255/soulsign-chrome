<template>
	<mu-dialog v-if="!!task" title="细节/日志" v-loading="loading" :open="Boolean(open)" @update:open="close" class="pages-details" scrollable>
		<mu-sub-header>脚本名称</mu-sub-header>
        <mu-list-item-content>
			<mu-list-item-title>{{ task.name }}</mu-list-item-title>
        </mu-list-item-content>
		<mu-divider></mu-divider>
		<mu-sub-header>
			<mu-tooltip :content="'点击表单可展开更多内容，点击域名可跳转相应网址'" :placement="'top'">
				<mu-flex>
					域名列表
				</mu-flex>
			</mu-tooltip>
		</mu-sub-header>
		<mu-data-table selectable="true" select-all="true" :selects.sync="selects.chip" checkbox stripe :checkbox-col-width="20" :columns="columns" :data="task.result.detail">
			<template slot="expand" slot-scope="{row}">
				<div class="detail-full" style="padding: 6px;">
    				<json-view :deep="1" :data="row"/>
				</div>
			</template>
			<template slot-scope="{row}">
				<td>
					<div class="detail-icon">
						<mu-avatar :size="20">
							<img :src="'chrome://favicon/'+row.url">
						</mu-avatar>
					</div>
				</td>
				<td>
					<div class="detail-domain" style="padding: 12px;">
						<a :href="row.url" target="_blank" @click.stop>
							<span>{{ row.domain }}</span>
						</a>
					</div>
				</td>
				<td>
					<div class="detail-message" style="padding: 12px;">
						<div :class="'errno_'+Number(row.errno)" v-html="row.message"></div>
					</div>
				</td>
			</template>
		</mu-data-table>
		<mu-flex v-if="selects.chip.length" align-items="center" style="padding: 8px;" wrap="wrap" fill>
			<mu-flex align-items="start" justify-content="start" fill wrap="wrap">
				<mu-tooltip :content="'配置复制内容'" :placement="'left'">
					<mu-flex align-items="center" justify-content="center">
						<mu-button class="copy-config" flat color="primary" slot="action" @click="copyConfig">
							<mu-icon value="filter_4"></mu-icon>
						</mu-button>
					</mu-flex>
				</mu-tooltip>
			</mu-flex>
			<mu-flex class="select-chip" align-items="center" justify-content="center" fill wrap="wrap">
				<mu-chip delete v-for="index in selects.chip" @delete="selectRemove(index)" :key="index">
					<mu-avatar class="select-icon" :size="20">
						<img :src="'chrome://favicon/'+task.result.detail[index].url">
					</mu-avatar>
				</mu-chip>
			</mu-flex>
			<mu-flex align-items="end" justify-content="end" fill wrap="wrap">
				<mu-tooltip :content="'复制'" :placement="'right'">
					<mu-flex align-items="center" justify-content="center">
						<mu-button class="copy-button" flat color="primary" slot="action" @click="copySelect(task.result.detail)">
							<mu-icon value="content_copy"></mu-icon>
						</mu-button>
					</mu-flex>
				</mu-tooltip>
			</mu-flex>
			<mu-divider v-if="configCopy"></mu-divider>
			<mu-flex v-if="configCopy" align-items="center" justify-content="center" fill>
				<mu-select class="copy-select" label="选择你要复制的属性" v-model="selects.copy" chips multiple tags>
					<mu-option v-for="item in itemDetail" :key="item" :label="item" :value="item"></mu-option>
				</mu-select>
			</mu-flex>
		</mu-flex>
	</mu-dialog>
</template>
<script>
import jsonView from 'vue-json-views'

export default {
	name: "Details",
	props: {
		open: {},
		task: {},
	},
	data() {
		return {
			active: 0,
			loading: false,
			columns: [
				{ title: "图标", name: "ico", width: 20, align: "center" },
				{ title: "域名", name: "domain", width: 100, align: "center" },
				{ title: "消息", name: "message", width: 200, align: "center" },
			],
			selects: {
				chip: [],
				copy: ["url", "domain", "message", "errno"],
			},
			configCopy: false,
			itemDetail: [],
		};
	},
	watch: {
		open() {
			this.refresh();
		},
	},
	methods: {
		async refresh() {
			if (!this.open || !this.task) return;
			this.$with(async () => {
				try {
					this.copyConfig(true);
					this.configCopy = false;
					for (let item in this.task.result.detail[0]) this.itemDetail.push(item);
					this.$toast.info('点击表单可展开更多内容，点击域名可跳转相应网址');
				} catch (error) {
					this.$toast.error(error + "");
					this.close();
				}
			});
		},
		close() {
			location.href = "#";
			this.$emit("update:open", false);
			this.selects.chip.length = 0;
			this.itemDetail.length = 0;
		},
		copySuccess(e) {
			this.$toast.success("复制成功，请注意个人信息安全");
			console.log("你刚刚复制成功，请注意个人信息安全:", e.text);
		},
		copyError(e) {
			this.$toast.error("复制失败");
			console.log("你刚刚的复制发生了错误:", e);
		},
		copySelect(list) {
			let message = "";
			for (let idx = 0; idx < this.selects.chip.length; idx++) {
				let item = list[this.selects.chip[idx]];
				if (idx) message += ",";
				if ("object" != typeof item) message += item;
				else {
					let item_picked = {};
					for (let ix = 0; ix < this.selects.copy.length; ix++) {
						item_picked[this.selects.copy[ix]] = item[this.selects.copy[ix]];
					}
					message += JSON.stringify(item_picked);
				}
			}
			this.$copyText("[" + message + "]").then(this.copySuccess, this.copyError);
		},
		copyConfig(config) {
			if (true === config || this.configCopy) this.selects.copy = ["url", "domain", "message", "errno"];
			if (true !== config) this.configCopy = !this.configCopy;
		},
		selectRemove(index) {
			const index_sr = this.selects.chip.indexOf(index);
			this.selects.chip.splice(index_sr, 1);
		},
	},
	mounted() {
		if (this.open) this.refresh();
	},
	components: {
		jsonView,
	},
}
</script>
<style lang="less">
.pages-details {
	.mu-sub-header {
		padding-left: initial;
	}
    .mu-dialog {    
		width: 900px;
    	max-width: 85%;
    	font-size: initial;
	}
	.mu-table.mu-table-flex {
		max-height: 75%;
	}
	table.mu-table-header,
    table.mu-table-body {
        width: -webkit-fill-available!important;
	}
	span.mu-chip {
		line-height: initial;
    	margin: 4px;
		background-color: rgba(33, 150, 243, 0.3);
	}
	.mu-chip .mu-avatar {
		margin : 0 0 0 -4px;
	}
	.mu-chip.mu-inverse {
		margin: 4px 4px 8px 0;
	}
	.mu-expansion-panel-header div {
		color: rgba(0, 0, 0, 0.54);
	}
	.mu-input.has-label .mu-input-label {
		color: #a4a4a4;
	}
	.mu-input.has-label.no-empty-state {
		padding-bottom: 0px;
		width: -webkit-fill-available;
	}
	.mu-button.mu-flat-button.mu-primary-text-color {
		width: -webkit-fill-available;
	}
	.copy-config,
	.copy-button {
		border-radius: 16px;
	}
	.select-chip {
		width: 78%;
	}
	.select-chip,
	.copy-button,
	.copy-select {
		margin: auto;
	}
	div p {
		word-wrap: break-word;
	}
	td {
		padding: unset!important;
	}
	.detail-domain a {
		color: rgba(0, 0, 0, 0.6);
	}
	.detail-domain a:hover {
		color: #0366d6;
		text-decoration: underline;
	}
	.detail-full {
		text-align: left;
	}
	div.errno_0 {
		color: #4caf50;
	}
	div.errno_1 {
		color: #f44336;
	}
	div.errno_2 {
		color: orange;
	}
	div.errno_3 {
		color: orchid;
	}
	div.errno_4 {
		color: pink;
	}
	div.errno_5 {
		color: brown;
	}
}
</style>
