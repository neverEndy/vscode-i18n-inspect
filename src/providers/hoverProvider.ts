import * as vscode from 'vscode';
import store from '../store';
import { getI18nMatch } from '../utils/matchers';
import { getNestedValue } from '../utils/object-mapping';
import { createTranslationInfoMarkdown } from '../utils/markdown';

export default vscode.languages.registerHoverProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
	provideHover(document: vscode.TextDocument, position: vscode.Position) {
		const match = getI18nMatch(document, position);
		if (!match) {
			return;
		}

		const translation = getNestedValue(match.key, store.translations);
		const textFound = typeof translation === "string";
		if (textFound) {
			return new vscode.Hover(
				createTranslationInfoMarkdown(
					match.key,
					translation,
					store.crowdinConfig.languageCode
				),
				match.range
		);
		}
	}
});
