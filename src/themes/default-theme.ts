/**
 * 默认微信主题样式
 * 基于当前wechat-publisher.ts中的样式提取和优化
 */
import { WeChatTheme } from '../types';

const defaultThemeCSS = `
/* =========================================================== */
/* 微信公众号默认样式主题                                        */
/* =========================================================== */
.wechat-content {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    color: #24292e;
    line-height: 1.6;
    word-wrap: break-word;
    font-size: 16px;
    padding: 20px;
    max-width: 100%;
}

/* 标题样式 */
.wechat-content h1, 
.wechat-content h2, 
.wechat-content h3, 
.wechat-content h4, 
.wechat-content h5, 
.wechat-content h6 {
    font-weight: 600;
    line-height: 1.25;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    color: #24292e;
    position: relative;
}

.wechat-content h1 {
    font-size: 1.8em;
    padding-left: 12px;
    margin-top: 0;
    margin-bottom: 1em;
    border-left: 4px solid #007acc;
}

.wechat-content h2 {
    font-size: 1.5em;
    padding-left: 12px;
    margin-top: 1.8em;
    margin-bottom: 0.8em;
    border-left: 4px solid #007acc;
}

.wechat-content h3 {
    font-size: 1.25em;
    padding-left: 12px;
    margin-top: 1.5em;
    margin-bottom: 0.6em;
    color: #0366d6;
    border-left: 3px solid #007acc;
}

.wechat-content h4 {
    font-size: 1.1em;
    padding-left: 12px;
    margin-top: 1.3em;
    margin-bottom: 0.5em;
    color: #0366d6;
    border-left: 2px solid #007acc;
}

.wechat-content h5 {
    font-size: 1em;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    color: #586069;
    font-weight: 600;
}

.wechat-content h6 {
    font-size: 0.875em;
    margin-top: 1em;
    margin-bottom: 0.3em;
    color: #586069;
    font-weight: 600;
}

/* 段落样式 */
.wechat-content p {
    margin: 1em 0;
    line-height: 1.6;
    color: #24292e;
    text-align: justify;
}

/* 强调文本 */
.wechat-content strong {
    font-weight: 600;
    color: #24292e;
}

.wechat-content em {
    font-style: italic;
    color: #24292e;
}

/* 链接样式 */
.wechat-content a {
    color: #007acc;
    text-decoration: none;
    border-bottom: 1px solid #007acc;
    transition: all 0.3s ease;
}

.wechat-content a:hover {
    color: #005c99;
    border-bottom-color: #005c99;
}

/* 引用块样式 */
.wechat-content blockquote {
    border-left: 4px solid #dfe2e5;
    margin: 1em 0;
    padding: 0.5em 0 0.5em 1em;
    color: #6a737d;
    background-color: #f6f8fa;
    border-radius: 3px;
}

.wechat-content blockquote p {
    margin: 0.5em 0;
    color: #6a737d;
}

/* 代码样式 */
.wechat-content code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.9em;
    color: #e83e8c;
}

.wechat-content pre {
    background: #f8f9fa;
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid #e1e4e8;
    margin: 1em 0;
}

.wechat-content pre code {
    background: transparent;
    padding: 0;
    color: #24292e;
    font-size: 0.875em;
    line-height: 1.45;
}

/* 代码块结构样式 - 简化版无行号 */
.wechat-content .code-section {
    background-color: #f8f9fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    margin: 1em 0;
    overflow-x: auto;
    max-width: 100%;
}

.wechat-content .code-section pre {
    margin: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
}

.wechat-content .code-section pre code {
    display: block;
    white-space: pre;
    word-wrap: normal;
    word-break: normal;
    line-height: 1.6;
    padding: 1em;
    background: unset;
    overflow-wrap: normal;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Monaco, "Courier New", monospace;
    color: #24292e;
    font-size: 0.875em;
    vertical-align: baseline;
}

/* 列表样式 */
.wechat-content ul,
.wechat-content ol {
    margin: 1em 0;
    padding-left: 2em;
}

.wechat-content li {
    margin: 0.25em 0;
    line-height: 1.6;
}

.wechat-content ul li {
    list-style-type: disc;
}

.wechat-content ol li {
    list-style-type: decimal;
}

/* 图片样式 */
.wechat-content img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1.5em auto;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表格样式 */
.wechat-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.5em 0;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    overflow: hidden;
}

.wechat-content th,
.wechat-content td {
    border: 1px solid #e1e4e8;
    padding: 8px 12px;
    text-align: left;
    line-height: 1.5;
}

.wechat-content th {
    background-color: #f6f8fa;
    font-weight: 600;
    color: #24292e;
}

.wechat-content tr:nth-child(even) {
    background-color: #f6f8fa;
}

/* 水平分割线 */
.wechat-content hr {
    border: none;
    height: 1px;
    background-color: #e1e4e8;
    margin: 2em 0;
}

/* 脚注样式 */
.wechat-content .footnotes {
    margin-top: 3em;
    padding-top: 1.5em;
    border-top: 1px solid #e1e4e8;
}

.wechat-content .footnotes hr {
    display: none;
}

.wechat-content .footnotes ol {
    font-size: 0.9em;
    color: #6a737d;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .wechat-content {
        padding: 15px;
        font-size: 15px;
    }
    
    .wechat-content h1 {
        font-size: 1.6em;
    }
    
    .wechat-content h2 {
        font-size: 1.4em;
    }
    
    .wechat-content h3 {
        font-size: 1.2em;
    }
    
    .wechat-content .code-section {
        font-size: 14px;
        margin: 8px 0;
    }
    
    .wechat-content .code-section pre code {
        font-size: 0.8em;
        padding: 0.8em;
        line-height: 1.5;
    }
}
`;

export const DefaultTheme: WeChatTheme = {
    name: '默认主题',
    className: 'wechat-default',
    description: '简洁清新的微信公众号默认主题样式，适合技术文章和日常分享',
    author: 'Obsidian WeChat Publisher',
    css: defaultThemeCSS,
    version: '1.0.0'
};

export default DefaultTheme;