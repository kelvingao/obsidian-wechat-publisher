import { MarkedExtension, Tokens } from "marked";
import { Extension } from "./extension";

/**
 * Enhanced Heading Extension
 * 多级标题优化，提供更好的层级样式和间距
 */
export class HeadingExtension extends Extension {

    /**
     * 获取marked扩展配置
     */
    markedExtension(): MarkedExtension {
        return {
            extensions: [{
                name: 'heading',
                level: 'block',
                renderer: (token: Tokens.Heading) => {
                    return this.renderHeading(token.text, token.depth);
                }
            }]
        };
    }

    /**
     * 渲染标题
     */
    private renderHeading(text: string, level: number): string {
        // 确保level在有效范围内
        level = Math.max(1, Math.min(6, level));
        
        // 为不同级别的标题添加特殊类名
        const headingClass = this.getHeadingClass(level);
        const headingId = this.generateHeadingId(text);
        
        return `<h${level} class="${headingClass}" id="${headingId}">${text}</h${level}>`;
    }

    /**
     * 获取标题样式类名
     */
    private getHeadingClass(level: number): string {
        const baseClass = 'wechat-heading';
        return `${baseClass} ${baseClass}-${level}`;
    }

    /**
     * 生成标题ID（用于锚点）
     */
    private generateHeadingId(text: string): string {
        return 'heading-' + text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fff]+/g, '-')  // 保留中文字符
            .replace(/^-+|-+$/g, '')                // 移除首尾的短横线
            .substring(0, 50);                      // 限制长度
    }

    /**
     * 后处理：添加标题样式
     */
    async postprocess(html: string): Promise<string> {
        // 如果没有标题，直接返回
        if (!html.includes('wechat-heading')) {
            return html;
        }

        // 添加标题样式
        const headingStyles = this.getHeadingStyles();
        
        // 在HTML中插入样式
        if (html.includes('<style>')) {
            html = html.replace('</style>', headingStyles + '\n</style>');
        } else {
            html = `<style>${headingStyles}</style>\n${html}`;
        }

        return html;
    }

    /**
     * 获取标题样式
     */
    private getHeadingStyles(): string {
        return `
/* 标题基础样式 */
.wechat-heading {
    font-weight: 600;
    line-height: 1.25;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    color: #24292e;
    position: relative;
}

/* 第一个标题减少顶部边距 */
.wechat-heading:first-child {
    margin-top: 0;
}

/* H1 - 一级标题 */
.wechat-heading-1 {
    font-size: 1.8em;
    padding-left: 12px;
    margin-top: 0;
    margin-bottom: 1em;
}

.wechat-heading-1::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #007acc;
    border-radius: 2px;
}

/* H2 - 二级标题 */
.wechat-heading-2 {
    font-size: 1.5em;
    padding-left: 12px;
    margin-top: 1.8em;
    margin-bottom: 0.8em;
}

.wechat-heading-2::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #007acc;
    border-radius: 2px;
}

/* H3 - 三级标题 */
.wechat-heading-3 {
    font-size: 1.25em;
    padding-left: 12px;
    margin-top: 1.5em;
    margin-bottom: 0.6em;
    color: #0366d6;
}

.wechat-heading-3::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #007acc;
    border-radius: 2px;
}

/* H4 - 四级标题 */
.wechat-heading-4 {
    font-size: 1.1em;
    padding-left: 12px;
    margin-top: 1.3em;
    margin-bottom: 0.5em;
    color: #24292e;
}

.wechat-heading-4::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #007acc;
    border-radius: 2px;
}

/* H5 - 五级标题 */
.wechat-heading-5 {
    font-size: 1em;
    padding-left: 12px;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    color: #586069;
    font-weight: 600;
}

.wechat-heading-5::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #007acc;
    border-radius: 2px;
}

/* H6 - 六级标题 */
.wechat-heading-6 {
    font-size: 0.9em;
    padding-left: 12px;
    margin-top: 1em;
    margin-bottom: 0.3em;
    color: #6a737d;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.wechat-heading-6::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #007acc;
    border-radius: 2px;
}

/* 标题间距优化 */
.wechat-heading + p,
.wechat-heading + ul,
.wechat-heading + ol,
.wechat-heading + blockquote,
.wechat-heading + pre {
    margin-top: 0.5em;
}

/* 连续标题间距调整 */
.wechat-heading + .wechat-heading {
    margin-top: 1em;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .wechat-heading-1 {
        font-size: 1.6em;
    }
    
    .wechat-heading-2 {
        font-size: 1.3em;
    }
    
    .wechat-heading-3 {
        font-size: 1.15em;
    }
}

/* 深色模式支持（如果需要） */
@media (prefers-color-scheme: dark) {
    .wechat-heading {
        color: #f0f6fc;
    }
    
    .wechat-heading-1::before,
    .wechat-heading-2::before,
    .wechat-heading-3::before,
    .wechat-heading-4::before,
    .wechat-heading-5::before,
    .wechat-heading-6::before {
        background: #58a6ff;
    }
    
    .wechat-heading-3 {
        color: #58a6ff;
    }
}
        `;
    }
}