import { WeChatSettings } from './types';

export const DEFAULT_SETTINGS: WeChatSettings = {
	appid: '',
	secret: '',
	accessToken: '',
	lastTokenTime: 0,
	autoUploadImages: true,
	defaultAuthor: '',
	autoPublishToPlatform: false,  // 默认只创建草稿，不自动发布
	
	// Markdown 转换设置
	linkStyle: 'footnote',         // 默认使用脚注式链接
	highlightTheme: 'GitHub',      // 默认代码高亮主题
	useFigcaption: false,         // 默认不使用图片说明
	mathEnabled: false,           // 默认不启用数学公式
	
	// 主题设置
	defaultTheme: '默认主题',      // 默认主题名称
	showThemeSelector: true,      // 默认显示主题选择器
	customCSS: ''                 // 自定义CSS
};