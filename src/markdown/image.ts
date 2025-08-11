import { MarkedExtension, Token, Tokens } from 'marked';
import { TFile } from 'obsidian';
import { Extension } from './extension';
import { cleanUrl } from '../utils';

/**
 * 本地图片链接正则表达式
 * 匹配 ![[filename]] 格式的图片引用
 */
const LocalImageRegex = /^!\[\[(.*?)\]\]/;

/**
 * 图片信息接口
 */
interface ImageInfo {
    resUrl: string;      // 资源URL（本地路径或远程URL）
    filePath: string;    // 文件路径
    uploadedUrl: string | null;  // 上传后的微信URL
}

/**
 * Image Extension
 * 处理图片的解析、管理和上传
 */
export class ImageExtension extends Extension {
    private images = new Map<string, ImageInfo>();
    private imageIndex = 0;

    /**
     * 生成唯一的图片ID
     */
    private generateImageId(): string {
        this.imageIndex += 1;
        return `img-${this.imageIndex}`;
    }

    /**
     * 检查文件是否为图片
     */
    private isImage(filename: string): boolean {
        const name = filename.toLowerCase();
        return name.endsWith('.png') ||
               name.endsWith('.jpg') ||
               name.endsWith('.jpeg') ||
               name.endsWith('.gif') ||
               name.endsWith('.bmp') ||
               name.endsWith('.webp') ||
               name.endsWith('.svg');
    }

    /**
     * 解析图片链接，支持尺寸和对齐设置
     * 格式: ![[image.png|300x200|center]]
     */
    private parseImageLink(link: string): {
        path: string;
        width: number | null;
        height: number | null;
        align: string;
    } {
        const parts = link.split('|');
        const path = parts[0];
        let width: number | null = null;
        let height: number | null = null;
        let align = 'left';

        if (parts.length > 1) {
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i].trim();
                
                // 检查是否是对齐方式
                if (['left', 'center', 'right'].includes(part)) {
                    align = part;
                    continue;
                }
                
                // 检查是否是尺寸设置
                if (part.includes('x')) {
                    const [w, h] = part.split('x');
                    width = parseInt(w) || null;
                    height = parseInt(h) || null;
                } else if (/^\d+$/.test(part)) {
                    width = parseInt(part);
                }
            }
        }

        return { path, width, height, align };
    }

    /**
     * 获取本地图片路径
     */
    private getLocalImagePath(imagePath: string): string | null {
        // 尝试找到对应的文件
        const files = this.app.vault.getFiles();
        const imageFile = files.find(file => 
            file.name === imagePath || 
            file.path === imagePath ||
            file.path.endsWith('/' + imagePath)
        );

        if (imageFile) {
            const resourcePath = this.app.vault.adapter.getResourcePath(imageFile.path);
            
            // 记录图片信息
            const info: ImageInfo = {
                resUrl: resourcePath,
                filePath: imageFile.path,
                uploadedUrl: null
            };
            this.images.set(resourcePath, info);
            
            return resourcePath;
        }

        console.error('找不到图片文件：', imagePath);
        return null;
    }

    /**
     * 准备阶段 - 清理上次的图片记录
     */
    async prepare(): Promise<void> {
        this.images.clear();
        this.imageIndex = 0;
    }

    /**
     * 发布前处理 - 上传所有图片到微信
     */
    async beforePublish(): Promise<void> {
        console.log('开始上传图片到微信服务器...');
        
        for (const [resUrl, info] of this.images) {
            if (info.uploadedUrl) {
                continue; // 已经上传过了
            }

            try {
                const file = this.vault.getFiles().find(f => f.path === info.filePath);
                if (file) {
                    const uploadedUrl = await this.apiManager.uploadImage(file.path);
                    if (uploadedUrl) {
                        info.uploadedUrl = uploadedUrl;
                        console.log(`图片上传成功: ${file.name} -> ${uploadedUrl}`);
                    } else {
                        console.error('图片上传失败:', file.name);
                    }
                }
            } catch (error) {
                console.error('图片上传异常:', info.filePath, error);
            }
        }
    }

    /**
     * 后处理阶段 - 替换图片URL为上传后的URL
     */
    async postprocess(html: string): Promise<string> {
        let processedHtml = html;

        // 替换所有图片URL为上传后的URL
        for (const [resUrl, info] of this.images) {
            if (info.uploadedUrl) {
                // 替换src属性中的本地路径
                processedHtml = processedHtml.replace(
                    new RegExp(`src="${resUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
                    `src="${info.uploadedUrl}"`
                );
            }
        }

        return processedHtml;
    }

    /**
     * 清理阶段
     */
    async cleanup(): Promise<void> {
        this.images.clear();
    }

    /**
     * Marked Extension配置
     */
    markedExtension(): MarkedExtension {
        return {
            extensions: [
                {
                    name: 'LocalImage',
                    level: 'block',
                    start: (src: string) => {
                        const index = src.indexOf('![[');
                        if (index === -1) return;
                        return index;
                    },
                    tokenizer: (src: string) => {
                        const matches = src.match(LocalImageRegex);
                        if (matches == null) return;
                        
                        const token: Token = {
                            type: 'LocalImage',
                            raw: matches[0],
                            href: matches[1],
                            text: matches[1]
                        };
                        return token;
                    },
                    renderer: (token: Tokens.Image) => {
                        const { path, width, height, align } = this.parseImageLink(token.href);
                        
                        if (!this.isImage(path)) {
                            return `<span style="color: red;">不支持的文件类型: ${token.href}</span>`;
                        }

                        const src = this.getLocalImagePath(path);
                        
                        if (!src) {
                            return `<span style="color: red;">图片不存在: ${path}</span>`;
                        }

                        // 构建img标签属性
                        const widthAttr = width ? `width="${width}"` : '';
                        const heightAttr = height ? `height="${height}"` : '';
                        const styleAttr = align !== 'left' ? `style="display: block; margin: 0 ${align === 'center' ? 'auto' : '0 0 auto'};"` : '';

                        return `<img src="${src}" alt="${token.text}" ${widthAttr} ${heightAttr} ${styleAttr} />`;
                    }
                }
            ],
            renderer: {
                // 处理标准的 ![alt](src) 格式图片
                image: (href: string, title: string | null, text: string): string => {
                    const cleanHref = cleanUrl(href);
                    if (cleanHref === null) {
                        return text;
                    }
                    href = cleanHref;

                    // 如果是本地图片，记录到管理器中
                    if (!href.startsWith('http')) {
                        const localPath = this.getLocalImagePath(href);
                        if (localPath) {
                            href = localPath;
                        }
                    }

                    let out = `<img src="${href}" alt="${text}"`;
                    if (title) {
                        out += ` title="${title}"`;
                    }
                    out += ' style="max-width: 100%; height: auto;" />';
                    
                    return out;
                }
            }
        };
    }
}