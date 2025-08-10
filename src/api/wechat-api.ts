import { Notice, requestUrl, RequestUrlParam, normalizePath, TFile, App } from 'obsidian';
import { 
	WeChatSettings, 
	WeChatTokenResponse, 
	WeChatUploadResponse, 
	ArticleData 
} from '../types';

export class WeChatAPIManager {
	private app: App;
	private settings: WeChatSettings;
	private readonly baseWxUrl = 'https://api.weixin.qq.com/cgi-bin';
	private readonly expireDuration = 7200; // 2 hours in seconds

	constructor(app: App, settings: WeChatSettings) {
		this.app = app;
		this.settings = settings;
	}

	updateSettings(settings: WeChatSettings) {
		this.settings = settings;
	}

	private getHeaders() {
		return {
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
		};
	}

	private getJsonHeaders() {
		return {
			'Content-Type': 'application/json',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
		};
	}

	/**
	 * 刷新Access Token
	 */
	async refreshAccessToken(appid: string, secret: string): Promise<boolean> {
		if (appid === '' || secret === '') {
			new Notice('请输入正确的AppID和Secret');
			return false;
		}

		// Check if token is still valid (with 5 minutes buffer)
		const now = Date.now();
		const tokenAge = now - this.settings.lastTokenTime;
		const tokenExpiryTime = this.settings.lastTokenTime + (this.expireDuration - 300) * 1000;
		
		console.log('Token检查:', {
			now: new Date(now).toLocaleString(),
			lastTokenTime: new Date(this.settings.lastTokenTime).toLocaleString(),
			tokenAge: Math.floor(tokenAge / 1000) + '秒',
			tokenExpiryTime: new Date(tokenExpiryTime).toLocaleString(),
			needRefresh: tokenExpiryTime <= now
		});

		if (tokenExpiryTime > now) {
			console.log('使用缓存的访问令牌');
			return true; // Token still valid
		}

		console.log('开始刷新访问令牌...', { appid: appid.substring(0, 8) + '***' });

		try {
			const url = `${this.baseWxUrl}/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
			const req: RequestUrlParam = {
				url: url,
				method: 'GET',
				headers: this.getHeaders()
			};

			const resp = await requestUrl(req);
			const tokenResp: WeChatTokenResponse = resp.json;

			console.log('Token刷新响应:', tokenResp);

			if (tokenResp.access_token) {
				this.settings.accessToken = tokenResp.access_token;
				this.settings.lastTokenTime = now;
				console.log('访问令牌刷新成功:', {
					tokenLength: tokenResp.access_token.length,
					expiresIn: tokenResp.expires_in || 7200,
					newExpiryTime: new Date(now + (tokenResp.expires_in || 7200) * 1000).toLocaleString()
				});
				new Notice('Access Token 刷新成功');
				return true;
			} else {
				console.error('刷新Token失败:', tokenResp);
				new Notice(`刷新Access Token失败: ${tokenResp.errcode} - ${tokenResp.errmsg}`);
				return false;
			}
		} catch (error) {
			console.error('刷新Token异常:', error);
			new Notice('刷新Access Token异常，请检查网络连接');
			return false;
		}
	}

	/**
	 * 上传图片素材
	 */
	async uploadImage(imagePath: string): Promise<string | undefined> {
		try {
			if (!await this.refreshAccessToken(this.settings.appid, this.settings.secret)) {
				return;
			}

			let blobBytes: ArrayBuffer | null = null;

			// Handle HTTP URLs
			if (imagePath.startsWith("http")) {
				const imgResp = await requestUrl(imagePath);
				blobBytes = imgResp.arrayBuffer;
			} else {
				// Handle local file paths
				let normalizedPath = normalizePath(imagePath);
				if (normalizedPath.startsWith("./")) {
					normalizedPath = normalizedPath.slice(2);
				}

				const imgFile = this.app.vault.getAbstractFileByPath(normalizedPath);
				if (imgFile instanceof TFile) {
					const data = await this.app.vault.readBinary(imgFile);
					blobBytes = data;
				} else {
					new Notice('图片文件不存在: ' + normalizedPath);
					return;
				}
			}

			if (!blobBytes) {
				new Notice('图片数据为空');
				return;
			}

			// Create form data
			const boundary = '----formdata-obsidian-' + Math.random().toString(16);
			const endBoundary = '\r\n--' + boundary + '--\r\n';
			
			let formDataString = '';
			formDataString += '--' + boundary + '\r\n';
			formDataString += 'Content-Disposition: form-data; name="media"; filename="image.png"\r\n';
			formDataString += 'Content-Type: image/png\r\n\r\n';

			const formDataBuffer = Buffer.from(formDataString, 'utf-8');
			const formDataArray = Array.from(formDataBuffer);
			const imageArray = Array.from(new Uint8Array(blobBytes));
			const endBoundaryArray = Array.from(Buffer.from(endBoundary, 'utf-8'));

			const postArray = formDataArray.concat(imageArray, endBoundaryArray);
			const postBuffer = new Uint8Array(postArray).buffer;

			const url = `${this.baseWxUrl}/media/uploadimg?access_token=${this.settings.accessToken}`;
			const headers = {
				'Content-Type': 'multipart/form-data; boundary=' + boundary,
				'Accept-Encoding': 'gzip, deflate, br',
				'Accept': '*/*',
				'Connection': 'keep-alive',
			};

			const req: RequestUrlParam = {
				url: url,
				method: 'POST',
				headers: headers,
				body: postBuffer,
			};

			const resp = await requestUrl(req);
			const uploadResp: WeChatUploadResponse = resp.json;

			if (uploadResp.url) {
				new Notice('图片上传成功');
				return uploadResp.url;
			} else {
				console.error('图片上传失败:', uploadResp.errmsg);
				new Notice(`图片上传失败: ${uploadResp.errcode} - ${uploadResp.errmsg}`);
				return;
			}
		} catch (error) {
			console.error('图片上传异常:', error);
			new Notice('图片上传异常，请重试');
			return;
		}
	}

	/**
	 * 上传封面素材
	 */
	async uploadMaterial(filePath: string, fileName: string): Promise<string | undefined> {
		try {
			if (!await this.refreshAccessToken(this.settings.appid, this.settings.secret)) {
				return;
			}

			let blobBytes: ArrayBuffer | null = null;

			if (filePath.startsWith("http")) {
				const imgResp = await requestUrl(filePath);
				blobBytes = imgResp.arrayBuffer;
			} else {
				let normalizedPath = normalizePath(filePath);
				if (normalizedPath.startsWith("./")) {
					normalizedPath = normalizedPath.slice(2);
				}

				const file = this.app.vault.getAbstractFileByPath(normalizedPath);
				if (file instanceof TFile) {
					const data = await this.app.vault.readBinary(file);
					blobBytes = data;
				} else {
					new Notice('封面文件不存在: ' + normalizedPath);
					return;
				}
			}

			if (!blobBytes) {
				new Notice('封面文件数据为空');
				return;
			}

			// Create form data
			const boundary = '----formdata-obsidian-' + Math.random().toString(16);
			const endBoundary = '\r\n--' + boundary + '--\r\n';
			
			let formDataString = '';
			formDataString += '--' + boundary + '\r\n';
			formDataString += `Content-Disposition: form-data; name="media"; filename="${fileName}.jpg"\r\n`;
			formDataString += 'Content-Type: image/jpeg\r\n\r\n';

			const formDataBuffer = Buffer.from(formDataString, 'utf-8');
			const formDataArray = Array.from(formDataBuffer);
			const imageArray = Array.from(new Uint8Array(blobBytes));
			const endBoundaryArray = Array.from(Buffer.from(endBoundary, 'utf-8'));

			const postArray = formDataArray.concat(imageArray, endBoundaryArray);
			const postBuffer = new Uint8Array(postArray).buffer;

			const url = `${this.baseWxUrl}/material/add_material?access_token=${this.settings.accessToken}&type=image`;
			const headers = {
				'Content-Type': 'multipart/form-data; boundary=' + boundary,
				'Accept-Encoding': 'gzip, deflate, br',
				'Accept': '*/*',
				'Connection': 'keep-alive',
			};

			const req: RequestUrlParam = {
				url: url,
				method: 'POST',
				headers: headers,
				body: postBuffer,
			};

			const resp = await requestUrl(req);
			const uploadResp: WeChatUploadResponse = resp.json;

			if (uploadResp.media_id) {
				new Notice('封面上传成功');
				return uploadResp.media_id;
			} else {
				console.error('封面上传失败:', uploadResp.errmsg);
				new Notice(`封面上传失败: ${uploadResp.errcode} - ${uploadResp.errmsg}`);
				return;
			}
		} catch (error) {
			console.error('封面上传异常:', error);
			new Notice('封面上传异常，请重试');
			return;
		}
	}

	/**
	 * 创建草稿
	 * 重要：微信草稿箱API不接受Content-Type: application/json头，只能使用基础头信息
	 */
	async createDraft(articleData: ArticleData): Promise<string | undefined> {
		try {
			console.log('开始创建草稿，AppID/Secret状态:', {
				appidLength: this.settings.appid?.length || 0,
				secretLength: this.settings.secret?.length || 0,
				hasAccessToken: !!this.settings.accessToken,
				lastTokenTime: new Date(this.settings.lastTokenTime).toLocaleString()
			});

			const pass = await this.refreshAccessToken(this.settings.appid, this.settings.secret);
			if (pass === false) {
				console.error('访问令牌刷新失败，无法继续创建草稿');
				return;
			}

			const url = `${this.baseWxUrl}/draft/add?access_token=${this.settings.accessToken}`;
			console.log('草稿创建请求URL:', url.replace(this.settings.accessToken, '***TOKEN***'));
			
			const articles = {
				articles: [articleData]
			};
			console.log('草稿创建请求体:', {
				articlesCount: articles.articles.length,
				firstArticle: {
					title: articles.articles[0].title,
					author: articles.articles[0].author,
					digest: articles.articles[0].digest,
					contentLength: articles.articles[0].content.length,
					contentSourceUrl: articles.articles[0].content_source_url,
					thumbMediaId: articles.articles[0].thumb_media_id,
					needOpenComment: articles.articles[0].need_open_comment
				}
			});
			
			// 关键修复：使用不包含Content-Type的简单头信息
			const req: RequestUrlParam = {
				url: url,
				method: 'POST',
				headers: {
					'Accept-Encoding': 'gzip, deflate, br',
					'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
				},
				body: JSON.stringify(articles)
			};
			
			console.log('发送草稿创建请求...');
			const resp = await requestUrl(req);
			console.log('草稿创建响应:', resp.json);
			
			const media_id = resp.json["media_id"];
			
			if (media_id === undefined) {
				const errcode = resp.json["errcode"];
				const errmsg = resp.json["errmsg"];
				console.error('草稿创建失败详情:', { errcode, errmsg, fullResponse: resp.json });
				new Notice(`草稿创建失败: ${errcode} - ${errmsg}`);
				return;
			}
			
			console.log('草稿创建成功, media_id:', media_id);
			new Notice(`草稿创建成功！media_id: ${media_id}`);
			return media_id;
		} catch (e) {
			console.error('草稿创建异常:', e);
			new Notice('草稿创建异常，请重试');
		}
	}

	/**
	 * 发布草稿
	 */
	async publishDraft(mediaId: string): Promise<string | undefined> {
		try {
			if (!await this.refreshAccessToken(this.settings.appid, this.settings.secret)) {
				return;
			}

			const url = `${this.baseWxUrl}/freepublish/submit?access_token=${this.settings.accessToken}`;
			const publishData = {
				media_id: mediaId
			};

			const req: RequestUrlParam = {
				url: url,
				method: 'POST',
				headers: this.getJsonHeaders(),
				body: JSON.stringify(publishData)
			};

			const resp = await requestUrl(req);
			console.log('WeChat Publish Response:', resp.json);
			const publishResp = resp.json;

			if (publishResp.errcode === 0) {
				new Notice('文章发布成功');
				return publishResp.publish_id || 'success';
			} else {
				console.error('文章发布失败:', publishResp);
				new Notice(`WeChat API错误: ${publishResp.errcode} - ${publishResp.errmsg}`);
				return;
			}
		} catch (error) {
			console.error('文章发布异常:', error);
			new Notice(`文章发布异常: ${error.message || error}`);
			return;
		}
	}

	/**
	 * 创建草稿并发布
	 */
	async createAndPublishDraft(articleData: ArticleData): Promise<{ draftId?: string; publishId?: string }> {
		try {
			// 先创建草稿
			const draftId = await this.createDraft(articleData);
			
			if (!draftId) {
				return {};
			}

			// 然后发布草稿
			const publishId = await this.publishDraft(draftId);

			return {
				draftId,
				publishId
			};
		} catch (error) {
			console.error('创建并发布异常:', error);
			new Notice('创建并发布异常，请重试');
			return {};
		}
	}

	/**
	 * 测试连接
	 */
	async testConnection(): Promise<boolean> {
		return await this.refreshAccessToken(this.settings.appid, this.settings.secret);
	}
}