/**
 * 微信发布器 - 专门负责微信格式化和发布逻辑
 * 职责: HTML -> 微信格式化、CSS内联、清理不支持的标签
 */
import { applyCSS } from './utils';

export class WeChatPublisher {
    
    /**
     * 格式化HTML用于预览（使用CSS样式表）
     */
    formatForPreview(html: string): string {
        const styles = `
        <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; color: #24292e; }
        h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; color: #24292e; }
        h1 { font-size: 1.8em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.3em; }
        p { margin: 1em 0; line-height: 1.6; color: #24292e; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: "SFMono-Regular", Consolas, monospace; }
        pre { background: #f8f8f8; padding: 1em; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
        img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
        a { color: #007acc; text-decoration: none; }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
        
        /* 标题样式 - 覆盖HeadingExtension的样式 */
        .wechat-heading {
            font-weight: 600 !important;
            line-height: 1.25;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
            color: #24292e !important;
            position: relative;
        }
        
        .wechat-heading-1 {
            font-size: 1.8em !important;
            padding-left: 12px !important;
            margin-top: 0;
            margin-bottom: 1em;
            color: #24292e !important;
        }
        
        .wechat-heading-1::before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 4px !important;
            background: #007acc !important;
            border-radius: 2px !important;
        }
        
        .wechat-heading-2 {
            font-size: 1.5em !important;
            padding-left: 12px !important;
            margin-top: 1.8em;
            margin-bottom: 0.8em;
            color: #24292e !important;
        }
        
        .wechat-heading-2::before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 4px !important;
            background: #007acc !important;
            border-radius: 2px !important;
        }
        
        .wechat-heading-3 {
            font-size: 1.25em !important;
            padding-left: 12px !important;
            margin-top: 1.5em;
            margin-bottom: 0.6em;
            color: #0366d6 !important;
        }
        
        .wechat-heading-3::before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 3px !important;
            background: #007acc !important;
            border-radius: 2px !important;
        }
        
        .wechat-heading-4 {
            font-size: 1.1em !important;
            padding-left: 12px !important;
            margin-top: 1.3em;
            margin-bottom: 0.5em;
            color: #24292e !important;
        }
        
        .wechat-heading-4::before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 3px !important;
            background: #007acc !important;
            border-radius: 2px !important;
        }
        
        .wechat-heading-5 {
            font-size: 1em !important;
            padding-left: 12px !important;
            margin-top: 1.2em;
            margin-bottom: 0.4em;
            color: #586069 !important;
        }
        
        .wechat-heading-5::before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 2px !important;
            background: #007acc !important;
            border-radius: 2px !important;
        }
        
        .wechat-heading-6 {
            font-size: 0.9em !important;
            padding-left: 12px !important;
            margin-top: 1em;
            margin-bottom: 0.3em;
            color: #6a737d !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .wechat-heading-6::before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 2px !important;
            background: #007acc !important;
            border-radius: 2px !important;
        }
        </style>
        `;

        return `${styles}\n<section id="wechat-content">${html}</section>`;
    }

    /**
     * 格式化HTML用于微信发布（使用PostCSS风格的内联样式）
     */
    formatForWechat(html: string): string {
        // 1. 使用PostCSS风格的CSS内联化 - note-to-mp风格
        let processedHtml = this.applyWeChatCSS(html);
        
        // 2. 处理数学公式容器
        processedHtml = processedHtml.replace(/<mjx-container (class="inline.+?)<\/mjx-container>/g, "<span $1</span>");
        processedHtml = processedHtml.replace(/\s<span class="inline/g, '&nbsp;<span class="inline');
        processedHtml = processedHtml.replace(/svg><\/span>\s/g, "svg></span>&nbsp;");
        processedHtml = processedHtml.replace(/mjx-container/g, "section");
        processedHtml = processedHtml.replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"');
        processedHtml = processedHtml.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");
        
        // 3. 清理不支持的标签和属性
        processedHtml = this.sanitizeHTML(processedHtml);
        
        // 4. 移除换行符
        return processedHtml.replace(/[\r\n]/g, "");
    }

    /**
     * 使用PostCSS风格的方法应用微信CSS - note-to-mp风格
     */
    private applyWeChatCSS(html: string): string {
        const wechatCSS = this.getWeChatCSS();
        return applyCSS(html, wechatCSS);
    }

    /**
     * 获取微信发布专用的CSS样式
     */
    private getWeChatCSS(): string {
        return `
/* 基础元素样式 */
p {
    margin: 1em 0;
    line-height: 1.6;
    color: #24292e;
}

blockquote {
    border-left: 4px solid #ddd;
    margin: 1em 0;
    padding-left: 1em;
    color: #666;
}

ul, ol {
    margin: 1em 0;
    padding-left: 2em;
}

li {
    margin-bottom: 0.25em;
}

/* 标题样式 */
.wechat-heading.wechat-heading-1 {
    font-size: 1.8em;
    padding-left: 12px;
    margin-top: 0;
    margin-bottom: 1em;
    font-weight: 600;
    color: #24292e;
    position: relative;
}

.wechat-heading.wechat-heading-1::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #007acc;
    border-radius: 2px;
}

.wechat-heading.wechat-heading-2 {
    font-size: 1.5em;
    padding-left: 12px;
    margin-top: 1.8em;
    margin-bottom: 0.8em;
    font-weight: 600;
    color: #24292e;
    position: relative;
}

.wechat-heading.wechat-heading-2::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #007acc;
    border-radius: 2px;
}

.wechat-heading.wechat-heading-3 {
    font-size: 1.25em;
    padding-left: 12px;
    margin-top: 1.5em;
    margin-bottom: 0.6em;
    color: #0366d6;
    font-weight: 600;
    position: relative;
}

.wechat-heading.wechat-heading-3::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #007acc;
    border-radius: 2px;
}

.wechat-heading.wechat-heading-4 {
    font-size: 1.1em;
    padding-left: 12px;
    margin-top: 1.3em;
    margin-bottom: 0.5em;
    color: #24292e;
    font-weight: 600;
    position: relative;
}

.wechat-heading.wechat-heading-4::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #007acc;
    border-radius: 2px;
}

.wechat-heading.wechat-heading-5 {
    font-size: 1em;
    padding-left: 12px;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    color: #586069;
    font-weight: 600;
    position: relative;
}

.wechat-heading.wechat-heading-5::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #007acc;
    border-radius: 2px;
}

.wechat-heading.wechat-heading-6 {
    font-size: 0.9em;
    padding-left: 12px;
    margin-top: 1em;
    margin-bottom: 0.3em;
    color: #6a737d;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
}

.wechat-heading.wechat-heading-6::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #007acc;
    border-radius: 2px;
}

/* 代码块样式 - 完全复制note-to-mp */
.code-section {
    display: flex;
    background-color: rgb(250, 250, 250);
    border: rgb(240, 240, 240) 1px solid;
}

.code-section ul {
    flex-shrink: 0;
    counter-reset: line;
    margin: 0;
    padding: 0.875em 0 0.875em 0.875em;
    white-space: normal;
    width: fit-content;
}

.code-section ul > li {
    font-family: Consolas, ui-monospace, SFMono-Regular, Menlo, Monaco, "Liberation Mono", "Courier New", monospace;
    position: relative;
    margin: 0;
    padding: 0;
    display: list-item;
    text-align: right;
    line-height: 1.75em;
    font-size: 0.875em;
    padding: 0;
    list-style-type: none;
    color: rgba(0, 0, 0, 0.25);
    text-wrap: nowrap;
}

.code-section pre {
    margin: 0;
    padding: 0;
    overflow: auto;
}

.code-section code {
    font-family: Consolas, ui-monospace, SFMono-Regular, Menlo, Monaco, "Liberation Mono", "Courier New", monospace;
    color: #5c5c5c;
    background-color: #fafafa;
    font-size: 0.875em;
    vertical-align: baseline;
    padding: 0 0.5em;
}

.code-section pre code {
    display: block;
    text-wrap: nowrap;
    line-height: 1.75em;
    padding: 1em;
    background: unset;
}

/* highlight.js 语法高亮样式 - note-to-mp风格 */
pre code.hljs {
    display: block;
    overflow-x: auto;
    padding: 0;
    background: transparent;
    white-space: pre;
    color: #24292e;
}

.hljs {
    display: block;
    color: #24292e;
    background: transparent;
    white-space: pre;
}

.hljs-comment, .hljs-quote {
    color: #6a737d;
    font-style: italic;
}

.hljs-keyword, .hljs-selector-tag, .hljs-type {
    color: #d73a49;
    font-weight: 600;
}

.hljs-string, .hljs-doctag {
    color: #032f62;
}

.hljs-title, .hljs-section {
    color: #6f42c1;
    font-weight: 600;
}

.hljs-variable, .hljs-template-variable {
    color: #e36209;
}

.hljs-number, .hljs-literal {
    color: #005cc5;
}

.hljs-attribute {
    color: #e36209;
}

.hljs-meta {
    color: #005cc5;
}

.hljs-built_in {
    color: #d73a49;
}

.hljs-class .hljs-title {
    color: #6f42c1;
}

.hljs-symbol, .hljs-bullet, .hljs-link {
    color: #005cc5;
}

/* 链接样式 */
.footnote-ref {
    cursor: default;
    color: inherit;
    text-decoration: none;
}

.footnote-num {
    color: #007acc;
    font-weight: 600;
    margin-left: 2px;
}

.inline-link {
    color: inherit;
}

.link-url {
    background: #f0f0f0;
    color: #666;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    margin-left: 4px;
}

/* 脚注样式 */
.footnotes {
    margin-top: 3em;
    padding-top: 1em;
    font-size: 0.9em;
    color: #666;
}

.footnotes-separator {
    width: 200px;
    margin: 0 0 1.5em 0;
    border: none;
    border-top: 1px solid #e1e8ed;
    background: none;
}

.footnotes-title {
    font-size: 1.1em;
    color: #333;
    margin: 0 0 1em 0;
    font-weight: 600;
}

.footnotes-list {
    margin: 0;
    padding-left: 1.5em;
    line-height: 1.6;
}
        `;
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