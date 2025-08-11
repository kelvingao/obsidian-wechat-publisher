import { Editor, MarkdownView, Notice, Plugin, TFile } from 'obsidian';
import { WeChatSettings } from './src/types';
import { DEFAULT_SETTINGS } from './src/settings';
import { WeChatAPIManager } from './src/api/wechat-api';
import { ContentConverterV2 } from './src/converter';
import { WeChatPublisherSettingTab } from './src/settings-tab';
import { PreviewModal } from './src/preview-modal';
import { ArticleService } from './src/article-service';

export default class WeChatPublisherPlugin extends Plugin {
	settings: WeChatSettings;
	apiManager: WeChatAPIManager;
	converter: ContentConverterV2;
	articleService: ArticleService;

	async onload() {
		await this.loadSettings();

		// Initialize managers
		this.apiManager = new WeChatAPIManager(this.app, this.settings);
		this.converter = new ContentConverterV2(this.app, this.apiManager, this.settings);
		this.articleService = new ArticleService(this.app, this.apiManager, this.settings);

		// Add ribbon icon for preview
		const ribbonIconEl = this.addRibbonIcon('share', '预览和发布到微信公众号', () => {
			this.openPreviewModal();
		});
		ribbonIconEl.addClass('wechat-publisher-ribbon-class');

		// Add commands
		this.addCommand({
			id: 'preview-wechat-article',
			name: '预览和发布到微信公众号',
			callback: () => {
				this.openPreviewModal();
			}
		});

		this.addCommand({
			id: 'publish-to-wechat',
			name: '直接发布当前文章到微信草稿箱',
			editorCallback: (_editor: Editor, view: MarkdownView) => {
				if (view.file) {
					this.publishFile(view.file);
				}
			}
		});

		this.addCommand({
			id: 'test-wechat-connection',
			name: '测试微信API连接',
			callback: () => {
				this.testConnection();
			}
		});

		// Add settings tab
		this.addSettingTab(new WeChatPublisherSettingTab(this.app, this));

		// Add context menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) => {
						item
							.setTitle('发布到微信公众号')
							.setIcon('share')
							.onClick(() => {
								this.publishFile(file);
							});
					});
				}
			})
		);
	}

	async publishCurrentFile() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView && activeView.file) {
			await this.publishFile(activeView.file);
		} else {
			new Notice('请打开一个Markdown文件');
		}
	}

	async publishFile(file: TFile) {
		try {
			// Check settings
			if (!this.settings.appid || !this.settings.secret) {
				new Notice('请先在设置中配置AppID和Secret');
				return;
			}

			new Notice('开始发布文章...');

			// Convert file to article data
			const articleData = await this.converter.convertFileToArticle(file, this.settings.defaultAuthor);
			
			if (!articleData) {
				new Notice('文章转换失败');
				return;
			}

			// 根据设置选择发布模式
			if (this.settings.autoPublishToPlatform) {
				// 创建草稿并直接发布
				const result = await this.apiManager.createAndPublishDraft(articleData);
				
				if (result.draftId && result.publishId) {
					// 自动更新front matter
					await this.articleService.updatePublishMetadata(file, {
						media_id: result.draftId,
						thumb_media_id: articleData.thumb_media_id,
						last_publish_time: new Date().toISOString(),
						publish_status: 'published'
					});
					
					new Notice(`🎉 文章发布成功！草稿ID: ${result.draftId}，发布ID: ${result.publishId}（已自动更新到front matter）`);
				} else if (result.draftId) {
					// 更新为草稿状态
					await this.articleService.updatePublishMetadata(file, {
						media_id: result.draftId,
						thumb_media_id: articleData.thumb_media_id,
						last_publish_time: new Date().toISOString(),
						publish_status: 'drafted'
					});
					
					new Notice(`⚠️ 草稿创建成功，但发布失败！草稿ID: ${result.draftId}（已自动更新到front matter）`);
				}
			} else {
				// 仅创建草稿
				const mediaId = await this.apiManager.createDraft(articleData);
				
				if (mediaId) {
					// 自动更新front matter
					await this.articleService.updatePublishMetadata(file, {
						media_id: mediaId,
						thumb_media_id: articleData.thumb_media_id,
						last_publish_time: new Date().toISOString(),
						publish_status: 'drafted'
					});
					
					new Notice(`✅ 草稿创建成功！草稿ID: ${mediaId}（已自动更新到front matter）`);
				}
			}
		} catch (error) {
			console.error('发布失败:', error);
			new Notice(`发布失败: ${error.message}`);
			
			// 记录失败状态
			try {
				await this.articleService.updatePublishMetadata(file, {
					last_publish_time: new Date().toISOString(),
					publish_status: 'failed'
				});
			} catch (fmError) {
				console.error('更新失败状态到front matter时出错:', fmError);
			}
		}
	}

	async openPreviewModal() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || !activeView.file) {
			new Notice('请先打开一个Markdown文件');
			return;
		}

		const content = await this.app.vault.read(activeView.file);
		const modal = new PreviewModal(
			this.app, 
			this.settings, 
			content, 
			this.apiManager
		);
		modal.open();
	}

	async testConnection() {
		if (!this.settings.appid || !this.settings.secret) {
			new Notice('请先在设置中配置AppID和Secret');
			return;
		}

		new Notice('正在测试连接...');
		const success = await this.apiManager.testConnection();
		
		if (success) {
			new Notice('连接测试成功！');
		} else {
			new Notice('连接测试失败，请检查配置');
		}
	}

	onunload() {
		// Cleanup if needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update API manager and converter settings
		if (this.apiManager) {
			this.apiManager.updateSettings(this.settings);
		}
		if (this.converter) {
			this.converter.updateSettings(this.settings);
		}
	}
}

