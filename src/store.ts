import * as vscode from 'vscode';
import * as path from 'path';
import { isUrl } from './utils/validation';

type StoreType = {
	translations: any;
	context: vscode.ExtensionContext
	readonly resourcePath: string;
}

const store = {
	translations: {},
	get resourcePath () {
		const config = vscode.workspace.getConfiguration('i18nInspect');
		const resourcePath = config.get<string>('translationResource', './translations/zh.json');
		if (isUrl(resourcePath)) {
			return resourcePath;
		}
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage("No workspace folder found.");
			return;
		}
		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const translationFilePath = path.isAbsolute(resourcePath) 
    ? resourcePath 
    : path.join(workspaceRoot, resourcePath);
		return translationFilePath;
	}
} as StoreType;

export default store;
