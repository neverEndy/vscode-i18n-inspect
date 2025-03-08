import * as vscode from 'vscode';
import hoverProvider from './providers/hoverProvider';
import refreshCommand from './commands/refreshCommand';
import completionProvider from './providers/completionProvider';
import pullTranslations from './pullTranslations';
import translationInlayHintsProvider from './providers/translationInlayHintsProvider';

export async function activate(context: vscode.ExtensionContext) {

  // Initially load translations.
  await pullTranslations();

	vscode.window.showInformationMessage("ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧ please donate Andy");


  // Listen for configuration changes to refresh translations.
  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('i18nInspect.translationResource')) {
      pullTranslations();
    }
  });

	[
		translationInlayHintsProvider,
		hoverProvider,
		refreshCommand,
		completionProvider,
	].forEach(disposable => context.subscriptions.push(disposable));
}

export function deactivate() {}
