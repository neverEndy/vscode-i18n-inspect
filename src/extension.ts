import * as vscode from 'vscode';
import store from './store';
import { loadTranslations } from './utils/loader';
import { fileWatcher } from './utils/watchers';
import { isUrl } from './utils/validation';
import hoverProvider from './providers/hoverProvider';
import completionProvider from './providers/completionProvider';
import inlayHintsProvider, { refreshInlayHints } from './providers/inlayHintsProvider';
import { registerLanguageStatusProvider } from './providers/languageStatusProvider';

async function pullTranslations() {
	try {
		if (!store.isConfigured) {
			void vscode.window.showInformationMessage(
				'i18nInspect: Please configure translation resource. Click to configure',
				'Open Settings'
			).then(selection => {
				if (selection === 'Open Settings') {
					void vscode.commands.executeCommand('workbench.action.openSettings', 'i18nInspect');
				}
			});
			return;
		}

		store.translations = await loadTranslations(store.resourcePath);
		void vscode.window.showInformationMessage('i18nInspect: Translation resource updated');
	} catch (error: any) {
		void vscode.window.showErrorMessage(`i18nInspect: Update failed - ${error.message}`, 'Open Settings').then(selection => {
			if (selection === 'Open Settings') {
				void vscode.commands.executeCommand('workbench.action.openSettings', 'i18nInspect');
			}
		});
		throw error;
	}
}

export async function activate(context: vscode.ExtensionContext) {
	// Register language status provider
	const { updateLanguageStatusBar } = registerLanguageStatusProvider(context);

	// Register all providers
	context.subscriptions.push(
		hoverProvider,
		completionProvider,
		inlayHintsProvider
	);

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async e => {
			if (e.affectsConfiguration('i18nInspect')) {
				store.updateConfig();
				// If resource configuration is affected, automatically refresh translations
				if (e.affectsConfiguration('i18nInspect.translationResource') ||
					e.affectsConfiguration('i18nInspect.distributionHash') ||
					e.affectsConfiguration('i18nInspect.languageCode')) {
					await pullTranslations();
					await updateLanguageStatusBar();
					await refreshInlayHints();
				}
			}
		})
	);

	// Register refresh command
	context.subscriptions.push(
		vscode.commands.registerCommand('i18nInspect.refresh', async () => {
			await pullTranslations();
			await refreshInlayHints();
		})
	);

	// Set up file watcher
	let fileWatcherDisposable = fileWatcher(store.resourcePath, async () => {
		await pullTranslations();
		await refreshInlayHints();
	});
	context.subscriptions.push(fileWatcherDisposable);

	// Listen for resource path changes and update file watcher
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('i18nInspect.translationResource')) {
				fileWatcherDisposable.dispose();
				if (!isUrl(store.resourcePath)) {
					fileWatcherDisposable = fileWatcher(store.resourcePath, async () => {
						await pullTranslations();
						await refreshInlayHints();
					});
					context.subscriptions.push(fileWatcherDisposable);
				}
			}
		})
	);

	// Initial translation load
	await pullTranslations();
	await updateLanguageStatusBar();
	await refreshInlayHints();

	// Show welcome message if not configured
	if (!store.isConfigured) {
		void vscode.window.showInformationMessage(
			'Welcome to i18nInspect! Please configure translation resource.',
			'Open Settings'
		).then(selection => {
			if (selection === 'Open Settings') {
				void vscode.commands.executeCommand('workbench.action.openSettings', 'i18nInspect');
			}
		});
	}
}

export function deactivate() {}
