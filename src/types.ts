// WeChat API Types
export interface WeChatSettings {
	appid: string;
	secret: string;
	accessToken: string;
	lastTokenTime: number;
	autoUploadImages: boolean;
	defaultAuthor: string;
	autoPublishToPlatform: boolean;  // 是否自动发布到微信公众号平台
}

export interface WeChatTokenResponse {
	access_token?: string;
	expires_in?: number;
	errcode?: number;
	errmsg?: string;
}

export interface WeChatUploadResponse {
	media_id?: string;
	url?: string;
	errcode?: number;
	errmsg?: string;
}

export interface WeChatDraftResponse {
	media_id?: string;
	errcode?: number;
	errmsg?: string;
}

export interface ArticleData {
	title: string;
	author?: string;
	digest?: string;
	content: string;
	content_source_url?: string;
	thumb_media_id: string;
	show_cover_pic?: number;
	need_open_comment?: number;
	only_fans_can_comment?: number;
}

export interface ArticleMetadata {
	title?: string;
	author?: string;
	digest?: string;
	banner?: string;
	banner_path?: string;
	cover?: string;        // 封面图片别名
	cover_url?: string;    // 封面图片URL
	thumb_media_id?: string;
	source_url?: string;
	content_source_url?: string;  // 原文链接别名
	open_comment?: number;
	need_open_comment?: number;   // 是否开启评论别名
	show_cover?: number;   // 是否显示封面
	show_cover_pic?: number;  // 是否显示封面图片
	tags?: string[];       // 文章标签
	category?: string;     // 文章分类
	publish_time?: string; // 发布时间
	is_original?: boolean; // 是否原创
	can_reprint?: boolean; // 是否允许转载
}