import * as vscode from 'vscode';

export const fileWatcher = (globPattern: vscode.GlobPattern, callback: () => (Promise<void> | void)) => {
	const fileWatcher = vscode.workspace.createFileSystemWatcher(globPattern);
	return vscode.Disposable.from(
		fileWatcher.onDidChange(callback),
		fileWatcher
	);
};

export const configurationWatcher =  (section: string, callback: () => (Promise<void> | void)) => {
	return vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(section)) {
				callback();
			}
		});
};