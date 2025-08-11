/**
 * ContentConverterV2 测试
 * 测试新的Extension架构集成
 */

import { ContentConverterV2 } from '../src/converter';
import { WeChatSettings, DEFAULT_SETTINGS } from '../src/settings';

// Mock Obsidian API
const mockApp = {
    vault: {
        read: jest.fn(),
        getFiles: jest.fn(() => []),
        adapter: {
            getResourcePath: (path: string) => `file://${path}`
        }
    },
    metadataCache: {
        getFileCache: jest.fn()
    }
} as any;

const mockApiManager = {
    uploadImage: jest.fn(async (path: string) => `https://mock-wechat-url.com/${path.split('/').pop()}`),
    uploadMaterial: jest.fn(async (path: string, name: string) => 'mock-media-id')
} as any;

const mockFile = {
    basename: 'test-article',
    name: 'test-article.md',
    path: 'articles/test-article.md'
} as any;

describe('ContentConverterV2', () => {
    let converter: ContentConverterV2;
    let settings: WeChatSettings;

    beforeEach(() => {
        settings = { ...DEFAULT_SETTINGS };
        converter = new ContentConverterV2(mockApp, mockApiManager, settings);
        
        // Reset mocks
        jest.clearAllMocks();
    });

    describe('Metadata Parsing', () => {
        test('should parse complete frontmatter', () => {
            const frontmatter = {
                title: 'Test Article',
                author: 'Test Author',
                digest: 'Test digest',
                banner: 'images/banner.png',
                content_source_url: 'https://example.com',
                need_open_comment: 1,
                tags: ['tech', 'tutorial']
            };

            const metadata = converter.parseMetadata(frontmatter);

            expect(metadata.title).toBe('Test Article');
            expect(metadata.author).toBe('Test Author');
            expect(metadata.digest).toBe('Test digest');
            expect(metadata.banner).toBe('images/banner.png');
            expect(metadata.content_source_url).toBe('https://example.com');
            expect(metadata.need_open_comment).toBe(1);
            expect(metadata.tags).toEqual(['tech', 'tutorial']);
        });

        test('should handle empty frontmatter', () => {
            const metadata = converter.parseMetadata(undefined);
            expect(metadata).toEqual({});
        });

        test('should handle partial frontmatter', () => {
            const frontmatter = {
                title: 'Partial Article'
            };

            const metadata = converter.parseMetadata(frontmatter);
            
            expect(metadata.title).toBe('Partial Article');
            expect(metadata.author).toBeUndefined();
            expect(metadata.digest).toBeUndefined();
        });
    });

    describe('Preview Generation', () => {
        test('should generate preview with frontmatter info', async () => {
            const content = `---
title: Test Article
author: Test Author
banner: images/test.png
---

# Hello World

This is a test article with **bold** text and an image:

![[test-image.png]]
`;

            const frontmatter = {
                title: 'Test Article',
                author: 'Test Author',
                banner: 'images/test.png'
            };

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter });
            mockApp.vault.getFiles.mockReturnValue([
                { name: 'test-image.png', path: 'images/test-image.png' }
            ]);

            const html = await converter.markdownToHtmlForPreview(mockFile);

            expect(html).toContain('📝 文章发布信息');
            expect(html).toContain('Test Article');
            expect(html).toContain('Test Author');
            expect(html).toContain('Hello World');
            expect(html).toContain('<strong>bold</strong>');
            expect(html).toContain('<img');
        });

        test('should handle content without frontmatter', async () => {
            const content = `# Simple Article

Just a simple article without frontmatter.`;

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter: null });

            const html = await converter.markdownToHtmlForPreview(mockFile);

            expect(html).not.toContain('📝 文章发布信息');
            expect(html).toContain('Simple Article');
            expect(html).toContain('Just a simple article');
        });
    });

    describe('Article Conversion', () => {
        test('should convert file to article data successfully', async () => {
            const content = `---
title: Test Article
author: Test Author
digest: Test digest
banner: images/banner.png
content_source_url: https://example.com
need_open_comment: 1
---

# Test Content

This is a test article with an image:

![[test.png]]
`;

            const frontmatter = {
                title: 'Test Article',
                author: 'Test Author',
                digest: 'Test digest',
                banner: 'images/banner.png',
                content_source_url: 'https://example.com',
                need_open_comment: 1
            };

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter });
            mockApp.vault.getFiles.mockReturnValue([
                { name: 'test.png', path: 'images/test.png' }
            ]);

            const articleData = await converter.convertFileToArticle(mockFile);

            expect(articleData).toBeDefined();
            expect(articleData!.title).toBe('Test Article');
            expect(articleData!.author).toBe('Test Author');
            expect(articleData!.digest).toBe('Test digest');
            expect(articleData!.content_source_url).toBe('https://example.com');
            expect(articleData!.need_open_comment).toBe(1);
            expect(articleData!.thumb_media_id).toBe('mock-media-id');
            expect(articleData!.content).toContain('<section id="nice">');
            expect(articleData!.content).toContain('Test Content');

            // 验证API调用
            expect(mockApiManager.uploadMaterial).toHaveBeenCalledWith('images/banner.png', 'Test Article_banner');
        });

        test('should throw error when no banner is provided', async () => {
            const content = `---
title: Test Article
author: Test Author
---

# Test Content`;

            const frontmatter = {
                title: 'Test Article',
                author: 'Test Author'
            };

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter });

            await expect(converter.convertFileToArticle(mockFile))
                .rejects
                .toThrow('Please set banner/cover image in frontmatter');
        });

        test('should throw error when no frontmatter is provided', async () => {
            const content = `# Test Content

Just content without frontmatter.`;

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter: undefined });

            await expect(converter.convertFileToArticle(mockFile))
                .rejects
                .toThrow('Please add frontmatter with banner/cover image configuration');
        });

        test('should use thumb_media_id when provided', async () => {
            const content = `---
title: Test Article
thumb_media_id: existing-media-id
---

# Test Content`;

            const frontmatter = {
                title: 'Test Article',
                thumb_media_id: 'existing-media-id'
            };

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter });

            const articleData = await converter.convertFileToArticle(mockFile);

            expect(articleData!.thumb_media_id).toBe('existing-media-id');
            expect(mockApiManager.uploadMaterial).not.toHaveBeenCalled();
        });
    });

    describe('Settings Update', () => {
        test('should update settings and reinitialize parser', () => {
            const newSettings = {
                ...DEFAULT_SETTINGS,
                defaultAuthor: 'New Author'
            };

            converter.updateSettings(newSettings);

            // 验证设置已更新（通过验证新设置生效来间接验证）
            expect((converter as any).settings.defaultAuthor).toBe('New Author');
        });
    });

    describe('HTML Processing', () => {
        test('should sanitize dangerous HTML', async () => {
            const content = `---
title: Test
banner: test.png
---

# Test

<script>alert('xss')</script>
<iframe src="evil.com"></iframe>
<img src="test.jpg" onclick="evil()">
`;

            const frontmatter = {
                title: 'Test',
                banner: 'test.png'
            };

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter });

            const articleData = await converter.convertFileToArticle(mockFile);

            expect(articleData!.content).not.toContain('<script>');
            expect(articleData!.content).not.toContain('<iframe>');
            expect(articleData!.content).not.toContain('onclick');
            expect(articleData!.content).not.toContain('alert');
        });

        test('should preserve safe HTML and styling', async () => {
            const content = `---
title: Test
banner: test.png
---

# Test Heading

**Bold text** and *italic text*.

> Blockquote text

\`inline code\`

\`\`\`javascript
console.log('code block');
\`\`\`
`;

            const frontmatter = {
                title: 'Test',
                banner: 'test.png'
            };

            mockApp.vault.read.mockResolvedValue(content);
            mockApp.metadataCache.getFileCache.mockReturnValue({ frontmatter });

            const articleData = await converter.convertFileToArticle(mockFile);

            expect(articleData!.content).toContain('Test Heading');
            expect(articleData!.content).toContain('<strong>Bold text</strong>');
            expect(articleData!.content).toContain('<em>italic text</em>');
            expect(articleData!.content).toContain('<blockquote>');
            expect(articleData!.content).toContain('<code>');
            expect(articleData!.content).toContain('<pre>');
        });
    });
});