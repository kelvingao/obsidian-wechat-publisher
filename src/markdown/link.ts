import { Tokens, MarkedExtension } from "marked";
import { Extension } from "./extension";

/**
 * Enhanced Link Optimization Extension
 * 基于note-to-mp的链接优化实现，支持脚注式和内联式链接
 */
export class LinkExtension extends Extension {
    private allLinks: string[] = [];

    /**
     * 准备阶段：重置链接收集
     */
    async prepare(): Promise<void> {
        this.allLinks = [];
    }

    /**
     * 后处理：添加脚注样式的链接列表
     */
    async postprocess(html: string): Promise<string> {
        // 只有当设置为脚注样式且有链接时才处理
        if (this.settings.linkStyle !== 'footnote' || this.allLinks.length === 0) {
            return html;
        }

        // 生成脚注链接列表
        const links = this.allLinks.map((href, index) => {
            return `<li><a href="${this.escapeHtml(href)}" target="_blank">${this.escapeHtml(href)}</a>&nbsp;↩</li>`;
        });

        const footnotesSection = `
            <section class="footnotes">
                <hr class="footnotes-separator">
                <h3 class="footnotes-title">参考链接</h3>
                <ol class="footnotes-list">${links.join('')}</ol>
            </section>
        `;

        // 添加脚注样式
        const footnoteStyles = this.getFootnoteStyles();
        
        // 在HTML中插入样式和脚注
        let result = html;
        if (html.includes('<style>')) {
            result = html.replace('</style>', footnoteStyles + '\n</style>');
        } else {
            result = `<style>${footnoteStyles}</style>\n${html}`;
        }

        return result + footnotesSection;
    }

    /**
     * 获取marked扩展配置
     */
    markedExtension(): MarkedExtension {
        return {
            extensions: [{
                name: 'link',
                level: 'inline',
                renderer: (token: Tokens.Link) => {
                    return this.renderLink(token);
                }
            }]
        };
    }

    /**
     * 渲染链接
     */
    private renderLink(token: Tokens.Link): string {
        const { href, text, title } = token;

        // 跳过邮件链接
        if (href.startsWith('mailto:')) {
            return text;
        }

        // 检查是否为微信公众号链接或直接显示链接
        if (this.isDirectDisplayLink(href, text)) {
            const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
            return `<a href="${this.escapeHtml(href)}" target="_blank"${titleAttr}>${this.escapeHtml(text)}</a>`;
        }

        // 收集外部链接
        this.allLinks.push(href);

        // 根据设置选择链接样式
        if (this.settings.linkStyle === 'footnote') {
            // 脚注样式：显示为上标数字
            return `<a class="footnote-ref">${this.escapeHtml(text)}<sup class="footnote-num">[${this.allLinks.length}]</sup></a>`;
        } else {
            // 内联样式：直接显示链接地址
            return `<span class="inline-link">${this.escapeHtml(text)} <code class="link-url">[${this.escapeHtml(href)}]</code></span>`;
        }
    }

    /**
     * 判断链接是否应该直接显示（不转换为脚注）
     */
    private isDirectDisplayLink(href: string, text: string): boolean {
        // 如果链接文本包含链接地址，直接显示
        if (text.indexOf(href) === 0) {
            return true;
        }

        // 微信公众号文章链接直接显示
        if (href.indexOf('https://mp.weixin.qq.com/mp') === 0 ||
            href.indexOf('https://mp.weixin.qq.com/s') === 0) {
            return true;
        }

        // 内部链接（如果是相对路径）
        if (!href.startsWith('http') && !href.startsWith('//')) {
            return true;
        }

        return false;
    }

    /**
     * 获取脚注样式
     */
    private getFootnoteStyles(): string {
        return `
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

/* 脚注部分样式 */
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

.footnotes-list li {
    margin-bottom: 0.5em;
    word-break: break-all;
}

.footnotes-list a {
    color: #007acc;
    text-decoration: none;
    border-bottom: 1px dotted #007acc;
    transition: all 0.2s ease;
}

.footnotes-list a:hover {
    color: #005999;
    border-bottom-color: #005999;
}
        `;
    }

    /**
     * HTML转义
     */
    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}