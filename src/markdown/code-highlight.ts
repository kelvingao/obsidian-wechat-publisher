import { MarkedExtension } from "marked";
import { Extension } from "./extension";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { CodeRenderer } from "./code";

/**
 * 代码语法高亮扩展 - 使用highlight.js提供多主题语法高亮
 * 提供多种主题和语言支持
 */
export class CodeHighlight extends Extension {
    
    /**
     * marked扩展配置 - 使用highlight.js进行语法高亮
     */
    markedExtension(): MarkedExtension {
        return markedHighlight({
            langPrefix: 'hljs language-',
            highlight: (code, lang, info) => {
                // 检查是否为数学公式
                const type = CodeRenderer.getMathType(lang);
                if (type) return code;
                
                // 检查特殊语言类型
                if (lang && lang.trim().toLowerCase() === 'mpcard') return code;
                if (lang && lang.trim().toLowerCase() === 'mermaid') return code;
                
                // 使用highlight.js进行语法高亮
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        const result = hljs.highlight(code, { language: lang });
                        return result.value;
                    } catch (err) {
                        console.warn(`Failed to highlight ${lang} code:`, err);
                    }
                }
              
                // 自动检测语言
                try {
                    const result = hljs.highlightAuto(code);
                    return result.value;
                } catch (err) {
                    console.warn('Failed to auto-highlight code:', err);
                }
                
                return ''; // 使用默认转义
            }
        });
    }

    /**
     * 后处理：添加highlight.js主题样式
     */
    async postprocess(html: string): Promise<string> {
        // 如果没有代码块，直接返回
        if (!html.includes('hljs')) {
            return html;
        }

        // 获取高亮主题样式
        const highlightStyles = this.getHighlightStyles();
        
        // 在HTML中插入样式
        if (html.includes('<style>')) {
            // 已有样式标签，在其中插入
            html = html.replace('</style>', highlightStyles + '\n</style>');
        } else {
            // 没有样式标签，创建新的
            html = `<style>${highlightStyles}</style>\n${html}`;
        }

        return html;
    }

    /**
     * 获取highlight.js主题样式
     * 根据设置选择不同的主题
     */
    private getHighlightStyles(): string {
        const theme = this.settings.highlightTheme || 'default';
        
        // 基础highlight.js样式
        const baseStyles = `
/* highlight.js 基础样式 */
.hljs {
    display: block;
    overflow-x: auto;
    padding: 0;
    color: #333;
    background: transparent;
}

.hljs-comment,
.hljs-quote {
    color: #998;
    font-style: italic;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-subst {
    color: #333;
    font-weight: bold;
}

.hljs-number,
.hljs-literal,
.hljs-variable,
.hljs-template-variable,
.hljs-tag .hljs-attr {
    color: #008080;
}

.hljs-string,
.hljs-doctag {
    color: #d14;
}

.hljs-title,
.hljs-section,
.hljs-selector-id {
    color: #900;
    font-weight: bold;
}

.hljs-subst {
    font-weight: normal;
}

.hljs-type,
.hljs-class .hljs-title {
    color: #458;
    font-weight: bold;
}

.hljs-tag,
.hljs-name,
.hljs-attribute {
    color: #000080;
    font-weight: normal;
}

.hljs-regexp,
.hljs-link {
    color: #009926;
}

.hljs-symbol,
.hljs-bullet {
    color: #990073;
}

.hljs-built_in,
.hljs-builtin-name {
    color: #0086b3;
}

.hljs-meta {
    color: #999;
    font-weight: bold;
}

.hljs-deletion {
    background: #fdd;
}

.hljs-addition {
    background: #dfd;
}

.hljs-emphasis {
    font-style: italic;
}

.hljs-strong {
    font-weight: bold;
}
        `;
        
        // 根据主题返回对应样式
        switch (theme) {
            case 'dark':
                return baseStyles + this.getDarkThemeStyles();
            case 'monokai':
                return baseStyles + this.getMonokaiThemeStyles();
            case 'github':
                return baseStyles + this.getGithubThemeStyles();
            default:
                return baseStyles;
        }
    }

    /**
     * 暗色主题样式
     */
    private getDarkThemeStyles(): string {
        return `
/* 暗色主题覆盖 */
.hljs {
    color: #f8f8f2;
    background: #272822;
}

.hljs-comment,
.hljs-quote {
    color: #75715e;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-subst {
    color: #f92672;
}

.hljs-number,
.hljs-literal,
.hljs-variable,
.hljs-template-variable,
.hljs-tag .hljs-attr {
    color: #ae81ff;
}

.hljs-string,
.hljs-doctag {
    color: #e6db74;
}

.hljs-title,
.hljs-section,
.hljs-selector-id {
    color: #a6e22e;
}

.hljs-type,
.hljs-class .hljs-title {
    color: #66d9ef;
}
        `;
    }

    /**
     * Monokai主题样式
     */
    private getMonokaiThemeStyles(): string {
        return `
/* Monokai主题 */
.code-section {
    background-color: #2f2f2f !important;
    border-color: #444 !important;
}

.hljs {
    color: #f8f8f2;
}

.hljs-comment {
    color: #75715e;
}

.hljs-keyword {
    color: #f92672;
}

.hljs-string {
    color: #e6db74;
}

.hljs-number {
    color: #ae81ff;
}

.hljs-title {
    color: #a6e22e;
}
        `;
    }

    /**
     * GitHub主题样式
     */
    private getGithubThemeStyles(): string {
        return `
/* GitHub主题 */
.hljs-comment {
    color: #6a737d;
}

.hljs-keyword {
    color: #d73a49;
}

.hljs-string {
    color: #032f62;
}

.hljs-number {
    color: #005cc5;
}

.hljs-title {
    color: #6f42c1;
}
        `;
    }
}