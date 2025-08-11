/**
 * 文章业务服务 - 处理文章元数据、封面上传和发布逻辑
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
     * 解析文章元数据 - 从文件内容中提取front matter
     * 支持中文字段名和英文字段名（向后兼容）
     */
    parseMetadata(frontmatter: FrontMatterCache | undefined): ArticleMetadata {
        const metadata: ArticleMetadata = {};
        
        if (frontmatter) {
            // 基本信息 - 优先使用中文字段名，英文作为备用
            metadata.title = frontmatter['标题'] || frontmatter.title;
            metadata.author = frontmatter['作者'] || frontmatter.author;
            metadata.digest = frontmatter['摘要'] || frontmatter.digest;
            
            // 封面图片 - 支持中文和英文字段名
            metadata.banner = frontmatter['封面'] || frontmatter.banner;
            metadata.banner_path = frontmatter.banner_path;
            metadata.cover = frontmatter.cover;
            metadata.cover_url = frontmatter.cover_url;
            metadata.thumb_media_id = frontmatter.thumb_media_id;
            
            // 封面裁剪设置 - 支持中文和英文字段名
            metadata.crop_enabled = frontmatter['封面裁剪'] || frontmatter.crop_enabled;
            
            // 链接 - 支持中文和英文字段名
            metadata.source_url = frontmatter.source_url;
            metadata.content_source_url = frontmatter['原文地址'] || frontmatter.content_source_url;
            
            // 评论设置 - 支持中文和英文字段名
            metadata.open_comment = frontmatter.open_comment;
            metadata.need_open_comment = frontmatter['打开评论'] || frontmatter.need_open_comment;
            metadata.only_fans_can_comment = frontmatter['仅粉丝可评论'] || frontmatter.only_fans_can_comment;
            
            // 显示设置 - 支持中文和英文字段名
            metadata.show_cover = frontmatter.show_cover;
            metadata.show_cover_pic = frontmatter['显示封面'] || frontmatter.show_cover_pic;
            
            // 原创设置 - 支持中文和英文字段名
            metadata.is_original = frontmatter['原创声明'] || frontmatter.is_original;
            metadata.can_reprint = frontmatter.can_reprint;
            
            // 扩展字段
            metadata.tags = frontmatter.tags;
            metadata.category = frontmatter.category;
            metadata.publish_time = frontmatter.publish_time;
            
            // 系统管理字段（保持英文）
            metadata.media_id = frontmatter.media_id;
            metadata.last_publish_time = frontmatter.last_publish_time;
            metadata.publish_status = frontmatter.publish_status;
            
            // 主题和样式字段 - 支持中文字段名
            metadata.theme = frontmatter['样式'] || frontmatter.theme;
            metadata.highlight_theme = frontmatter['代码高亮'] || frontmatter.highlight_theme;
            metadata.platform = frontmatter['公众号'] || frontmatter.platform;
        }

        return metadata;
    }

    /**
     * 生成front matter预览信息 - 只在有警告情况时显示
     * 基于微信公众号草稿箱API要求验证必填字段：title, content, thumb_media_id
     * 注意：front matter字段已自动补全，这里只警告不能为空的关键字段
     */
    generateFrontMatterPreview(metadata: ArticleMetadata, filename: string): string {
        const warnings: string[] = [];
        
        // 检查标题 - 微信API必填字段，不能为空
        if (!metadata.title || (typeof metadata.title === 'string' && metadata.title.trim() === '')) {
            warnings.push(`
                <div style="margin-bottom: 15px; padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px;">
                    <strong style="color: #ff4d4f;">⚠️ 标题不能为空</strong><br>
                    微信草稿API要求必须提供文章标题，请填写<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">标题</code>字段的值。
                </div>
            `);
        }
        
        // 检查封面图片设置 - 微信API必填字段 thumb_media_id，不能为空
        const hasCover = metadata.thumb_media_id || 
                        (metadata.banner && typeof metadata.banner === 'string' && metadata.banner.trim() !== '') || 
                        (metadata.banner_path && typeof metadata.banner_path === 'string' && metadata.banner_path.trim() !== '') ||
                        (metadata.cover && typeof metadata.cover === 'string' && metadata.cover.trim() !== '') || 
                        (metadata.cover_url && typeof metadata.cover_url === 'string' && metadata.cover_url.trim() !== '');
        
        if (!hasCover) {
            warnings.push(`
                <div style="margin-bottom: 15px; padding: 15px; background: #fff2f0; border-left: 4px solid #ff4d4f; border-radius: 4px;">
                    <strong style="color: #ff4d4f;">⚠️ 封面图片不能为空</strong><br>
                    微信草稿API要求必须提供封面图片，请填写<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">封面</code>字段的值。
                </div>
            `);
        }
        
        // 检查是否有media_id（表示需要更新而不是新建）
        if (metadata.media_id) {
            warnings.push(`
                <div style="margin-bottom: 15px; padding: 15px; background: #f6ffed; border-left: 4px solid #52c41a; border-radius: 4px;">
                    <strong style="color: #52c41a;">📝 更新草稿模式</strong><br>
                    检测到已存在草稿ID: <code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">${metadata.media_id}</code><br>
                    点击发布将更新现有草稿而不是创建新草稿。
                </div>
            `);
        }
        
        // 检查发布状态警告
        if (metadata.publish_status) {
            const status = metadata.publish_status;
            if (status === 'failed' || status === 'update_failed') {
                warnings.push(`
                    <div style="margin-bottom: 15px; padding: 15px; background: #fff1f0; border-left: 4px solid #ff7875; border-radius: 4px;">
                        <strong style="color: #ff7875;">❌ 上次操作失败</strong><br>
                        上次${status === 'failed' ? '发布' : '更新'}失败，请检查网络连接和API配置后重试。<br>
                        ${metadata.last_publish_time ? `失败时间: ${new Date(metadata.last_publish_time).toLocaleString()}` : ''}
                    </div>
                `);
            }
        }
        
        // 只有在有警告时才返回HTML
        if (warnings.length > 0) {
            return warnings.join('');
        }
        
        // 正常情况下返回空字符串（不显示卡片）
        return '';
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
     * 处理封面上传 - 上传封面图片到微信服务器
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
     * 从文件获取元数据 - 读取并解析文件内容和元数据
     * 如果缺少必要的front matter字段，会自动补全
     */
    async getMetadataFromFile(file: TFile): Promise<{
        content: string;
        frontmatter: FrontMatterCache | undefined;
        metadata: ArticleMetadata;
    }> {
        let content = await this.app.vault.read(file);
        let frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
        
        // 检查并自动补全必要的front matter字段
        const wasUpdated = await this.ensureFrontMatterFields(file, content, frontmatter);
        
        if (wasUpdated) {
            // 重新读取更新后的文件内容和元数据
            content = await this.app.vault.read(file);
            // 强制刷新缓存
            await new Promise(resolve => setTimeout(resolve, 100));
            frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
        }
        
        const metadata = this.parseMetadata(frontmatter);
        
        return { content, frontmatter, metadata };
    }

    /**
     * 确保文件包含必要的front matter字段
     * 如果缺少字段，会自动添加并设置为空值或默认值
     */
    private async ensureFrontMatterFields(file: TFile, content: string, frontmatter: FrontMatterCache | undefined): Promise<boolean> {
        // 定义必要的字段和默认值（使用中文字段名）
        const requiredFields = {
            '标题': '',                    // string类型
            '作者': this.settings.defaultAuthor || '',  // 使用设置中的默认作者
            '摘要': '',                    // string类型
            '封面': '',                    // string类型
            '封面裁剪': false,            // checkbox类型（布尔值）
            '原文地址': '',               // string类型
            '打开评论': false,            // checkbox类型（布尔值）
            '仅粉丝可评论': false,        // checkbox类型（布尔值）
            '显示封面': true,             // checkbox类型（布尔值）
            '原创声明': true,             // checkbox类型（布尔值）
            '公众号': '',                 // string类型
            '样式': '',                   // string类型
            '代码高亮': ''                // string类型
        };

        let needsUpdate = false;
        const updates: Record<string, any> = {};

        // 检查是否完全没有front matter
        if (!frontmatter) {
            needsUpdate = true;
            Object.assign(updates, requiredFields);
        } else {
            // 检查各个必要字段
            for (const [key, defaultValue] of Object.entries(requiredFields)) {
                if (!(key in frontmatter)) {
                    needsUpdate = true;
                    updates[key] = defaultValue;
                } else if (key === '作者' && (!frontmatter[key] || (typeof frontmatter[key] === 'string' && frontmatter[key].trim() === ''))) {
                    // 特殊处理：如果作者字段存在但为空，使用默认作者填充
                    needsUpdate = true;
                    updates[key] = this.settings.defaultAuthor || '';
                }
            }
        }

        // 如果需要更新，执行更新
        if (needsUpdate) {
            try {
                await this.updatePublishMetadata(file, updates);
                console.log('自动补全front matter字段:', Object.keys(updates));
                // 显示用户友好的提示
                const addedFields = Object.keys(updates).join(', ');
                // 使用setTimeout避免阻塞UI
                setTimeout(() => {
                    // 动态导入Notice以避免循环依赖
                    const { Notice } = require('obsidian');
                    new Notice(`✅ 已自动补全front matter字段: ${addedFields}`);
                }, 100);
                return true;
            } catch (error) {
                console.error('自动补全front matter失败:', error);
                return false;
            }
        }

        return false;
    }

    /**
     * 验证发布必要条件
     * 基于微信公众号草稿箱API要求验证必填字段：title, content, thumb_media_id
     * 注意：front matter字段已自动补全，这里只验证不能为空的关键字段
     */
    validateForPublish(frontmatter: FrontMatterCache | undefined, metadata: ArticleMetadata): void {
        const errors: string[] = [];

        // 检查标题 - 微信API必填字段，不能为空
        if (!metadata.title || (typeof metadata.title === 'string' && metadata.title.trim() === '')) {
            errors.push('标题不能为空，请填写【标题】字段');
        }

        // 检查是否有封面设置 - 微信API必填字段 thumb_media_id，不能为空
        const hasCover = metadata.thumb_media_id || 
                        (metadata.banner && typeof metadata.banner === 'string' && metadata.banner.trim() !== '') || 
                        (metadata.banner_path && typeof metadata.banner_path === 'string' && metadata.banner_path.trim() !== '') ||
                        (metadata.cover && typeof metadata.cover === 'string' && metadata.cover.trim() !== '') || 
                        (metadata.cover_url && typeof metadata.cover_url === 'string' && metadata.cover_url.trim() !== '');
        
        if (!hasCover) {
            errors.push('封面图片不能为空，请填写【封面】字段');
        }

        // 如果有错误，抛出异常
        if (errors.length > 0) {
            throw new Error(errors.join('；'));
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