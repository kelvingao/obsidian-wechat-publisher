import { WeChatSettings } from './types';

export const DEFAULT_SETTINGS: WeChatSettings = {
	appid: '',
	secret: '',
	accessToken: '',
	lastTokenTime: 0,
	autoUploadImages: true,
	defaultAuthor: '',
	autoPublishToPlatform: false  // 默认只创建草稿，不自动发布
};