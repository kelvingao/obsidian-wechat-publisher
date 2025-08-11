/**
 * 主题管理器
 * 主题管理器 - 负责主题加载、管理和应用的单例模式实现
 */
import { App, Notice, requestUrl, normalizePath } from 'obsidian';
import { WeChatTheme, HighlightTheme, ThemeAssets } from './types';
import { DefaultTheme } from './themes/default-theme';
import { DefaultHighlights } from './themes/default-highlight';

export class ThemeManager {
    private static instance: ThemeManager;
    private app: App;
    private themes: WeChatTheme[] = [];
    private highlights: HighlightTheme[] = [];
    private customCSS: string = '';
    
    // 资源路径
    private assetsPath: string;
    private themesPath: string;
    private highlightsPath: string;
    private themeConfigPath: string;
    private highlightConfigPath: string;
    private customCSSPath: string;
    
    private constructor() {}
    
    /**
     * 获取单例实例
     */
    public static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }
    
    /**
     * 初始化主题管理器
     */
    public static async setup(app: App): Promise<ThemeManager> {
        const manager = ThemeManager.getInstance();
        await manager.initialize(app);
        return manager;
    }
    
    /**
     * 初始化方法
     */
    private async initialize(app: App) {
        this.app = app;
        
        // 设置资源路径
        const pluginDir = normalizePath(this.app.vault.configDir + '/plugins/obsidian-wechat-publisher');
        this.assetsPath = normalizePath(pluginDir + '/assets');
        this.themesPath = normalizePath(this.assetsPath + '/themes');
        this.highlightsPath = normalizePath(this.assetsPath + '/highlights');
        this.themeConfigPath = normalizePath(this.assetsPath + '/themes.json');
        this.highlightConfigPath = normalizePath(this.assetsPath + '/highlights.json');
        this.customCSSPath = normalizePath(this.assetsPath + '/custom.css');
        
        // 确保目录存在
        await this.ensureDirectories();
        
        // 加载所有资源
        await this.loadAssets();
    }
    
    /**
     * 确保必要的目录存在
     */
    private async ensureDirectories() {
        const adapter = this.app.vault.adapter;
        
        if (!await adapter.exists(this.assetsPath)) {
            await adapter.mkdir(this.assetsPath);
        }
        
        if (!await adapter.exists(this.themesPath)) {
            await adapter.mkdir(this.themesPath);
        }
        
        if (!await adapter.exists(this.highlightsPath)) {
            await adapter.mkdir(this.highlightsPath);
        }
    }
    
    /**
     * 加载所有主题资源
     */
    public async loadAssets() {
        await this.loadThemes();
        await this.loadHighlights();
        await this.loadCustomCSS();
    }
    
    /**
     * 加载主题
     */
    private async loadThemes() {
        try {
            // 始终包含默认主题
            this.themes = [DefaultTheme];
            
            // 加载外部主题配置
            if (await this.app.vault.adapter.exists(this.themeConfigPath)) {
                const configData = await this.app.vault.adapter.read(this.themeConfigPath);
                const externalThemes: WeChatTheme[] = JSON.parse(configData);
                
                // 加载每个主题的CSS文件
                for (const theme of externalThemes) {
                    const cssPath = normalizePath(this.themesPath + '/' + theme.className + '.css');
                    if (await this.app.vault.adapter.exists(cssPath)) {
                        const cssContent = await this.app.vault.adapter.read(cssPath);
                        theme.css = cssContent;
                        this.themes.push(theme);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load themes:', error);
            new Notice('主题加载失败，将使用默认主题');
            this.themes = [DefaultTheme];
        }
    }
    
    /**
     * 加载高亮主题
     */
    private async loadHighlights() {
        try {
            // 始终包含默认高亮主题
            this.highlights = [...DefaultHighlights];
            
            // 加载外部高亮主题配置
            if (await this.app.vault.adapter.exists(this.highlightConfigPath)) {
                const configData = await this.app.vault.adapter.read(this.highlightConfigPath);
                const externalHighlights: HighlightTheme[] = JSON.parse(configData);
                
                // 加载每个高亮主题的CSS文件
                for (const highlight of externalHighlights) {
                    const cssPath = normalizePath(this.highlightsPath + '/' + highlight.name + '.css');
                    if (await this.app.vault.adapter.exists(cssPath)) {
                        const cssContent = await this.app.vault.adapter.read(cssPath);
                        highlight.css = cssContent;
                        this.highlights.push(highlight);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load highlight themes:', error);
            new Notice('代码高亮主题加载失败，将使用默认主题');
            this.highlights = [...DefaultHighlights];
        }
    }
    
    /**
     * 加载自定义CSS
     */
    private async loadCustomCSS() {
        try {
            if (await this.app.vault.adapter.exists(this.customCSSPath)) {
                this.customCSS = await this.app.vault.adapter.read(this.customCSSPath);
            }
        } catch (error) {
            console.error('Failed to load custom CSS:', error);
            this.customCSS = '';
        }
    }
    
    /**
     * 获取所有主题
     */
    public getThemes(): WeChatTheme[] {
        return this.themes;
    }
    
    /**
     * 获取所有高亮主题
     */
    public getHighlights(): HighlightTheme[] {
        return this.highlights;
    }
    
    /**
     * 根据名称获取主题
     */
    public getTheme(name: string): WeChatTheme | null {
        if (!name) {
            return this.themes[0]; // 返回默认主题
        }
        
        return this.themes.find(theme => 
            theme.name === name || theme.className === name
        ) || this.themes[0];
    }
    
    /**
     * 根据名称获取高亮主题
     */
    public getHighlight(name: string): HighlightTheme | null {
        if (!name) {
            return this.highlights[0]; // 返回默认高亮主题
        }
        
        return this.highlights.find(highlight => 
            highlight.name === name
        ) || this.highlights[0];
    }
    
    /**
     * 获取自定义CSS
     */
    public getCustomCSS(): string {
        return this.customCSS;
    }
    
    /**
     * 设置自定义CSS
     */
    public async setCustomCSS(css: string) {
        this.customCSS = css;
        try {
            await this.app.vault.adapter.write(this.customCSSPath, css);
        } catch (error) {
            console.error('Failed to save custom CSS:', error);
            new Notice('保存自定义CSS失败');
        }
    }
    
    /**
     * 应用主题和高亮，返回完整的CSS
     */
    public applyTheme(themeName?: string, highlightName?: string, customCSS?: string): string {
        const theme = this.getTheme(themeName || '');
        const highlight = this.getHighlight(highlightName || '');
        
        let css = '';
        
        // 添加主题CSS
        if (theme) {
            css += theme.css + '\n\n';
        }
        
        // 添加高亮CSS
        if (highlight) {
            css += highlight.css + '\n\n';
        }
        
        // 添加自定义CSS
        if (customCSS) {
            css += customCSS + '\n\n';
        } else if (this.customCSS) {
            css += this.customCSS + '\n\n';
        }
        
        return css;
    }
    
    /**
     * 下载主题资源包
     */
    public async downloadThemes(): Promise<boolean> {
        try {
            // 检查是否已存在主题配置
            if (await this.app.vault.adapter.exists(this.themeConfigPath)) {
                new Notice('主题资源已存在！要重新下载请先清空主题');
                return false;
            }
            
            new Notice('开始下载主题资源包...');
            
            // 这里可以配置主题资源的下载URL
            // 暂时创建一个示例配置
            const sampleThemes: WeChatTheme[] = [
                {
                    name: '简约蓝色',
                    className: 'simple-blue',
                    description: '简约蓝色主题，适合技术文章',
                    author: 'WeChat Publisher',
                    css: this.generateSampleThemeCSS('blue'),
                    version: '1.0.0'
                },
                {
                    name: '温暖橙色',
                    className: 'warm-orange', 
                    description: '温暖橙色主题，适合生活分享',
                    author: 'WeChat Publisher',
                    css: this.generateSampleThemeCSS('orange'),
                    version: '1.0.0'
                }
            ];
            
            // 保存主题配置
            await this.app.vault.adapter.write(
                this.themeConfigPath, 
                JSON.stringify(sampleThemes, null, 2)
            );
            
            // 保存每个主题的CSS文件
            for (const theme of sampleThemes) {
                const cssPath = normalizePath(this.themesPath + '/' + theme.className + '.css');
                await this.app.vault.adapter.write(cssPath, theme.css);
            }
            
            // 重新加载资源
            await this.loadAssets();
            
            new Notice('主题下载完成！');
            return true;
            
        } catch (error) {
            console.error('Failed to download themes:', error);
            new Notice('主题下载失败，请检查网络连接');
            return false;
        }
    }
    
    /**
     * 清空主题资源
     */
    public async clearThemes() {
        try {
            const adapter = this.app.vault.adapter;
            
            // 删除配置文件
            if (await adapter.exists(this.themeConfigPath)) {
                await adapter.remove(this.themeConfigPath);
            }
            
            if (await adapter.exists(this.highlightConfigPath)) {
                await adapter.remove(this.highlightConfigPath);
            }
            
            // 清空主题目录
            if (await adapter.exists(this.themesPath)) {
                const files = await adapter.list(this.themesPath);
                for (const file of files.files) {
                    await adapter.remove(file);
                }
            }
            
            // 清空高亮目录
            if (await adapter.exists(this.highlightsPath)) {
                const files = await adapter.list(this.highlightsPath);
                for (const file of files.files) {
                    await adapter.remove(file);
                }
            }
            
            // 重新加载资源（只包含默认主题）
            await this.loadAssets();
            
            new Notice('主题清空完成！');
        } catch (error) {
            console.error('Failed to clear themes:', error);
            new Notice('清空主题失败');
        }
    }
    
    /**
     * 生成示例主题CSS
     */
    private generateSampleThemeCSS(color: 'blue' | 'orange'): string {
        const colors = {
            blue: {
                primary: '#007acc',
                secondary: '#0366d6', 
                bg: '#f6f8fa',
                text: '#24292e'
            },
            orange: {
                primary: '#ff6b35',
                secondary: '#ff8c42',
                bg: '#fff8f5', 
                text: '#2d2d2d'
            }
        };
        
        const theme = colors[color];
        
        return `
/* ${color} theme */
.wechat-content {
    color: ${theme.text};
    background-color: ${theme.bg};
}

.wechat-content h1,
.wechat-content h2 {
    border-left: 4px solid ${theme.primary};
    color: ${theme.primary};
}

.wechat-content h3,
.wechat-content h4 {
    border-left: 3px solid ${theme.secondary};
    color: ${theme.secondary};
}

.wechat-content a {
    color: ${theme.primary};
    border-bottom-color: ${theme.primary};
}

.wechat-content blockquote {
    border-left-color: ${theme.secondary};
    background-color: ${theme.bg};
}

.wechat-content code {
    background-color: ${theme.bg};
    color: ${theme.primary};
}
`;
    }
    
    /**
     * 打开资源目录
     */
    public async openAssetsFolder() {
        try {
            // 检查是否在桌面环境中运行
            if (typeof require !== 'undefined') {
                const { shell } = require('electron');
                const path = require('path');
                
                // 尝试获取vault的基础路径
                const adapter = this.app.vault.adapter as any;
                const vaultPath = adapter.basePath || adapter.path?.basePath;
                
                if (vaultPath) {
                    const fullPath = path.join(vaultPath, this.assetsPath);
                    await shell.openPath(fullPath);
                    new Notice('已打开资源文件夹');
                } else {
                    // 如果无法获取路径，至少显示相对路径信息
                    new Notice(`资源文件夹位置: ${this.assetsPath}`);
                }
            } else {
                new Notice('当前环境不支持打开文件夹，请在桌面版本中使用此功能');
            }
        } catch (error) {
            console.error('Failed to open assets folder:', error);
            new Notice(`资源文件夹位置: ${this.assetsPath}`);
        }
    }
}

export default ThemeManager;