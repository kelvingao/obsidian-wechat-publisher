import { App, PluginSettingTab, Setting } from 'obsidian';
import WeChatPublisherPlugin from '../main';
import { WeChatSettings } from './types';

export class WeChatPublisherSettingTab extends PluginSettingTab {
	plugin: WeChatPublisherPlugin;

	constructor(app: App, plugin: WeChatPublisherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '微信公众平台发布插件设置' });

		// AppID 设置
		new Setting(containerEl)
			.setName('AppID')
			.setDesc('微信公众号的AppID')
			.addText(text => text
				.setPlaceholder('请输入AppID')
				.setValue(this.plugin.settings.appid)
				.onChange(async (value) => {
					this.plugin.settings.appid = value;
					await this.plugin.saveSettings();
				}));

		// Secret 设置
		new Setting(containerEl)
			.setName('Secret')
			.setDesc('微信公众号的Secret')
			.addText(text => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder('请输入Secret')
					.setValue(this.plugin.settings.secret)
					.onChange(async (value) => {
						this.plugin.settings.secret = value;
						await this.plugin.saveSettings();
					});
			});

		// 默认作者设置
		new Setting(containerEl)
			.setName('默认作者')
			.setDesc('发布文章时的默认作者名称')
			.addText(text => text
				.setPlaceholder('请输入默认作者')
				.setValue(this.plugin.settings.defaultAuthor)
				.onChange(async (value) => {
					this.plugin.settings.defaultAuthor = value;
					await this.plugin.saveSettings();
				}));

		// 自动上传图片设置
		new Setting(containerEl)
			.setName('自动上传图片')
			.setDesc('发布时自动上传本地图片到微信服务器')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoUploadImages)
				.onChange(async (value) => {
					this.plugin.settings.autoUploadImages = value;
					await this.plugin.saveSettings();
				}));

		// 自动发布到平台设置
		new Setting(containerEl)
			.setName('自动发布到微信公众号')
			.setDesc('开启后将直接发布文章，关闭后仅创建草稿')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoPublishToPlatform)
				.onChange(async (value) => {
					this.plugin.settings.autoPublishToPlatform = value;
					await this.plugin.saveSettings();
				}));

		// 连接状态
		const statusSetting = new Setting(containerEl)
			.setName('连接状态')
			.setDesc('当前与微信API的连接状态');

		this.updateConnectionStatus(statusSetting);

		// 测试连接按钮
		new Setting(containerEl)
			.setName('测试连接')
			.setDesc('测试与微信公众平台API的连接')
			.addButton(button => button
				.setButtonText('测试连接')
				.setCta()
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('测试中...');

					try {
						const success = await this.plugin.apiManager.testConnection();
						if (success) {
							this.updateConnectionStatus(statusSetting, '连接成功 ✓');
						} else {
							this.updateConnectionStatus(statusSetting, '连接失败 ✗');
						}
					} catch (error) {
						this.updateConnectionStatus(statusSetting, '连接异常 ✗');
					}

					button.setDisabled(false);
					button.setButtonText('测试连接');
				}));

		// Token 信息
		if (this.plugin.settings.accessToken) {
			const tokenExpireTime = new Date(this.plugin.settings.lastTokenTime + 7200 * 1000);
			new Setting(containerEl)
				.setName('Token 状态')
				.setDesc(`Token 过期时间: ${tokenExpireTime.toLocaleString()}`);
		}
	}

	private updateConnectionStatus(setting: Setting, status?: string) {
		const statusText = status || (this.plugin.settings.accessToken ? '已连接' : '未连接');
		setting.descEl.empty();
		setting.descEl.createEl('span', { text: `当前状态: ${statusText}` });
	}
}