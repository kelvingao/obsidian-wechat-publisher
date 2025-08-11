/**
 * Obsidian API Mock
 * 用于测试环境模拟Obsidian的API
 */

export class App {
    vault = new Vault();
    workspace = new Workspace();
    metadataCache = new MetadataCache();
}

export class Vault {
    getFiles = jest.fn(() => []);
    readBinary = jest.fn();
    adapter = {
        getResourcePath: jest.fn((path: string) => `file://${path}`)
    };
}

export class Workspace {
    getActiveFile = jest.fn();
    getActiveViewOfType = jest.fn();
}

export class MetadataCache {
    getFileCache = jest.fn(() => ({ frontmatter: null }));
}

export class TFile {
    constructor(
        public name: string,
        public path: string,
        public basename: string = name.split('.')[0],
        public extension: string = name.split('.').pop() || ''
    ) {}
}

export class Notice {
    constructor(public message: string) {
        console.log(`Notice: ${message}`);
    }
}

export const requestUrl = jest.fn().mockResolvedValue({
    status: 200,
    json: {},
    text: '',
    arrayBuffer: new ArrayBuffer(0),
    headers: {}
});

// Mock常用的Obsidian组件
export class Modal {
    constructor(public app: App) {}
    open = jest.fn();
    close = jest.fn();
}

export class Setting {
    constructor(containerEl: HTMLElement) {}
    setName = jest.fn().mockReturnThis();
    setDesc = jest.fn().mockReturnThis();
    addButton = jest.fn().mockReturnThis();
    addText = jest.fn().mockReturnThis();
    addDropdown = jest.fn().mockReturnThis();
    addToggle = jest.fn().mockReturnThis();
}

export class PluginSettingTab {
    constructor(public app: App, public plugin: any) {}
    display = jest.fn();
}

export class Plugin {
    constructor(public app: App, public manifest: any) {}
    loadSettings = jest.fn();
    saveSettings = jest.fn();
    addRibbonIcon = jest.fn();
    addCommand = jest.fn();
    addSettingTab = jest.fn();
}