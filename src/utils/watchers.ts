import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { isUrl } from './validation';

export const fileWatcher = (resourcePath: string, callback: () => (Promise<void> | void)) => {
	if (isUrl(resourcePath)) {
		return {
			dispose: () => {}
		};
	}

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return {
			dispose: () => {}
		};
	}

	const watcher = fs.watch(path.dirname(resourcePath), {
		recursive: false, // Don't watch subdirectories
		persistent: false, // Don't keep the process running
	}, (eventType, filename) => {
		if (filename === path.basename(resourcePath)) {
			callback();
		}
	});

	return {
		dispose: () => watcher.close()
	};
};

export const configurationWatcher =  (section: string, callback: () => (Promise<void> | void)) => {
	return vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration(section)) {
				callback();
			}
		});
};