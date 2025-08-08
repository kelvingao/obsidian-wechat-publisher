import { App, Modal, Setting, Notice, ButtonComponent, DropdownComponent } from 'obsidian';
import type { WeChatPublisherSettings, WeChatAccount } from '../main';

export class PreviewModal extends Modal {
    private settings: WeChatPublisherSettings;
    private originalContent: string;
    private convertedContent: string;
    private selectedTheme: string;
    private selectedAccount: string;
    private previewContainer: HTMLElement;
    private accountDropdown: DropdownComponent;

    constructor(app: App, settings: WeChatPublisherSettings, content: string) {
        super(app);
        this.settings = settings;
        this.originalContent = content;
        this.selectedTheme = settings.defaultTheme;
        this.selectedAccount = settings.defaultAccount;
        this.convertedContent = this.convertMarkdownToWeChat(content);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('wechat-publisher-modal');

        // 模态框标题
        contentEl.createEl('h2', { text: '预览和发布到微信公众号' });

        // 设置区域
        this.createSettingsSection(contentEl);

        // 预览区域
        this.createPreviewSection(contentEl);

        // 操作按钮区域
        this.createActionButtons(contentEl);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private createSettingsSection(containerEl: HTMLElement) {
        const settingsContainer = containerEl.createDiv('settings-section');
        
        // 主题选择
        if (this.settings.showStyleSelector) {
            new Setting(settingsContainer)
                .setName('选择主题')
                .setDesc('选择微信公众号文章样式')
                .addDropdown(dropdown => {
                    dropdown.addOption('default', '默认主题');
                    dropdown.addOption('simple', '简洁主题');
                    dropdown.addOption('elegant', '优雅主题');
                    dropdown.addOption('tech', '科技主题');
                    dropdown.addOption('minimal', '极简主题');
                    dropdown.setValue(this.selectedTheme);
                    dropdown.onChange((value) => {
                        this.selectedTheme = value;
                        this.updatePreview();
                    });
                });
        }

        // 账号选择
        if (this.settings.accounts.length > 0) {
            new Setting(settingsContainer)
                .setName('选择账号')
                .setDesc('选择要发布的微信公众号账号')
                .addDropdown(dropdown => {
                    this.accountDropdown = dropdown;
                    this.settings.accounts.forEach(account => {
                        dropdown.addOption(account.name, account.name);
                    });
                    if (this.selectedAccount) {
                        dropdown.setValue(this.selectedAccount);
                    }
                    dropdown.onChange((value) => {
                        this.selectedAccount = value;
                    });
                });
        }
    }

    private createPreviewSection(containerEl: HTMLElement) {
        const previewSection = containerEl.createDiv('preview-section');
        previewSection.createEl('h3', { text: '预览效果' });

        // 预览容器
        this.previewContainer = previewSection.createDiv('preview-container');
        this.updatePreview();

        // 统计信息
        const statsDiv = previewSection.createDiv('stats-section');
        this.updateStats(statsDiv);
    }

    private createActionButtons(containerEl: HTMLElement) {
        const buttonsContainer = containerEl.createDiv('button-container');

        // 复制HTML按钮
        new ButtonComponent(buttonsContainer)
            .setButtonText('复制 HTML')
            .setTooltip('复制转换后的 HTML 代码到剪贴板')
            .onClick(async () => {
                await navigator.clipboard.writeText(this.convertedContent);
                new Notice('HTML 已复制到剪贴板');
            });

        // 复制富文本按钮
        new ButtonComponent(buttonsContainer)
            .setButtonText('复制富文本')
            .setTooltip('复制格式化的内容，可直接粘贴到微信编辑器')
            .onClick(async () => {
                await this.copyAsRichText();
                new Notice('富文本已复制到剪贴板');
            });

        // 上传到微信公众号按钮
        if (this.settings.accounts.length > 0 && this.selectedAccount) {
            new ButtonComponent(buttonsContainer)
                .setButtonText('上传到公众号')
                .setTooltip('直接上传文章草稿到微信公众号')
                .setCta() // 设置为主要按钮样式
                .onClick(async () => {
                    await this.uploadToWeChat();
                });
        } else {
            const noAccountButton = new ButtonComponent(buttonsContainer)
                .setButtonText('配置账号后上传')
                .setDisabled(true);
            noAccountButton.buttonEl.addClass('disabled-upload-button');
        }

        // 关闭按钮
        new ButtonComponent(buttonsContainer)
            .setButtonText('关闭')
            .onClick(() => {
                this.close();
            });
    }

    private updatePreview() {
        if (!this.previewContainer) return;
        
        this.convertedContent = this.convertMarkdownToWeChat(this.originalContent);
        this.previewContainer.empty();
        
        // 设置预览样式
        this.previewContainer.addClass(`theme-${this.selectedTheme}`);
        this.previewContainer.innerHTML = this.convertedContent;
    }

    private updateStats(statsContainer: HTMLElement) {
        statsContainer.empty();
        
        const wordCount = this.countWords(this.originalContent);
        const charCount = this.originalContent.length;
        const readingTime = Math.ceil(wordCount / 200); // 假设每分钟阅读200字

        const statsDiv = statsContainer.createDiv('content-stats');
        statsDiv.createSpan({ text: `字数: ${wordCount}` });
        statsDiv.createSpan({ text: ` | 字符数: ${charCount}` });
        statsDiv.createSpan({ text: ` | 预计阅读时间: ${readingTime}分钟` });
    }

    private countWords(text: string): number {
        // 简单的中英文字数统计
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        return chineseChars + englishWords;
    }

    private convertMarkdownToWeChat(markdown: string): string {
        // 基础的Markdown到微信公众号HTML转换
        // 这里实现基本的转换逻辑，后续会在converter.ts中完善
        
        let html = markdown
            // 标题转换
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            // 段落处理
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // 代码块处理
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre class="code-block ${lang}"><code>${code.trim()}</code></pre>`;
        });

        // 包装在段落中
        if (!html.startsWith('<h1>') && !html.startsWith('<h2>') && !html.startsWith('<h3>')) {
            html = `<p>${html}</p>`;
        }

        // 应用主题样式
        return this.applyThemeStyles(html);
    }

    private applyThemeStyles(html: string): string {
        // 根据选择的主题应用相应的CSS样式
        const themeStyles = this.getThemeStyles(this.selectedTheme);
        return `<div class="wechat-content theme-${this.selectedTheme}">${html}</div>`;
    }

    private getThemeStyles(theme: string): string {
        // 返回对应主题的CSS样式
        // 这里会在theme-manager.ts中实现完整的主题系统
        const themes: Record<string, string> = {
            'default': 'color: #333; line-height: 1.6;',
            'simple': 'color: #444; line-height: 1.8; font-size: 16px;',
            'elegant': 'color: #2c3e50; line-height: 1.7; font-family: serif;',
            'tech': 'color: #34495e; line-height: 1.6; font-family: "Monaco", monospace;',
            'minimal': 'color: #555; line-height: 1.9; font-weight: 300;'
        };
        return themes[theme] || themes['default'];
    }

    private async copyAsRichText() {
        try {
            // 创建一个临时的div元素
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.convertedContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);

            // 选择内容
            const range = document.createRange();
            range.selectNodeContents(tempDiv);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            // 复制到剪贴板
            document.execCommand('copy');
            
            // 清理
            document.body.removeChild(tempDiv);
            selection?.removeAllRanges();
        } catch (error) {
            console.error('复制富文本失败:', error);
            new Notice('复制失败，请重试');
        }
    }

    private async uploadToWeChat() {
        if (!this.selectedAccount) {
            new Notice('请先选择要发布的账号');
            return;
        }

        const account = this.settings.accounts.find(acc => acc.name === this.selectedAccount);
        if (!account) {
            new Notice('选择的账号不存在');
            return;
        }

        try {
            new Notice('正在上传到微信公众号...');
            
            // 这里会调用微信API进行上传
            // 具体实现在wechat-api.ts中
            await this.performWeChatUpload(account, this.convertedContent);
            
            new Notice('成功上传到微信公众号草稿箱！');
            this.close();
        } catch (error) {
            console.error('上传失败:', error);
            new Notice('上传失败: ' + (error as Error).message);
        }
    }

    private async performWeChatUpload(account: WeChatAccount, content: string) {
        // 占位符方法，实际的微信API调用会在wechat-api.ts中实现
        // 模拟异步操作
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 这里会实现实际的微信公众号API调用
        throw new Error('微信API集成功能将在后续任务中实现');
    }
}