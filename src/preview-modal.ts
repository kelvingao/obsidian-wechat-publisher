import { App, Modal, Setting, ButtonComponent, Notice, MarkdownView } from 'obsidian';
import { WeChatSettings } from './types';
import { MarkdownParser } from './markdown-parser';
import { ArticleService } from './article-service';
import { WeChatPublisher } from './wechat-publisher';
import { WeChatAPIManager } from './api/wechat-api';

export class PreviewModal extends Modal {
	private settings: WeChatSettings;
	private content: string;
	private parser: MarkdownParser;
	private articleService: ArticleService;
	private wechatPublisher: WeChatPublisher;
	private apiManager: WeChatAPIManager;
	private previewEl: HTMLElement;
	private publishButton: ButtonComponent;

	constructor(
		app: App, 
		settings: WeChatSettings, 
		content: string, 
		apiManager: WeChatAPIManager
	) {
		super(app);
		this.settings = settings;
		this.content = content;
		this.apiManager = apiManager;
		
		// Initialize services using the new architecture
		this.parser = new MarkdownParser(app, settings, apiManager);
		this.articleService = new ArticleService(app, apiManager, settings);
		this.wechatPublisher = new WeChatPublisher();
	}

	onOpen() {
		const { contentEl } = this;
		
		// 设置模态框标题和样式
		contentEl.addClass('wechat-preview-modal');
		
		// 标题
		const titleEl = contentEl.createEl('div', { cls: 'modal-title' });
		titleEl.createEl('h2', { text: '微信公众号预览' });

		// 工具栏
		const toolbarEl = contentEl.createEl('div', { cls: 'preview-toolbar' });
		
		// 刷新预览按钮
		new Setting(toolbarEl)
			.setName('预览')
			.addButton(button => {
				button
					.setButtonText('刷新预览')
					.setIcon('refresh-cw')
					.onClick(() => {
						this.refreshPreview();
					});
			});

		// 预览区域
		this.previewEl = contentEl.createEl('div', { 
			cls: 'wechat-preview-content' 
		});
		
		// 初始预览
		this.refreshPreview();

		// 底部操作按钮
		const buttonsEl = contentEl.createEl('div', { cls: 'modal-buttons' });
		
		// 发布按钮
		new Setting(buttonsEl)
			.addButton(button => {
				this.publishButton = button;
				button
					.setButtonText('发布到草稿箱')
					.setCta()
					.onClick(async () => {
						await this.publishToDraft();
					});
			})
			.addButton(button => {
				button
					.setButtonText('取消')
					.onClick(() => {
						this.close();
					});
			});

		// 添加样式
		this.addPreviewStyles();
	}

	private async refreshPreview() {
		try {
			this.previewEl.empty();
			this.previewEl.createEl('div', { 
				text: '正在生成预览...', 
				cls: 'preview-loading' 
			});

			// 获取当前文件
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView || !activeView.file) {
				throw new Error('请先打开一个Markdown文件');
			}

			// 使用新架构直接生成预览
			const { content, frontmatter, metadata } = await this.articleService.getMetadataFromFile(activeView.file);
			
			// 解析markdown内容
			const markdownContent = this.articleService.stripFrontMatter(content);
			const html = await this.parser.parse(markdownContent);
			
			// 生成front matter预览信息
			let frontMatterHtml = '';
			if (frontmatter && Object.keys(frontmatter).length > 0) {
				frontMatterHtml = this.articleService.generateFrontMatterPreview(metadata, activeView.file.basename);
			}
			
			// 包装HTML并使用预览格式化
			const wrappedHtml = `<section id="nice">${html}</section>`;
			const htmlContent = this.wechatPublisher.formatForPreview(frontMatterHtml + wrappedHtml, this.settings);
			
			// 显示预览
			this.previewEl.empty();
			this.previewEl.innerHTML = htmlContent;

			// 添加预览提示
			const hintEl = this.previewEl.createEl('div', { 
				cls: 'preview-hint' 
			});
			hintEl.innerHTML = `
				<p><strong>预览说明：</strong></p>
				<ul>
					<li>图片将在发布时自动上传到微信服务器</li>
					<li>实际显示效果可能因微信客户端而略有差异</li>
					<li>建议发布后在微信公众平台后台进行最终检查</li>
				</ul>
			`;

		} catch (error) {
			console.error('预览生成失败:', error);
			this.previewEl.empty();
			this.previewEl.createEl('div', { 
				text: '预览生成失败: ' + error.message, 
				cls: 'preview-error' 
			});
		}
	}

	private async publishToDraft() {
		if (!this.settings.appid || !this.settings.secret) {
			new Notice('请先在设置中配置AppID和Secret');
			return;
		}

		// 禁用发布按钮
		this.publishButton.setDisabled(true);
		this.publishButton.setButtonText('正在发布...');

		try {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView || !activeView.file) {
				new Notice('请先打开一个Markdown文件');
				return;
			}

			// 使用新架构转换文件为文章数据
			const { content, frontmatter, metadata } = await this.articleService.getMetadataFromFile(activeView.file);
			
			// 验证发布条件
			this.articleService.validateForPublish(frontmatter, metadata);
			
			const title = metadata.title || activeView.file.basename;
			const author = metadata.author || this.settings.defaultAuthor || ""; 
			const digest = metadata.digest || ""; 
			const content_source_url = metadata.content_source_url || metadata.source_url || ""; 
			const need_open_comment = metadata.need_open_comment || metadata.open_comment || 0;
			
			// 处理封面图片上传
			const thumb_media_id = await this.articleService.processCoverImage(metadata, title);
			
			// 解析markdown并执行图片上传
			const markdownContent = this.articleService.stripFrontMatter(content);
			const html = await this.parser.parseForPublish(markdownContent);
			
			// 包装并格式化为微信格式
			const wrappedHtml = `<section id="nice">${html}</section>`;
			const processedHtml = this.wechatPublisher.formatForWechat(wrappedHtml, this.settings);

			// 构建文章数据
			const articleData = {
				title: title,
				author: author,
				digest: digest,
				content: processedHtml,
				content_source_url: content_source_url,
				thumb_media_id: thumb_media_id,
				need_open_comment: need_open_comment,
				only_fans_can_comment: 0,
			};

			// 根据设置选择发布模式
			if (this.settings.autoPublishToPlatform) {
				// 创建草稿并直接发布
				const result = await this.apiManager.createAndPublishDraft(articleData);
				
				if (result.draftId && result.publishId) {
					// 自动更新front matter
					await this.articleService.updatePublishMetadata(activeView.file, {
						media_id: result.draftId,
						thumb_media_id: articleData.thumb_media_id,
						last_publish_time: new Date().toISOString(),
						publish_status: 'published'
					});
					
					new Notice(`🎉 文章发布成功！草稿ID: ${result.draftId}，发布ID: ${result.publishId}（已自动更新到front matter）`);
					this.close();
				} else if (result.draftId) {
					// 更新为草稿状态
					await this.articleService.updatePublishMetadata(activeView.file, {
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
					await this.articleService.updatePublishMetadata(activeView.file, {
						media_id: mediaId,
						thumb_media_id: articleData.thumb_media_id,
						last_publish_time: new Date().toISOString(),
						publish_status: 'drafted'
					});
					
					new Notice(`✅ 草稿创建成功！草稿ID: ${mediaId}（已自动更新到front matter）`);
					this.close();
				}
			}

		} catch (error) {
			console.error('发布失败:', error);
			new Notice(`发布失败: ${error.message}`);
			
			// 记录失败状态
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView?.file) {
				try {
					await this.articleService.updatePublishMetadata(activeView.file, {
						last_publish_time: new Date().toISOString(),
						publish_status: 'failed'
					});
				} catch (fmError) {
					console.error('更新失败状态到front matter时出错:', fmError);
				}
			}
		} finally {
			// 恢复发布按钮
			this.publishButton.setDisabled(false);
			this.publishButton.setButtonText('发布到草稿箱');
		}
	}

	private addPreviewStyles() {
		// 添加预览模态框的自定义样式
		const style = document.createElement('style');
		style.textContent = `
			.wechat-preview-modal .modal-content {
				width: 80vw;
				max-width: 900px;
				height: 80vh;
				padding: 0;
			}

			.wechat-preview-modal .modal-title {
				padding: 20px;
				border-bottom: 1px solid var(--background-modifier-border);
				background: var(--background-secondary);
			}

			.wechat-preview-modal .modal-title h2 {
				margin: 0;
				color: var(--text-normal);
			}

			.wechat-preview-modal .preview-toolbar {
				padding: 10px 20px;
				border-bottom: 1px solid var(--background-modifier-border);
				background: var(--background-secondary);
			}

			.wechat-preview-modal .preview-toolbar .setting-item {
				border: none;
				padding: 0;
			}

			.wechat-preview-modal .wechat-preview-content {
				flex: 1;
				padding: 20px;
				overflow-y: auto;
				background: #fff;
				color: #000;
			}

			.wechat-preview-modal .preview-loading {
				text-align: center;
				padding: 40px;
				color: var(--text-muted);
			}

			.wechat-preview-modal .preview-error {
				text-align: center;
				padding: 40px;
				color: var(--text-error);
				background: var(--background-modifier-error);
				border-radius: 8px;
				margin: 20px;
			}

			.wechat-preview-modal .preview-hint {
				margin-top: 30px;
				padding: 15px;
				background: #f5f5f5;
				border-radius: 8px;
				border-left: 4px solid #1890ff;
			}

			.wechat-preview-modal .preview-hint p {
				margin-top: 0;
				color: #1890ff;
				font-weight: 600;
			}

			.wechat-preview-modal .preview-hint ul {
				margin-bottom: 0;
				color: #666;
			}

			.wechat-preview-modal .modal-buttons {
				padding: 20px;
				border-top: 1px solid var(--background-modifier-border);
				background: var(--background-secondary);
			}

			.wechat-preview-modal .modal-buttons .setting-item {
				border: none;
				padding: 0;
				justify-content: flex-end;
			}

			.wechat-preview-modal .modal-buttons .setting-item-control {
				gap: 10px;
			}

			/* 微信内容样式 */
			.wechat-preview-content #wechat-content {
				max-width: 100%;
				line-height: 1.6;
			}

			.wechat-preview-content img {
				display: block;
				margin: 1em auto;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			}

			.wechat-preview-content pre {
				background: #f8f8f8 !important;
				border: 1px solid #e1e4e8;
				border-radius: 6px;
				padding: 16px;
				overflow-x: auto;
				font-size: 14px;
			}

			.wechat-preview-content blockquote {
				background: #f9f9f9;
				border-radius: 4px;
				padding: 12px 16px;
				margin: 16px 0;
			}
		`;

		document.head.appendChild(style);

		// 模态框关闭时移除样式
		this.scope.register([], 'Escape', () => {
			document.head.removeChild(style);
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}