import { Tokens } from "marked";
import { Extension } from "./extension";

/**
 * 代码渲染扩展 - 生成代码块HTML结构和特殊类型处理
 */
export class CodeRenderer extends Extension {

    /**
     * 代码渲染器 - 优化WeChat显示效果（已移除行号功能）
     */
    codeRenderer(code: string, infostring: string | undefined): string {
        const lang = (infostring || '').match(/^\S*/)?.[0];
        
        // 标准化代码内容
        code = code.trim();

        // 简化的代码块结构，不包含行号
        const codeSection = '<section class="code-section">';

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
     * 获取数学类型 - 检测是否为LaTeX或AsciiMath格式
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
     * 后处理：针对不同的输出模式进行处理
     */
    async postprocess(html: string): Promise<string> {
        // 如果没有代码块，直接返回
        if (!html.includes('code-section')) {
            return html;
        }
        
        return html;
    }
    
    /**
     * 发布前处理：为微信公众号转换换行符
     */
    async beforePublish(): Promise<void> {
        // 这个方法会在发布前调用，用于处理代码块的换行符问题
        // 但我们需要在postprocess中根据上下文来处理
    }



}