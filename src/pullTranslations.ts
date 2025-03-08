import * as vscode from 'vscode';
import store from './store';
import { loadTranslations } from './utils/loader';

export default async function pullTranslations() {
	try {
		store.translations = await loadTranslations(store.resourcePath);
	} catch (error: any) {
		vscode.window.showErrorMessage(`◢▆▅▄▃崩╰(〒皿〒)╯潰▃▄▅▇◣ 更新失敗: ${error.message}`);
		throw error;
	}
}