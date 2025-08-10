import { App, Modal, Setting, ButtonComponent, Notice, MarkdownView } from 'obsidian';
import { WeChatSettings } from './types';
import { ContentConverter } from './converter';
import { WeChatAPIManager } from './api/wechat-api';

export class PreviewModal extends Modal {
	private settings: WeChatSettings;
	private content: string;
	private converter: ContentConverter;
	private apiManager: WeChatAPIManager;
	private previewEl: HTMLElement;
	private publishButton: ButtonComponent;

	constructor(
		app: App, 
		settings: WeChatSettings, 
		content: string, 
		converter: ContentConverter, 
		apiManager: WeChatAPIManager
	) {
		super(app);
		this.settings = settings;
		this.content = content;
		this.converter = converter;
		this.apiManager = apiManager;
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

			// 使用新的预览方法，包含front matter信息
			const htmlContent = await this.converter.markdownToHtmlForPreview(activeView.file);
			
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

			// 转换文件为文章数据
			const articleData = await this.converter.convertFileToArticle(
				activeView.file, 
				this.settings.defaultAuthor
			);
			
			if (!articleData) {
				new Notice('文章转换失败');
				return;
			}

			// 根据设置选择发布模式
			if (this.settings.autoPublishToPlatform) {
				// 创建草稿并直接发布
				const result = await this.apiManager.createAndPublishDraft(articleData);
				
				if (result.draftId && result.publishId) {
					new Notice(`文章发布成功！草稿ID: ${result.draftId}，发布ID: ${result.publishId}`);
					this.close();
				} else if (result.draftId) {
					new Notice(`草稿创建成功，但发布失败！草稿ID: ${result.draftId}`);
				}
			} else {
				// 仅创建草稿
				const mediaId = await this.apiManager.createDraft(articleData);
				
				if (mediaId) {
					new Notice(`草稿创建成功！草稿ID: ${mediaId}`);
					this.close();
				}
			}

		} catch (error) {
			console.error('发布失败:', error);
			new Notice(`发布失败: ${error.message}`);
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