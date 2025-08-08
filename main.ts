import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PreviewModal } from './src/preview-modal';

export interface WeChatPublisherSettings {
	accounts: WeChatAccount[];
	defaultAccount: string;
	defaultTheme: string;
	mathSyntax: 'latex' | 'asciimath';
	showStyleSelector: boolean;
	embedStyle: 'quote' | 'content';
}

export interface WeChatAccount {
	name: string;
	appId: string;
	appSecret: string;
	accessToken?: string;
	tokenExpiry?: number;
}

const DEFAULT_SETTINGS: WeChatPublisherSettings = {
	accounts: [],
	defaultAccount: '',
	defaultTheme: 'default',
	mathSyntax: 'latex',
	showStyleSelector: true,
	embedStyle: 'quote'
}

export default class WeChatPublisherPlugin extends Plugin {
	settings: WeChatPublisherSettings;

	async onload() {
		await this.loadSettings();

		// WeChat Publisher 工具栏图标 - 使用 clipboard-paste 图标
		const ribbonIconEl = this.addRibbonIcon('clipboard-paste', '复制到公众号', async (evt: MouseEvent) => {
			await this.openWeChatPublisherModal();
		});
		ribbonIconEl.addClass('wechat-publisher-ribbon-class');

		// 添加命令面板支持
		this.addCommand({
			id: 'wechat-publisher-open',
			name: '复制到公众号',
			callback: async () => {
				await this.openWeChatPublisherModal();
			}
		});

		// 添加设置面板
		this.addSettingTab(new WeChatPublisherSettingTab(this.app, this));
	}

	async openWeChatPublisherModal(): Promise<void> {
		// 检查当前是否有活动的 Markdown 文档
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice('请先打开一个笔记文档');
			return;
		}

		const editor = activeView.editor;
		const content = editor.getValue();
		
		if (!content.trim()) {
			new Notice('当前文档为空，无法转换');
			return;
		}

		// 打开预览模态框
		new PreviewModal(this.app, this.settings, content).open();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class WeChatPublisherSettingTab extends PluginSettingTab {
	plugin: WeChatPublisherPlugin;

	constructor(app: App, plugin: WeChatPublisherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'WeChat Publisher 设置'});

		// 默认主题设置
		new Setting(containerEl)
			.setName('默认主题')
			.setDesc('选择默认的微信公众号样式主题')
			.addDropdown(dropdown => {
				dropdown.addOption('default', '默认主题');
				dropdown.addOption('simple', '简洁主题');
				dropdown.addOption('elegant', '优雅主题');
				dropdown.setValue(this.plugin.settings.defaultTheme);
				dropdown.onChange(async (value) => {
					this.plugin.settings.defaultTheme = value;
					await this.plugin.saveSettings();
				});
			});

		// 数学公式语法设置
		new Setting(containerEl)
			.setName('数学公式语法')
			.setDesc('选择数学公式的语法格式')
			.addDropdown(dropdown => {
				dropdown.addOption('latex', 'LaTeX');
				dropdown.addOption('asciimath', 'AsciiMath');
				dropdown.setValue(this.plugin.settings.mathSyntax);
				dropdown.onChange(async (value: 'latex' | 'asciimath') => {
					this.plugin.settings.mathSyntax = value;
					await this.plugin.saveSettings();
				});
			});

		// 样式选择器显示设置
		new Setting(containerEl)
			.setName('在工具栏展示样式选择')
			.setDesc('在预览界面显示样式选择和代码高亮选择')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.showStyleSelector);
				toggle.onChange(async (value) => {
					this.plugin.settings.showStyleSelector = value;
					await this.plugin.saveSettings();
				});
			});

		// 文件嵌入展示样式
		new Setting(containerEl)
			.setName('文件嵌入展示样式')
			.setDesc('设置嵌入文件的显示方式')
			.addDropdown(dropdown => {
				dropdown.addOption('quote', '引用样式');
				dropdown.addOption('content', '正文样式');
				dropdown.setValue(this.plugin.settings.embedStyle);
				dropdown.onChange(async (value: 'quote' | 'content') => {
					this.plugin.settings.embedStyle = value;
					await this.plugin.saveSettings();
				});
			});

		// 微信公众号账号管理部分
		containerEl.createEl('h3', {text: '微信公众号账号管理'});
		
		if (this.plugin.settings.accounts.length === 0) {
			containerEl.createEl('p', {
				text: '还没有配置微信公众号账号。请添加账号以使用上传功能。',
				cls: 'setting-item-description'
			});
		}

		// 添加账号按钮
		new Setting(containerEl)
			.setName('添加微信公众号账号')
			.setDesc('配置微信公众号的 AppID 和 AppSecret')
			.addButton(button => {
				button.setButtonText('添加账号');
				button.onClick(() => {
					// 这里后续会实现账号添加对话框
					new Notice('账号管理功能将在后续版本中实现');
				});
			});
	}
}
