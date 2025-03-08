import * as vscode from 'vscode';

type StoreType = {
	translations: any;
	context: vscode.ExtensionContext
}

const store = {
	translations: {},
} as StoreType;

export default store;
