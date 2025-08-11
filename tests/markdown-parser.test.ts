/**
 * Markdown Parser 测试
 * 测试Extension模式的架构和基础功能
 */

import { MarkdownParser } from '../src/markdown-parser';
import { ImageExtension } from '../src/markdown/image';
import { WeChatSettings, DEFAULT_SETTINGS } from '../src/settings';

// Mock Obsidian API
const mockApp = {
    vault: {
        getFiles: () => [],
        adapter: {
            getResourcePath: (path: string) => `file://${path}`
        }
    },
    metadataCache: {
        getFileCache: () => ({ frontmatter: null })
    }
} as any;

const mockApiManager = {
    uploadImage: async (path: string) => `https://mock-wechat-url.com/${path.split('/').pop()}`,
    uploadMaterial: async (path: string, name: string) => 'mock-media-id'
} as any;

describe('MarkdownParser Extension Architecture', () => {
    let parser: MarkdownParser;
    let settings: WeChatSettings;

    beforeEach(() => {
        settings = { ...DEFAULT_SETTINGS };
        parser = new MarkdownParser(mockApp, settings, mockApiManager);
    });

    afterEach(async () => {
        await parser.cleanup();
    });

    test('should initialize parser', () => {
        expect(parser).toBeDefined();
        expect(parser.marked).toBeUndefined();
    });

    test('should have extensions by default', () => {
        // MarkdownParser now automatically adds extensions in constructor
        expect(parser.extensions.length).toBeGreaterThan(0);
    });

    test('should build marked instance with extensions', async () => {
        await parser.buildMarked();
        
        expect(parser.marked).toBeDefined();
    });

    test('should parse basic markdown', async () => {
        const markdown = `# Hello World

This is a **bold** text and *italic* text.

- List item 1
- List item 2

\`\`\`javascript
console.log('Hello, World!');
\`\`\``;

        const html = await parser.parse(markdown);
        
        expect(html).toContain('Hello World');
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<em>italic</em>');
        expect(html).toContain('<ul>');
        expect(html).toContain('<li>List item 1</li>');
        expect(html).toContain('<pre><code class="hljs language-javascript">');
    });

    test('should handle empty content', async () => {
        const html = await parser.parse('');
        expect(html).toBe('');
    });

    test('should parse content', async () => {
        const html = await parser.parse('# Test');
        
        expect(html).toContain('Test');
    });

    test('should handle parseForPublish workflow', async () => {
        const html = await parser.parseForPublish('# Test Content');
        
        expect(html).toContain('Test Content');
    });

    test('should handle caching mechanism', () => {
        parser.cacheElement('test', 'item1', 'data1');
        parser.cacheElement('test', 'item2', 'data2');
        parser.cacheElement('other', 'item1', 'other-data');
        
        expect(parser.getCachedElement('test', 'item1')).toBe('data1');
        expect(parser.getCachedElement('test', 'item2')).toBe('data2');
        expect(parser.getCachedElement('other', 'item1')).toBe('other-data');
        expect(parser.getCachedElement('test', 'nonexistent')).toBeUndefined();
    });

    test('should handle update callbacks', () => {
        const mockCallback = jest.fn();
        parser.registerUpdateCallback('test-id', mockCallback);
        parser.updateElementByID('test-id', '<p>Updated content</p>');
        
        expect(mockCallback).toHaveBeenCalledWith('<p>Updated content</p>');
    });
});

describe('ImageExtension', () => {
    let parser: MarkdownParser;
    let imageExt: ImageExtension;
    let settings: WeChatSettings;

    beforeEach(() => {
        settings = { ...DEFAULT_SETTINGS };
        parser = new MarkdownParser(mockApp, settings, mockApiManager);
        // Get the image extension that was automatically added
        imageExt = parser.extensions.find(ext => ext instanceof ImageExtension) as ImageExtension;
    });

    afterEach(async () => {
        await parser.cleanup();
    });

    test('should handle standard markdown images', async () => {
        // Mock no files in vault, so it should use the original path
        mockApp.vault.getFiles = () => [];
        
        const markdown = '![Alt text](image.png)';
        const html = await parser.parse(markdown);
        
        expect(html).toContain('<img');
        expect(html).toContain('src="image.png"'); // 应该使用原始路径，因为找不到文件
        expect(html).toContain('alt="Alt text"');
    });

    test('should handle local image links with sizes', async () => {
        // Mock a file in the vault
        mockApp.vault.getFiles = () => [{
            name: 'test.png',
            path: 'images/test.png'
        }];

        const markdown = '![[test.png|300x200]]';
        const html = await parser.parse(markdown);
        
        expect(html).toContain('width="300"');
        expect(html).toContain('height="200"');
    });

    test('should handle image alignment', async () => {
        mockApp.vault.getFiles = () => [{
            name: 'test.png',
            path: 'images/test.png'
        }];

        const markdown = '![[test.png|center]]';
        const html = await parser.parse(markdown);
        
        expect(html).toContain('margin: 0 auto');
    });

    test('should handle non-existent images gracefully', async () => {
        mockApp.vault.getFiles = () => [];

        const markdown = '![[nonexistent.png]]';
        const html = await parser.parse(markdown);
        
        expect(html).toContain('图片不存在');
        expect(html).toContain('nonexistent.png');
    });

    test('should handle non-image files', async () => {
        const markdown = '![[document.pdf]]';
        const html = await parser.parse(markdown);
        
        expect(html).toContain('不支持的文件类型');
        expect(html).toContain('document.pdf');
    });

    test('should prepare and cleanup correctly', async () => {
        await imageExt.prepare();
        // Add some test data
        (imageExt as any).images.set('test', { resUrl: 'test', filePath: 'test', uploadedUrl: null });
        
        expect((imageExt as any).images.size).toBe(1);
        
        await imageExt.cleanup();
        expect((imageExt as any).images.size).toBe(0);
    });
});

// Test utilities
describe('Utility Functions', () => {
    test('should clean URLs correctly', async () => {
        const { cleanUrl } = await import('../src/utils');
        
        expect(cleanUrl('https://example.com/image.png')).toBe('https://example.com/image.png');
        expect(cleanUrl('relative/path.png')).toBe('relative/path.png');
        expect(cleanUrl('javascript:alert("xss")')).toBeNull();
        expect(cleanUrl('data:text/html,<script>alert("xss")</script>')).toBeNull();
    });
});