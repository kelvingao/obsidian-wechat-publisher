import { TFile, FrontMatterCache, App } from 'obsidian';
import { ArticleData, ArticleMetadata, WeChatSettings } from './types';
import { WeChatAPIManager } from './api/wechat-api';
import { MarkdownParser } from './markdown-parser';
import { ArticleService } from './article-service';
import { WeChatPublisher } from './wechat-publisher';

export class ContentConverterV2 {
    private app: App;
    private apiManager: WeChatAPIManager;
    private parser: MarkdownParser;
    private articleService: ArticleService;
    private wechatPublisher: WeChatPublisher;
    private settings: WeChatSettings;

    constructor(app: App, apiManager: WeChatAPIManager, settings: WeChatSettings) {
        this.app = app;
        this.apiManager = apiManager;
        this.settings = settings;
        
        // 初始化分离的服务类
        this.parser = new MarkdownParser(app, settings, apiManager);
        this.articleService = new ArticleService(app, apiManager, settings);
        this.wechatPublisher = new WeChatPublisher();
    }


    /**
     * 更新设置
     */
    updateSettings(settings: WeChatSettings): void {
        this.settings = settings;
        // 重新初始化所有服务类
        this.parser = new MarkdownParser(this.app, settings, this.apiManager);
        this.articleService.updateSettings(settings);
    }

    /**
     * 解析文章元数据 - 委托给ArticleService
     */
    parseMetadata(frontmatter: FrontMatterCache | undefined): ArticleMetadata {
        return this.articleService.parseMetadata(frontmatter);
    }



    /**
     * Markdown转换为HTML（用于预览）
     */
    async markdownToHtmlForPreview(file: TFile): Promise<string> {
        try {
            // 获取文章数据
            const { content, frontmatter, metadata } = await this.articleService.getMetadataFromFile(file);
            
            // 解析markdown内容
            const markdownContent = this.articleService.stripFrontMatter(content);
            const html = await this.parser.parse(markdownContent);
            
            // 生成front matter预览信息
            let frontMatterHtml = '';
            if (frontmatter && Object.keys(frontmatter).length > 0) {
                frontMatterHtml = this.articleService.generateFrontMatterPreview(metadata, file.basename);
            }
            
            // 包装HTML并使用预览格式化
            const wrappedHtml = `<section id="nice">${html}</section>`;
            return this.wechatPublisher.formatForPreview(frontMatterHtml + wrappedHtml);
        } catch (error) {
            console.error('预览生成失败:', error);
            throw error;
        }
    }

    /**
     * 转换文件为文章数据（用于发布）
     */
    async convertFileToArticle(file: TFile, defaultAuthor?: string): Promise<ArticleData | undefined> {
        try {
            // 获取文章数据
            const { content, frontmatter, metadata } = await this.articleService.getMetadataFromFile(file);
            
            // 验证发布条件
            this.articleService.validateForPublish(frontmatter, metadata);
            
            const title = metadata.title || file.basename;
            const author = metadata.author || defaultAuthor || ""; 
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
            const processedHtml = this.wechatPublisher.formatForWechat(wrappedHtml);

            // 构建文章数据
            const articleData: ArticleData = {
                title: title,
                author: author,
                digest: digest,
                content: processedHtml,
                content_source_url: content_source_url,
                thumb_media_id: thumb_media_id,
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