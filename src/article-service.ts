/**
 * 文章业务服务 - 对应note-to-mp的note-preview.ts的业务逻辑部分
 * 职责: 处理文章元数据、Front Matter解析、业务流程控制
 */
import { TFile, FrontMatterCache, App } from 'obsidian';
import { ArticleMetadata, WeChatSettings } from './types';
import { WeChatAPIManager } from './api/wechat-api';

export class ArticleService {
    private app: App;
    private apiManager: WeChatAPIManager;
    private settings: WeChatSettings;

    constructor(app: App, apiManager: WeChatAPIManager, settings: WeChatSettings) {
        this.app = app;
        this.apiManager = apiManager;
        this.settings = settings;
    }

    /**
     * 更新设置
     */
    updateSettings(settings: WeChatSettings): void {
        this.settings = settings;
    }

    /**
     * 解析文章元数据 - 对应note-to-mp的getMetadata()
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
     * 生成front matter预览信息 - 对应note-to-mp的UI生成逻辑
     */
    generateFrontMatterPreview(metadata: ArticleMetadata, filename: string): string {
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
                    <strong>显示封面:</strong> <span>${metadata.show_cover_pic || metadata.show_cover ? '是' : '否'}</span>
                    <strong>开启评论:</strong> <span>${metadata.need_open_comment || metadata.open_comment ? '是' : '否'}</span>
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
    stripFrontMatter(content: string): string {
        if (content.startsWith('---')) {
            const endIndex = content.indexOf('---', 3);
            if (endIndex !== -1) {
                return content.substring(endIndex + 3).trim();
            }
        }
        return content;
    }

    /**
     * 处理封面上传 - 对应note-to-mp的封面处理逻辑
     */
    async processCoverImage(metadata: ArticleMetadata, title: string): Promise<string> {
        let thumb_media_id: string | undefined = "";
        
        if (metadata.thumb_media_id && metadata.thumb_media_id !== "") {
            thumb_media_id = metadata.thumb_media_id;
        } else {
            // 按优先级上传封面
            if (metadata.banner && metadata.banner !== "") {
                thumb_media_id = await this.apiManager.uploadMaterial(metadata.banner, title + "_banner");
            } else if (metadata.banner_path && metadata.banner_path !== "") {
                thumb_media_id = await this.apiManager.uploadMaterial(metadata.banner_path, title + "_banner");
            } else if (metadata.cover && metadata.cover !== "") {
                thumb_media_id = await this.apiManager.uploadMaterial(metadata.cover, title + "_cover");
            } else if (metadata.cover_url && metadata.cover_url !== "") {
                thumb_media_id = await this.apiManager.uploadMaterial(metadata.cover_url, title + "_cover");
            }
        }
        
        if (!thumb_media_id || thumb_media_id === "") {
            throw new Error('Please set banner/cover image in frontmatter: banner, banner_path, cover, cover_url, or thumb_media_id');
        }

        return thumb_media_id;
    }

    /**
     * 从文件获取元数据 - 对应note-to-mp的文件处理
     */
    async getMetadataFromFile(file: TFile): Promise<{
        content: string;
        frontmatter: FrontMatterCache | undefined;
        metadata: ArticleMetadata;
    }> {
        const content = await this.app.vault.read(file);
        const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
        const metadata = this.parseMetadata(frontmatter);
        
        return { content, frontmatter, metadata };
    }

    /**
     * 验证发布必要条件
     */
    validateForPublish(frontmatter: FrontMatterCache | undefined, metadata: ArticleMetadata): void {
        if (!frontmatter) {
            throw new Error('Please add frontmatter with banner/cover image configuration');
        }

        // 检查是否有封面设置
        const hasCover = metadata.thumb_media_id || metadata.banner || metadata.banner_path || 
                        metadata.cover || metadata.cover_url;
        
        if (!hasCover) {
            throw new Error('Please set banner/cover image in frontmatter: banner, banner_path, cover, cover_url, or thumb_media_id');
        }
    }

    /**
     * 更新前置元数据中的发布信息
     */
    async updatePublishMetadata(file: TFile, metadata: Record<string, any>): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            const newContent = this.updateFrontMatter(content, metadata);
            await this.app.vault.modify(file, newContent);
        } catch (error) {
            console.error('更新前置元数据失败:', error);
            throw error;
        }
    }

    /**
     * 更新文档的前置元数据
     */
    private updateFrontMatter(content: string, updates: Record<string, any>): string {
        const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontMatterRegex);
        
        if (!match) {
            // 如果没有front matter，添加一个
            const newFrontMatter = Object.keys(updates)
                .map(key => `${key}: ${this.formatYamlValue(updates[key])}`)
                .join('\n');
            return `---\n${newFrontMatter}\n---\n\n${content}`;
        }
        
        // 解析现有的front matter
        const existingFrontMatter = match[1];
        const lines = existingFrontMatter.split('\n');
        const updatedLines = [...lines];
        
        // 更新或添加新的键值对
        for (const key in updates) {
            const value = updates[key];
            const lineIndex = lines.findIndex(line => line.trim().startsWith(`${key}:`));
            const formattedValue = this.formatYamlValue(value);
            
            if (lineIndex >= 0) {
                // 更新现有键
                updatedLines[lineIndex] = `${key}: ${formattedValue}`;
            } else {
                // 添加新键
                updatedLines.push(`${key}: ${formattedValue}`);
            }
        }
        
        const newFrontMatter = updatedLines.join('\n');
        return content.replace(frontMatterRegex, `---\n${newFrontMatter}\n---`);
    }

    /**
     * 格式化YAML值
     */
    private formatYamlValue(value: any): string {
        if (typeof value === 'string') {
            // 如果字符串包含特殊字符，用引号包围
            if (value.includes(':') || value.includes('\n') || value.includes('"')) {
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            return value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        } else if (value instanceof Date) {
            return value.toISOString();
        } else {
            return JSON.stringify(value);
        }
    }
}