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
		// Check if configuration is valid
		if (!store.isConfigured) {
			if (store.crowdinConfig.distributionHash) {
				throw new Error('Crowdin distribution hash is not configured. Please set i18nInspect.distributionHash in settings.');
			} else if (!resource) {
				throw new Error('Translation resource path is not configured. Please set i18nInspect.translationResource in settings.');
			}
		}

		if (store.crowdinConfig.distributionHash) {
			// Use Crowdin CDN
			const manifest = await fetchJson(resource);
			
			// Validate manifest format
			if (!manifest.content || !manifest.languages) {
				throw new Error('Invalid manifest format: missing required fields (content or languages).');
			}

			store.manifest = manifest;

			// Verify if language code exists in available languages
			if (!manifest.languages.includes(store.crowdinConfig.languageCode)) {
				throw new Error(`Language code '${store.crowdinConfig.languageCode}' is not available. Available languages: ${manifest.languages.join(', ')}`);
			}

			// Verify if language content exists
			const langContent = manifest.content[store.crowdinConfig.languageCode];
			if (!langContent || langContent.length === 0) {
				throw new Error(`No content available for language '${store.crowdinConfig.languageCode}'`);
			}

			// Throw error if no valid translation path available
			if (!store.translationPath) {
				throw new Error('No valid translation path available. Please check your configuration.');
			}

			// Load actual translation file
			return await fetchJson(store.translationPath);
		} else {
			// Handle local file path
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
				// If it's a local manifest file, process it
				if (data.files && Array.isArray(data.files) && data.languages) {
					store.manifest = data;
					// Try to load corresponding translation file
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
		// Re-throw error with more context
		throw new Error(`Failed to load translations: ${error.message}`);
	}
}