/**
 * 纯Markdown解析器 - 对应note-to-mp的parser.ts
 * 职责: 只负责Markdown -> HTML的转换，不涉及业务逻辑
 */
import { App, Vault } from 'obsidian';
import { Marked } from 'marked';
import { WeChatSettings } from './types';
import { WeChatAPIManager } from './api/wechat-api';
import { Extension, MDRendererCallback } from './markdown/extension';
import { HeadingExtension } from './markdown/heading';
import { CodeRenderer } from './markdown/code';
import { LinkExtension } from './markdown/link';
import { ImageExtension } from './markdown/image';

const markedOptions = {
    gfm: true,
    breaks: true,
};

const customRenderer = {
    heading(text: string, level: number, raw: string): string {
        // 忽略IDs，使用简单的heading渲染
        return `<h${level}>${text}</h${level}>`;
    },
    hr(): string {
        return '<hr>';
    },
    list(body: string, ordered: boolean, start: number | ''): string {
        const type = ordered ? 'ol' : 'ul';
        const startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
        return '<' + type + startatt + '>' + body + '</' + type + '>';
    },
    listitem(text: string, task: boolean, checked: boolean): string {
        return `<li>${text}</li>`;
    },
};

/**
 * 纯Markdown解析器类 - 对应note-to-mp的MarkedParser
 */
export class MarkdownParser implements MDRendererCallback {
    extensions: Extension[] = [];
    marked: Marked;
    app: App;
    vault: Vault;
    settings: WeChatSettings;
    elementCache: Map<string, Map<string, string>> = new Map();
    elementUpdateCallbacks: Map<string, (html: string) => void> = new Map();

    constructor(app: App, settings: WeChatSettings, apiManager: WeChatAPIManager) {
        this.app = app;
        this.vault = app.vault;
        this.settings = settings;

        // 初始化扩展
        this.addExtensions(apiManager);
    }

    private addExtensions(apiManager: WeChatAPIManager): void {
        // 按照note-to-mp的方式添加扩展
        this.extensions.push(new HeadingExtension(this.app, this.settings, apiManager, this));
        this.extensions.push(new CodeRenderer(this.app, this.settings, apiManager, this));
        this.extensions.push(new LinkExtension(this.app, this.settings, apiManager, this));
        this.extensions.push(new ImageExtension(this.app, this.settings, apiManager, this));
        
        // 未来可以添加更多扩展:
        // this.extensions.push(new MathExtension(...));
        // this.extensions.push(new BlockquoteExtension(...));
    }

    /**
     * 构建Marked实例 - 对应note-to-mp的buildMarked()
     */
    async buildMarked(): Promise<void> {
        this.marked = new Marked();
        this.marked.use(markedOptions);
        
        // 添加所有扩展
        for (const ext of this.extensions) {
            this.marked.use(ext.markedExtension());
            ext.marked = this.marked;
            await ext.prepare();
        }
        
        // 应用自定义renderer
        this.marked.use({ renderer: customRenderer });
    }

    /**
     * 准备阶段 - 对应note-to-mp的prepare()
     */
    async prepare(): Promise<void> {
        for (const ext of this.extensions) {
            await ext.prepare();
        }
    }

    /**
     * 后处理阶段 - 对应note-to-mp的postprocess()
     */
    async postprocess(html: string): Promise<string> {
        let result = html;
        for (const ext of this.extensions) {
            result = await ext.postprocess(result);
        }
        return result;
    }

    /**
     * 发布前处理 - 执行图片上传等操作
     */
    async beforePublish(): Promise<void> {
        for (const ext of this.extensions) {
            await ext.beforePublish();
        }
    }

    /**
     * 清理资源 - 对应note-to-mp的cleanup逻辑
     */
    async cleanup(): Promise<void> {
        for (const ext of this.extensions) {
            await ext.cleanup();
        }
        this.elementCache.clear();
        this.elementUpdateCallbacks.clear();
    }

    /**
     * 基础解析 - 对应note-to-mp的parse()
     */
    async parse(content: string): Promise<string> {
        try {
            if (!this.marked) await this.buildMarked();
            await this.prepare();
            
            let html = await this.marked.parse(content);
            html = await this.postprocess(html);
            
            return html;
        } catch (error) {
            console.error('Markdown解析失败:', error);
            throw error;
        }
    }

    /**
     * 发布模式解析 - 包含图片上传等操作
     */
    async parseForPublish(content: string): Promise<string> {
        try {
            const html = await this.parse(content);
            await this.beforePublish();
            return html;
        } finally {
            await this.cleanup();
        }
    }

    // MDRendererCallback接口实现
    updateElementByID(id: string, html: string): void {
        const callback = this.elementUpdateCallbacks.get(id);
        if (callback) {
            callback(html);
        } else {
            console.log(`Element ${id} updated:`, html.substring(0, 100));
        }
    }

    cacheElement(category: string, id: string, data: string): void {
        if (!this.elementCache.has(category)) {
            this.elementCache.set(category, new Map());
        }
        this.elementCache.get(category)!.set(id, data);
    }

    getCachedElement(category: string, id: string): string | undefined {
        return this.elementCache.get(category)?.get(id);
    }

    registerUpdateCallback(id: string, callback: (html: string) => void): void {
        this.elementUpdateCallbacks.set(id, callback);
    }
}