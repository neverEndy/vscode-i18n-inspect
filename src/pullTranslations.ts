import * as vscode from 'vscode';
import store from './store';
import { loadTranslations } from './utils/loader';
import { flattenKeys } from './utils/object-mapping';

export default async function pullTranslations() {
	const config = vscode.workspace.getConfiguration('i18nInspect');
	const translationResource = config.get<string>('translationResource', './translations/zh.json');

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage("No workspace folder found.");
		return;
	}
	const workspaceRoot = workspaceFolders[0].uri.fsPath;
	try {
		vscode.window.showInformationMessage("i18n-inspect pulling data...");
		store.translations = await loadTranslations(translationResource, workspaceRoot);
	} catch (error: any) {
		vscode.window.showErrorMessage(`◢▆▅▄▃崩╰(〒皿〒)╯潰▃▄▅▇◣ 找不到檔案: ${error.message}`);
	}
}