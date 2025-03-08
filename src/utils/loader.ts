import * as fs from 'fs';
import * as path from 'path';

/** Async function to load translations from a URL or a local file. */
export async function loadTranslations(resource: string, workspaceRoot: string): Promise<any> {
	if (resource.startsWith('http://') || resource.startsWith('https://')) {
		const response = await fetch(resource);
		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}
		return response.json();
	} else {
		const filePath = path.isAbsolute(resource) ? resource : path.join(workspaceRoot, resource);
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf8');
			return JSON.parse(content);
		} else {
			throw new Error(`Translation file not found: ${filePath}`);
		}
	}
}