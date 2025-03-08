import * as vscode from 'vscode';
import hoverProvider from './providers/hoverProvider';
import refreshCommand from './commands/refreshCommand';
import completionProvider from './providers/completionProvider';
import pullTranslations from './pullTranslations';
import translationInlayHintsProvider from './providers/translationInlayHintsProvider';
import { configurationWatcher, fileWatcher } from './utils/watchers';
import store from './store';
import { isUrl } from './utils/validation';

export async function activate(context: vscode.ExtensionContext) {

  // Initially load translations.
  await pullTranslations();

	vscode.window.showInformationMessage("I18n Inspect ready ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧ please donate Andy");

	const createTranslationFileWatcher = () => fileWatcher(store.resourcePath, () => {
		pullTranslations();
		vscode.window.showInformationMessage("更新檔案了");
	});

	let fileWatcherDisposable = createTranslationFileWatcher();
	[
		fileWatcherDisposable,
		configurationWatcher('i18nInspect.translationResource', () => {
			vscode.window.showInformationMessage(`更新設定 ${store.resourcePath}`);
			pullTranslations();
			if (!isUrl(store.resourcePath)) {
				fileWatcherDisposable.dispose();
				fileWatcherDisposable = createTranslationFileWatcher();
			}
		}),
		translationInlayHintsProvider,
		hoverProvider,
		refreshCommand,
		completionProvider,
	].forEach(disposable => context.subscriptions.push(disposable));
}

export function deactivate() {}
