import { App, Vault } from 'obsidian';
import { Marked, MarkedExtension } from 'marked';
import { WeChatSettings } from '../types';
import { WeChatAPIManager } from '../api/wechat-api';

/**
 * Markdown渲染回调接口
 * 用于Extensions与主解析器之间的通信
 */
export interface MDRendererCallback {
    settings: WeChatSettings;
    updateElementByID(id: string, html: string): void;
    cacheElement(category: string, id: string, data: string): void;
}

/**
 * Extension基类
 * 所有Markdown扩展功能都继承自这个类
 */
export abstract class Extension {
    app: App;
    vault: Vault;
    apiManager: WeChatAPIManager;
    settings: WeChatSettings;
    callback: MDRendererCallback;
    marked: Marked;

    constructor(
        app: App, 
        settings: WeChatSettings, 
        apiManager: WeChatAPIManager, 
        callback: MDRendererCallback
    ) {
        this.app = app;
        this.vault = app.vault;
        this.settings = settings;
        this.apiManager = apiManager;
        this.callback = callback;
    }

    /**
     * 准备阶段 - 在解析开始前执行
     * 可以用来初始化资源、清理缓存等
     */
    async prepare(): Promise<void> {
        return;
    }

    /**
     * 后处理阶段 - 在marked解析完成后执行
     * 用于对生成的HTML进行进一步处理
     */
    async postprocess(html: string): Promise<string> {
        return html;
    }

    /**
     * 发布前处理 - 在发布到微信前执行
     * 用于上传图片、处理外部资源等
     */
    async beforePublish(): Promise<void> {
        return;
    }

    /**
     * 清理阶段 - 在处理完成后执行
     * 用于清理临时资源、重置状态等
     */
    async cleanup(): Promise<void> {
        return;
    }

    /**
     * 返回Marked扩展配置
     * 每个Extension必须实现这个方法来定义自己的解析规则
     */
    abstract markedExtension(): MarkedExtension;
}