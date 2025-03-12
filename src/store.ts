import * as vscode from 'vscode';
import * as path from 'path';
import { isUrl } from './utils/validation';

interface CrowdinConfig {
	distributionHash: string;
	languageCode: string;
}

interface ManifestData {
	files: string[];
	languages: string[];
	language_mapping: any[];
	custom_languages: any[];
	timestamp: number;
	content: {
		[key: string]: string[];
	};
	mapping: string[];
}

class Store {
	private _resourcePath: string = '';
	private _translations: any = {};
	private _manifest: ManifestData | null = null;
	private _crowdinConfig: CrowdinConfig = {
		distributionHash: '',
		languageCode: 'zh-TW'
	};

	constructor() {
		this.updateConfig();
	}

	public updateConfig() {
		const config = vscode.workspace.getConfiguration('i18nInspect');
		const distributionHash = config.get('distributionHash', '');
		
		// 如果有 distributionHash，使用 Crowdin CDN URL
		if (distributionHash) {
			this._resourcePath = 'https://distributions.crowdin.net/[DIST_HASH]/manifest.json';
		} else {
			// 否则使用用户配置的 translationResource
			this._resourcePath = config.get('translationResource', '');
		}

		this._crowdinConfig = {
			distributionHash,
			languageCode: config.get('languageCode', this._crowdinConfig.languageCode)
		};
	}

	get isConfigured(): boolean {
		// 如果有 distributionHash，不需要检查 resourcePath
		if (this._crowdinConfig.distributionHash) {
			return true;
		}
		// 否则必须提供有效的 resourcePath
		return Boolean(this._resourcePath);
	}

	get resourcePath() {
		if (this._crowdinConfig.distributionHash) {
			return this._resourcePath.replace('[DIST_HASH]', this._crowdinConfig.distributionHash);
		}
		return this._resourcePath;
	}

	get translationPath() {
		if (!this._manifest || !this._crowdinConfig.distributionHash) {
			return '';
		}

		// 从 manifest 的 content 字段获取语言对应的文件路径
		const langContent = this._manifest.content[this._crowdinConfig.languageCode];
		if (!langContent || langContent.length === 0) {
			return '';
		}

		// 使用第一个文件路径，并确保它以 / 开头
		const contentPath = langContent[0].startsWith('/') ? langContent[0] : `/${langContent[0]}`;
		return `https://distributions.crowdin.net/${this._crowdinConfig.distributionHash}${contentPath}`;
	}

	get translations() {
		return this._translations;
	}

	set translations(value: any) {
		this._translations = value;
	}

	get manifest() {
		return this._manifest;
	}

	set manifest(value: ManifestData | null) {
		this._manifest = value;
	}

	get crowdinConfig() {
		return this._crowdinConfig;
	}

	get availableLanguages() {
		return this._manifest?.languages || [];
	}
}

export default new Store();
