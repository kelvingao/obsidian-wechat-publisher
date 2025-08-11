import { Tokens } from "marked";
import { Extension } from "./extension";

/**
 * 代码渲染扩展 - 基于note-to-mp实现
 */
export class CodeRenderer extends Extension {

    /**
     * 代码渲染器 - 完全按照note-to-mp实现
     */
    codeRenderer(code: string, infostring: string | undefined): string {
        const lang = (infostring || '').match(/^\S*/)?.[0];
        code = code.replace(/\n$/, '') + '\n';

        let codeSection = '';
        if (this.settings.lineNumber) {
            const lines = code.split('\n');

            let liItems = '';
            let count = 1;
            while (count < lines.length) {
                liItems = liItems + `<li>${count}</li>`;
                count = count + 1;
            }
            codeSection = '<section class="code-section"><ul>'
                + liItems
                + '</ul>';
        }
        else {
            codeSection = '<section class="code-section">';
        }

        if (!lang) {
            return codeSection + '<pre><code>'
                + code
                + '</code></pre></section>\n';
        }

        return codeSection + '<pre><code class="hljs language-'
            + lang
            + '">'
            + code
            + '</code></pre></section>\n';
    }

    /**
     * 获取数学类型 - 复制note-to-mp的实现
     */
    static getMathType(lang: string | null) {
        if (!lang) return null;
        let l = lang.toLowerCase();
        l = l.trim();
        if (l === 'am' || l === 'asciimath') return 'asciimath';
        if (l === 'latex' || l === 'tex') return 'latex';
        return null;
    }

    /**
     * marked扩展配置
     */
    markedExtension() {
        return {
            extensions: [{
                name: 'code',
                level: 'block',
                renderer: (token: Tokens.Code) => {
                    // 检查特殊语言类型
                    const type = CodeRenderer.getMathType(token.lang ?? '');
                    if (type) {
                        // 这里应该调用数学公式渲染，暂时返回原文
                        return `<div class="math-${type}">${token.text}</div>`;
                    }
                    
                    // 检查特殊代码类型
                    if (token.lang && token.lang.trim().toLowerCase() == 'mermaid') {
                        return `<div class="mermaid">${token.text}</div>`;
                    }
                    
                    if (token.lang && token.lang.trim().toLowerCase() == 'mpcard') {
                        return `<div class="mpcard">${token.text}</div>`;
                    }
                    
                    return this.codeRenderer(token.text, token.lang);
                },
            }]
        }
    }

    /**
     * 后处理：添加代码块样式
     */
    async postprocess(html: string): Promise<string> {
        // 如果没有代码块，直接返回
        if (!html.includes('code-section')) {
            return html;
        }

        // 获取完整样式
        const styles = this.getCodeStyles();
        
        // 在HTML开头插入样式
        if (html.includes('<style>')) {
            // 已有样式标签，在其中插入
            html = html.replace('</style>', styles + '\n</style>');
        } else {
            // 没有样式标签，创建新的
            html = `<style>${styles}</style>\n${html}`;
        }

        return html;
    }

    /**
     * 获取代码块样式 - 完全复制note-to-mp
     */
    private getCodeStyles(): string {
        return `
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
        `;
    }
}