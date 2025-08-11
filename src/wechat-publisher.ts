/**
 * 微信发布器 - 专门负责微信格式化和发布逻辑
 * 职责: HTML -> 微信格式化、CSS内联、清理不支持的标签
 */
import { applyCSS } from './utils';
import ThemeManager from './theme-manager';
import { WeChatSettings } from './types';

export class WeChatPublisher {
    private themeManager: ThemeManager;
    
    constructor() {
        this.themeManager = ThemeManager.getInstance();
    }
    
    /**
     * 格式化HTML用于预览（使用CSS样式表）
     */
    formatForPreview(html: string, settings?: WeChatSettings, themeName?: string, highlightName?: string): string {
        // 确定要使用的主题
        const finalThemeName = themeName || settings?.defaultTheme || '默认主题';
        const finalHighlightName = highlightName || settings?.highlightTheme || 'GitHub';
        const customCSS = settings?.customCSS || '';
        
        // 从主题管理器获取完整的CSS
        const themeCSS = this.themeManager.applyTheme(finalThemeName, finalHighlightName, customCSS);
        
        const styles = `
        <style>
        /* 基础重置样式 */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #24292e;
            max-width: 100%;
            margin: 0;
            padding: 20px;
        }
        
        /* 应用主题CSS */
        ${themeCSS}
        </style>`;
        
        // 包装HTML内容并应用主题容器类
        const wrappedHtml = `<div class="wechat-content">${html}</div>`;

        return `${styles}\n${wrappedHtml}`;
    }

    /**
     * 格式化HTML用于微信发布（使用PostCSS风格的内联样式）
     */
    formatForWechat(html: string, settings?: WeChatSettings, themeName?: string, highlightName?: string): string {
        // 1. 包装HTML内容并应用主题容器类
        let processedHtml = `<section class="wechat-content">${html}</section>`;
        
        // 2. 确定要使用的主题并获取CSS
        const finalThemeName = themeName || settings?.defaultTheme || '默认主题';
        const finalHighlightName = highlightName || settings?.highlightTheme || 'GitHub';
        const customCSS = settings?.customCSS || '';
        
        // 获取完整的主题CSS
        const themeCSS = this.themeManager.applyTheme(finalThemeName, finalHighlightName, customCSS);
        
        // 3. 使用PostCSS风格的CSS内联化处理
        processedHtml = applyCSS(processedHtml, themeCSS);
        
        // 4. 处理数学公式容器
        processedHtml = processedHtml.replace(/<mjx-container (class="inline.+?)<\/mjx-container>/g, "<span $1</span>");
        processedHtml = processedHtml.replace(/\s<span class="inline/g, '&nbsp;<span class="inline');
        processedHtml = processedHtml.replace(/svg><\/span>\s/g, "svg></span>&nbsp;");
        processedHtml = processedHtml.replace(/mjx-container/g, "section");
        processedHtml = processedHtml.replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"');
        processedHtml = processedHtml.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");
        
        // 5. 处理代码块中的换行符 - 微信公众号专用
        processedHtml = this.processCodeBlockNewlines(processedHtml);
        
        // 6. 清理不支持的标签和属性
        processedHtml = this.sanitizeHTML(processedHtml);
        
        // 7. 移除HTML外层的换行符（但保留代码块内的<br>）
        return processedHtml.replace(/[\r\n]/g, "");
    }


    /**
     * 处理代码块中的换行符 - 微信公众号发布专用
     */
    private processCodeBlockNewlines(html: string): string {
        // 使用正则表达式找到所有代码块并替换其中的换行符
        return html.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (match, codeContent) => {
            // 将代码块内容中的换行符替换为<br>标签
            const processedContent = codeContent.replace(/\n/g, '<br>');
            return match.replace(codeContent, processedContent);
        });
    }

    /**
     * 获取主题管理器实例（用于其他类访问）
     */
    public getThemeManager(): ThemeManager {
        return this.themeManager;
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
        html = html.replace(/\s*on\w+="[^"]*"/gi, '');
        html = html.replace(/\s*javascript:[^"']*/gi, '');
        
        // 清理style属性中的危险CSS
        html = html.replace(/style\s*=\s*"([^"]*)"/gi, (match, styleContent) => {
            styleContent = styleContent.replace(/expression\s*\([^)]*\)/gi, '');
            styleContent = styleContent.replace(/behavior\s*:[^;]*/gi, '');
            styleContent = styleContent.replace(/url\s*\(\s*javascript:[^)]*\)/gi, '');
            return `style="${styleContent}"`;
        });
        
        return html;
    }
}