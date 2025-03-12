import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { isUrl } from './validation';
import store from '../store';

async function fetchJson(url: string): Promise<any> {
	const response = await fetch(url, {
		headers: {
			'Accept': 'application/json',
			'Cache-Control': 'no-cache'
		}
	});
	
	if (!response.ok) {
		throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
	}
	
	const contentType = response.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		throw new Error('Invalid content type. Expected JSON.');
	}
	
	return response.json();
}

/** Load translations from Crowdin OTA CDN manifest or a local file. */
export async function loadTranslations(resource: string): Promise<any> {
	try {
		// 检查配置是否有效
		if (!store.isConfigured) {
			if (store.crowdinConfig.distributionHash) {
				throw new Error('Crowdin distribution hash is not configured. Please set i18nInspect.distributionHash in settings.');
			} else if (!resource) {
				throw new Error('Translation resource path is not configured. Please set i18nInspect.translationResource in settings.');
			}
		}

		if (store.crowdinConfig.distributionHash) {
			// 使用 Crowdin CDN
			const manifest = await fetchJson(resource);
			
			// 验证 manifest 格式
			if (!manifest.content || !manifest.languages) {
				throw new Error('Invalid manifest format: missing required fields (content or languages).');
			}

			store.manifest = manifest;

			// 验证语言代码是否在可用语言列表中
			if (!manifest.languages.includes(store.crowdinConfig.languageCode)) {
				throw new Error(`Language code '${store.crowdinConfig.languageCode}' is not available. Available languages: ${manifest.languages.join(', ')}`);
			}

			// 验证语言内容是否存在
			const langContent = manifest.content[store.crowdinConfig.languageCode];
			if (!langContent || langContent.length === 0) {
				throw new Error(`No content available for language '${store.crowdinConfig.languageCode}'`);
			}

			// 如果没有可用的翻译路径，抛出错误
			if (!store.translationPath) {
				throw new Error('No valid translation path available. Please check your configuration.');
			}

			// 加载实际的翻译文件
			return await fetchJson(store.translationPath);
		} else {
			// 处理本地文件路径
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				throw new Error('No workspace folder found. Please open a workspace first.');
			}
			
			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const translationFilePath = path.isAbsolute(resource) 
				? resource 
				: path.join(workspaceRoot, resource);
			
			if (!fs.existsSync(translationFilePath)) {
				throw new Error(`Translation file not found: ${translationFilePath}`);
			}
			
			const content = fs.readFileSync(translationFilePath, 'utf8');
			try {
				const data = JSON.parse(content);
				// 如果是本地 manifest 文件，也需要处理
				if (data.files && Array.isArray(data.files) && data.languages) {
					store.manifest = data;
					// 尝试加载对应的翻译文件
					const langFile = path.join(path.dirname(translationFilePath), `${store.crowdinConfig.languageCode}.json`);
					if (fs.existsSync(langFile)) {
						return JSON.parse(fs.readFileSync(langFile, 'utf8'));
					}
					throw new Error(`Language file not found: ${langFile}`);
				}
				return data;
			} catch (e: unknown) {
				throw new Error(`Invalid JSON in translation file: ${e instanceof Error ? e.message : 'Unknown error'}`);
			}
		}
	} catch (error: any) {
		// 重新抛出错误，添加更多上下文信息
		throw new Error(`Failed to load translations: ${error.message}`);
	}
}