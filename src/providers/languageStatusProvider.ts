import * as vscode from 'vscode';
import store from '../store';

let statusBarItem: vscode.StatusBarItem;

async function updateLanguageStatusBar() {
	if (!statusBarItem) {
		return;
	}

	const currentLang = store.crowdinConfig.languageCode;
	const availableLangs = store.availableLanguages;
	
	if (availableLangs.length > 0) {
		statusBarItem.text = `$(globe) ${currentLang}`;
		statusBarItem.tooltip = `Current language: ${currentLang}\nClick to switch language`;
		statusBarItem.show();
	} else {
		statusBarItem.hide();
	}
}

async function switchLanguage() {
	const availableLangs = store.availableLanguages;
	if (availableLangs.length === 0) {
		void vscode.window.showInformationMessage('No language options available');
		return;
	}

	const selected = await vscode.window.showQuickPick(availableLangs.filter(lang => lang !== store.crowdinConfig.languageCode), {
		placeHolder: 'Select language',
		title: 'Switch Language'
	});

	if (selected) {
		const config = vscode.workspace.getConfiguration('i18nInspect');
		await config.update('languageCode', selected, true);
		// Configuration update will automatically trigger onDidChangeConfiguration event
		// which handles translation loading and inlay hints refresh
	}
}

export function registerLanguageStatusProvider(context: vscode.ExtensionContext) {
	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100
	);
	statusBarItem.command = 'i18nInspect.switchLanguage';
	context.subscriptions.push(statusBarItem);

	// Register language switch command
	context.subscriptions.push(
		vscode.commands.registerCommand('i18nInspect.switchLanguage', switchLanguage)
	);

	// Initialize status bar
	void updateLanguageStatusBar();

	return {
		statusBarItem,
		updateLanguageStatusBar
	};
} 