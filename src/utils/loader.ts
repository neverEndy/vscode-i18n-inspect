import * as fs from 'fs';
import { isUrl } from './validation';

/** Async function to load translations from a URL or a local file. */
export async function loadTranslations(resource: string): Promise<any> {
	if (isUrl(resource)) {
		const response = await fetch(resource);
		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}
		return response.json();
	} else {
		if (fs.existsSync(resource)) {
			const content = fs.readFileSync(resource, 'utf8');
			return JSON.parse(content);
		} else {
			throw new Error(`Translation file not found: ${resource}`);
		}
	}
}