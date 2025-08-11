/**
 * 默认代码高亮主题
 * 基于GitHub风格的语法高亮
 */
import { HighlightTheme } from '../types';

const githubHighlightCSS = `
/* GitHub风格代码高亮 */
.hljs {
    display: block;
    background: #f8f9fa;
    color: #24292e;
    padding: 0.5em;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

/* 注释 */
.hljs-comment,
.hljs-quote {
    color: #6a737d;
    font-style: italic;
}

/* 关键字 */
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-section,
.hljs-doctag,
.hljs-type,
.hljs-name {
    color: #d73a49;
    font-weight: 600;
}

/* 字符串 */
.hljs-string,
.hljs-title,
.hljs-number,
.hljs-regexp,
.hljs-template-literal {
    color: #032f62;
}

/* 变量 */
.hljs-variable,
.hljs-template-variable,
.hljs-attribute,
.hljs-tag,
.hljs-built_in {
    color: #e36209;
}

/* 函数名 */
.hljs-function .hljs-title,
.hljs-title.function_,
.hljs-params {
    color: #6f42c1;
}

/* 类名 */
.hljs-class .hljs-title,
.hljs-title.class_ {
    color: #6f42c1;
    font-weight: 600;
}

/* 元字符 */
.hljs-meta,
.hljs-meta .hljs-keyword,
.hljs-meta-keyword {
    color: #005cc5;
}

/* 符号 */
.hljs-symbol,
.hljs-bullet,
.hljs-link {
    color: #005cc5;
}

/* 属性 */
.hljs-attr {
    color: #6f42c1;
}

/* 删除和添加 */
.hljs-deletion {
    background-color: #ffeef0;
    color: #cb2431;
}

.hljs-addition {
    background-color: #f0fff4;
    color: #22863a;
}

/* 强调 */
.hljs-emphasis {
    font-style: italic;
}

.hljs-strong {
    font-weight: bold;
}

/* 选择器 */
.hljs-selector-id,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo {
    color: #6f42c1;
}

/* 公式 */
.hljs-formula {
    background-color: #f6f8fa;
    color: #24292e;
}
`;

const monochromeHighlightCSS = `
/* 单色简洁风格代码高亮 */
.hljs {
    display: block;
    background: #fafafa;
    color: #333;
    padding: 0.5em;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.hljs-comment,
.hljs-quote {
    color: #999;
    font-style: italic;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-literal {
    color: #000;
    font-weight: 600;
}

.hljs-string,
.hljs-title {
    color: #666;
}

.hljs-number,
.hljs-symbol,
.hljs-bullet {
    color: #333;
}

.hljs-function .hljs-title,
.hljs-variable,
.hljs-template-variable,
.hljs-attribute {
    color: #555;
}

.hljs-meta,
.hljs-type {
    color: #777;
}

.hljs-emphasis {
    font-style: italic;
}

.hljs-strong {
    font-weight: bold;
}
`;

export const DefaultHighlights: HighlightTheme[] = [
    {
        name: 'GitHub',
        css: githubHighlightCSS,
        language: 'all'
    },
    {
        name: '简洁单色',
        css: monochromeHighlightCSS, 
        language: 'all'
    }
];

export default DefaultHighlights;