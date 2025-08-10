import { TFile, FrontMatterCache, App } from 'obsidian';
import { marked } from 'marked';
import { ArticleData, ArticleMetadata } from './types';
import { WeChatAPIManager } from './api/wechat-api';

export class ContentConverter {
	private app: App;
	private apiManager: WeChatAPIManager;

	constructor(app: App, apiManager: WeChatAPIManager) {
		this.app = app;
		this.apiManager = apiManager;
	}

	/**
	 * 解析文章元数据
	 */
	parseMetadata(frontmatter: FrontMatterCache | undefined): ArticleMetadata {
		const metadata: ArticleMetadata = {};
		
		if (frontmatter) {
			// 基本信息
			metadata.title = frontmatter.title;
			metadata.author = frontmatter.author;
			metadata.digest = frontmatter.digest;
			
			// 封面图片 - 支持多种字段名
			metadata.banner = frontmatter.banner;
			metadata.banner_path = frontmatter.banner_path;
			metadata.cover = frontmatter.cover;
			metadata.cover_url = frontmatter.cover_url;
			metadata.thumb_media_id = frontmatter.thumb_media_id;
			
			// 链接 - 支持多种字段名
			metadata.source_url = frontmatter.source_url;
			metadata.content_source_url = frontmatter.content_source_url;
			
			// 评论设置 - 支持多种字段名
			metadata.open_comment = frontmatter.open_comment;
			metadata.need_open_comment = frontmatter.need_open_comment;
			
			// 显示设置
			metadata.show_cover = frontmatter.show_cover;
			metadata.show_cover_pic = frontmatter.show_cover_pic;
			
			// 扩展字段
			metadata.tags = frontmatter.tags;
			metadata.category = frontmatter.category;
			metadata.publish_time = frontmatter.publish_time;
			metadata.is_original = frontmatter.is_original;
			metadata.can_reprint = frontmatter.can_reprint;
		}

		return metadata;
	}

	/**
	 * 处理Markdown中的图片
	 */
	async processImages(content: string, basePath: string): Promise<string> {
		// 匹配 ![alt](path) 格式的图片
		const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
		const matches = Array.from(content.matchAll(imageRegex));
		
		let processedContent = content;
		
		for (const match of matches) {
			const [fullMatch, alt, imagePath] = match;
			
			// 上传图片到微信
			const imageUrl = await this.apiManager.uploadImage(imagePath);
			
			if (imageUrl) {
				// 替换为微信图片URL
				processedContent = processedContent.replace(fullMatch, `![${alt}](${imageUrl})`);
			}
		}

		// 匹配 ![[filename]] 格式的图片
		const wikiImageRegex = /!\[\[([^\]]+)\]\]/g;
		const wikiMatches = Array.from(processedContent.matchAll(wikiImageRegex));
		
		for (const match of wikiMatches) {
			const [fullMatch, filename] = match;
			
			// 查找文件
			const file = this.app.vault.getFiles().find(f => f.name === filename);
			if (file) {
				const imageUrl = await this.apiManager.uploadImage(file.path);
				if (imageUrl) {
					processedContent = processedContent.replace(fullMatch, `![${filename}](${imageUrl})`);
				}
			}
		}

		return processedContent;
	}

	/**
	 * 生成front matter预览信息
	 */
	private generateFrontMatterPreview(metadata: ArticleMetadata, filename: string): string {
		const title = metadata.title || filename;
		const author = metadata.author || '未设置';
		const digest = metadata.digest || '未设置';
		
		// 封面图片状态
		let coverStatus = '❌ 未设置';
		let coverInfo = '';
		
		if (metadata.thumb_media_id) {
			coverStatus = '✅ 已设置 (thumb_media_id)';
			coverInfo = metadata.thumb_media_id;
		} else if (metadata.banner || metadata.banner_path || metadata.cover || metadata.cover_url) {
			coverStatus = '⚠️ 待上传';
			coverInfo = metadata.banner || metadata.banner_path || metadata.cover || metadata.cover_url || '';
		}

		return `
			<div style="background: #f0f8ff; border: 2px solid #1890ff; border-radius: 8px; padding: 20px; margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;">
				<h3 style="margin: 0 0 15px 0; color: #1890ff; font-size: 16px;">📝 文章发布信息</h3>
				<div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 15px; font-size: 14px;">
					<strong>标题:</strong> <span>${title}</span>
					<strong>作者:</strong> <span>${author}</span>
					<strong>摘要:</strong> <span>${digest}</span>
					<strong>封面图片:</strong> <span>${coverStatus}</span>
					${coverInfo ? `<strong>封面路径:</strong> <span style="word-break: break-all;">${coverInfo}</span>` : ''}
					<strong>显示封面:</strong> <span>${metadata.show_cover_pic || metadata.show_cover || 1 ? '是' : '否'}</span>
					<strong>开启评论:</strong> <span>${metadata.need_open_comment || metadata.open_comment || 0 ? '是' : '否'}</span>
					${metadata.content_source_url || metadata.source_url ? `<strong>原文链接:</strong> <span style="word-break: break-all;">${metadata.content_source_url || metadata.source_url}</span>` : ''}
					${metadata.tags && metadata.tags.length > 0 ? `<strong>标签:</strong> <span>${Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags}</span>` : ''}
					${metadata.category ? `<strong>分类:</strong> <span>${metadata.category}</span>` : ''}
				</div>
				${coverStatus.includes('❌') ? `
				<div style="margin-top: 15px; padding: 10px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px;">
					<strong style="color: #ff4d4f;">⚠️ 注意：</strong> 需要设置封面图片才能发布。请在front matter中添加以下字段之一：<br>
					<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; margin: 2px;">banner: "图片路径"</code>
					<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; margin: 2px;">cover: "图片路径"</code>
					<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; margin: 2px;">cover_url: "图片URL"</code>
				</div>` : ''}
			</div>
		`;
	}

	/**
	 * 移除front matter部分
	 */
	private stripFrontMatter(content: string): string {
		// 检查是否以---开头
		if (content.startsWith('---')) {
			const endIndex = content.indexOf('---', 3);
			if (endIndex !== -1) {
				// 移除front matter部分，保留后面的内容
				return content.substring(endIndex + 3).trim();
			}
		}
		return content;
	}

	/**
	 * Markdown转换为HTML
	 */
	async markdownToHtml(content: string): Promise<string> {
		// 配置marked选项
		marked.setOptions({
			gfm: true,
			breaks: true,
		});

		const html = marked.parse(content);
		return this.inlineStyles(html);
	}

	/**
	 * 为预览生成包含front matter信息的HTML
	 */
	async markdownToHtmlForPreview(file: TFile): Promise<string> {
		try {
			const content = await this.app.vault.read(file);
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
			const metadata = this.parseMetadata(frontmatter);
			
			// 生成front matter预览信息
			let frontMatterHtml = '';
			if (frontmatter && Object.keys(frontmatter).length > 0) {
				frontMatterHtml = this.generateFrontMatterPreview(metadata, file.basename);
			}
			
			// 处理markdown内容（不包含front matter）
			const markdownContent = this.stripFrontMatter(content);
			const html = marked.parse(markdownContent);
			const processedHtml = this.solveHTML(`<section id="nice">` + html + `</section>`);
			
			return this.inlineStyles(frontMatterHtml + processedHtml);
		} catch (error) {
			console.error('预览生成失败:', error);
			throw error;
		}
	}

	/**
	 * 处理HTML内容
	 * 确保HTML符合微信公众号要求
	 */
	private solveHTML(html: string): string {
		// 处理数学公式容器
		html = html.replace(/<mjx-container (class="inline.+?)<\/mjx-container>/g, "<span $1</span>");
		html = html.replace(/\s<span class="inline/g, '&nbsp;<span class="inline');
		html = html.replace(/svg><\/span>\s/g, "svg></span>&nbsp;");
		html = html.replace(/mjx-container/g, "section");
		html = html.replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"');
		html = html.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");
		
		// 清理不支持的标签和属性
		html = this.sanitizeHTML(html);
		
		// 移除换行符
		return html.replace(/[\r\n]/g, "");
	}

	/**
	 * 清理HTML以符合微信公众号要求
	 */
	private sanitizeHTML(html: string): string {
		// 移除危险的标签
		html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
		html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
		html = html.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
		html = html.replace(/<embed[^>]*\/?>/gi, '');
		html = html.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
		html = html.replace(/<input[^>]*\/?>/gi, '');
		html = html.replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, '');
		html = html.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
		
		// 移除危险的属性
		html = html.replace(/\s*on\w+="[^"]*"/gi, ''); // 移除所有事件处理器
		html = html.replace(/\s*javascript:[^"']*/gi, ''); // 移除javascript:链接
		
		// 清理style属性中的危险CSS
		html = html.replace(/style\s*=\s*"([^"]*)"/gi, (match, styleContent) => {
			// 移除危险的CSS属性
			styleContent = styleContent.replace(/expression\s*\([^)]*\)/gi, '');
			styleContent = styleContent.replace(/behavior\s*:[^;]*/gi, '');
			styleContent = styleContent.replace(/url\s*\(\s*javascript:[^)]*\)/gi, '');
			return `style="${styleContent}"`;
		});
		
		return html;
	}

	/**
	 * 内联样式处理
	 */
	private inlineStyles(html: string): string {
		// 基础样式
		const styles = `
		<style>
		body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; }
		h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
		h1 { font-size: 1.8em; }
		h2 { font-size: 1.5em; }
		h3 { font-size: 1.3em; }
		p { margin: 1em 0; line-height: 1.6; }
		code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: "SFMono-Regular", Consolas, monospace; }
		pre { background: #f8f8f8; padding: 1em; border-radius: 5px; overflow-x: auto; }
		blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
		img { max-width: 100%; height: auto; }
		a { color: #007acc; text-decoration: none; }
		ul, ol { margin: 1em 0; padding-left: 2em; }
		table { border-collapse: collapse; width: 100%; margin: 1em 0; }
		th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
		th { background-color: #f5f5f5; font-weight: 600; }
		</style>
		`;

		return `${styles}\n<section id="wechat-content">${html}</section>`;
	}

	/**
	 * 转换文件为文章数据
	 */
	async convertFileToArticle(file: TFile, defaultAuthor?: string): Promise<ArticleData | undefined> {
		try {
			const content = await this.app.vault.read(file);
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
			const metadata = this.parseMetadata(frontmatter);
			
			const title = metadata.title || file.basename;
			let author = ""; 
			let digest = ""; 
			let content_source_url = ""; 
			let need_open_comment = 0;
			
			// 处理封面图片
			let thumb_media_id: string | undefined = "";
			
			if (frontmatter !== undefined) {
				if (metadata.thumb_media_id && metadata.thumb_media_id !== "") {
					thumb_media_id = metadata.thumb_media_id;
				} else {
					if (metadata.banner && metadata.banner !== "") {
						thumb_media_id = await this.apiManager.uploadMaterial(metadata.banner, title + "_banner");
					} else if (metadata.banner_path && metadata.banner_path !== "") {
						thumb_media_id = await this.apiManager.uploadMaterial(metadata.banner_path, title + "_banner");
					}
				}
				
				if (thumb_media_id === "" && !metadata.banner && !metadata.banner_path) {
					throw new Error('Please set banner of article, thumb_media_id, banner, banner_path in file frontManager');
				}
				
				author = metadata.author || "";
				digest = metadata.digest || "";
				content_source_url = metadata.content_source_url || metadata.source_url || "";
				need_open_comment = metadata.need_open_comment || metadata.open_comment || 0;
			} else {
				throw new Error('Please set banner of article, thumb_media_id, banner, banner_path in file frontManager');
			}
			
			// 处理内容 
			const processedContent = await this.processImages(content, file.path);
			const markdownContent = this.stripFrontMatter(processedContent);
			const html = marked.parse(markdownContent);
			const processedHtml = this.solveHTML(`<section id="nice">` + html + `</section>`);

			// 构建文章数据
			const articleData: ArticleData = {
				title: title,
				author: author,
				digest: digest,
				content: processedHtml,
				content_source_url: content_source_url,
				thumb_media_id: thumb_media_id!,
				need_open_comment: need_open_comment,
				only_fans_can_comment: 0,
			};

			return articleData;
		} catch (error) {
			console.error('文件转换失败:', error);
			throw error;
		}
	}
}