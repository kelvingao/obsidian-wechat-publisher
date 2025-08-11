import { App, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian';
import WeChatPublisherPlugin from '../main';
import { WeChatSettings } from './types';
import ThemeManager from './theme-manager';

export class WeChatPublisherSettingTab extends PluginSettingTab {
	plugin: WeChatPublisherPlugin;
	private themeManager: ThemeManager;

	constructor(app: App, plugin: WeChatPublisherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.themeManager = ThemeManager.getInstance();
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

		// 格式化设置标题
		containerEl.createEl('h3', { text: '内容格式化设置' });

		// 代码高亮主题
		new Setting(containerEl)
			.setName('代码高亮主题')
			.setDesc('选择代码块的语法高亮主题，优化WeChat显示效果')
			.addDropdown(dropdown => {
				// 动态添加高亮主题选项
				const highlights = this.themeManager.getHighlights();
				highlights.forEach(highlight => {
					dropdown.addOption(highlight.name, highlight.name);
				});
				
				dropdown.setValue(this.plugin.settings.highlightTheme)
					.onChange(async (value) => {
						this.plugin.settings.highlightTheme = value;
						await this.plugin.saveSettings();
					});
			});

		// 链接样式
		new Setting(containerEl)
			.setName('链接显示样式')
			.setDesc('选择链接在微信文章中的显示方式')
			.addDropdown(dropdown => dropdown
				.addOption('inline', '内联显示')
				.addOption('footnote', '脚注样式')
				.setValue(this.plugin.settings.linkStyle)
				.onChange(async (value) => {
					this.plugin.settings.linkStyle = value as 'inline' | 'footnote';
					await this.plugin.saveSettings();
				}));

		// 图片说明
		new Setting(containerEl)
			.setName('使用图片说明')
			.setDesc('为图片添加说明文字（figcaption）')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useFigcaption)
				.onChange(async (value) => {
					this.plugin.settings.useFigcaption = value;
					await this.plugin.saveSettings();
				}));

		// 数学公式
		new Setting(containerEl)
			.setName('启用数学公式')
			.setDesc('支持LaTeX数学公式渲染')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.mathEnabled)
				.onChange(async (value) => {
					this.plugin.settings.mathEnabled = value;
					await this.plugin.saveSettings();
				}));

		// 主题管理设置标题
		containerEl.createEl('h3', { text: '主题管理设置' });

		// 默认主题选择
		new Setting(containerEl)
			.setName('默认主题')
			.setDesc('选择微信文章的默认样式主题')
			.addDropdown(dropdown => {
				// 动态添加主题选项
				const themes = this.themeManager.getThemes();
				themes.forEach(theme => {
					dropdown.addOption(theme.name, theme.name);
				});
				
				dropdown.setValue(this.plugin.settings.defaultTheme)
					.onChange(async (value) => {
						this.plugin.settings.defaultTheme = value;
						await this.plugin.saveSettings();
					});
			});

		// 显示主题选择器
		new Setting(containerEl)
			.setName('显示主题选择器')
			.setDesc('在预览界面显示主题选择器，方便临时更换主题')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showThemeSelector)
				.onChange(async (value) => {
					this.plugin.settings.showThemeSelector = value;
					await this.plugin.saveSettings();
				}));

		// 自定义CSS
		new Setting(containerEl)
			.setName('自定义CSS样式')
			.setDesc('添加自定义CSS样式，将在主题样式之后应用')
			.addTextArea(textArea => {
				textArea
					.setPlaceholder('输入自定义CSS样式...\n例如：\n.wechat-content {\n  font-size: 18px;\n  color: #333;\n}')
					.setValue(this.plugin.settings.customCSS)
					.onChange(async (value) => {
						this.plugin.settings.customCSS = value;
						await this.plugin.saveSettings();
						// 同时更新ThemeManager中的自定义CSS
						await this.themeManager.setCustomCSS(value);
					});
				
				textArea.inputEl.style.width = '100%';
				textArea.inputEl.style.height = '150px';
				textArea.inputEl.style.fontFamily = 'monospace';
			});

		// 主题资源管理
		new Setting(containerEl)
			.setName('主题资源管理')
			.setDesc('下载更多主题或管理现有主题资源')
			.addButton(button => button
				.setButtonText('下载更多主题')
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('下载中...');
					
					const success = await this.themeManager.downloadThemes();
					if (success) {
						// 重新渲染设置界面以显示新主题
						this.display();
					}
					
					button.setDisabled(false);
					button.setButtonText('下载更多主题');
				}))
			.addButton(button => button
				.setButtonText('清空主题')
				.setWarning()
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText('清空中...');
					
					await this.themeManager.clearThemes();
					// 重置设置为默认主题
					this.plugin.settings.defaultTheme = '默认主题';
					await this.plugin.saveSettings();
					// 重新渲染设置界面
					this.display();
					
					button.setDisabled(false);
					button.setButtonText('清空主题');
				}))
			.addButton(button => button
				.setButtonText('打开资源目录')
				.onClick(() => {
					this.themeManager.openAssetsFolder();
				}));
	}

	private updateConnectionStatus(setting: Setting, status?: string) {
		const statusText = status || (this.plugin.settings.accessToken ? '已连接' : '未连接');
		setting.descEl.empty();
		setting.descEl.createEl('span', { text: `当前状态: ${statusText}` });
	}
}