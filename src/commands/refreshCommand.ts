import * as vscode from 'vscode';
import pullTranslations from '../pullTranslations';

// Register the refresh command.
const refreshCommand = vscode.commands.registerCommand('i18nInspect.refresh', async () => {
	await pullTranslations();
});

export default refreshCommand;