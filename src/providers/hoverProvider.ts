import * as vscode from 'vscode';
import store from '../store';
import { getI18nMatch } from '../utils/matchers';
import { getNestedValue } from '../utils/object-mapping';
import { createTranslationInfoMarkdown } from '../utils/markdown';
import replaceInterpolatedPlaceholders from '../utils/replaceInterpolatedPlaceholders';

export default vscode.languages.registerHoverProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
	provideHover(document: vscode.TextDocument, position: vscode.Position) {
		const match = getI18nMatch(document, position);
		if (!match) {
			return;
		}

		let translation = getNestedValue(match.key, store.translations);
		if (translation) {
			translation = replaceInterpolatedPlaceholders(translation, store.translations);
		}
		const textFound = typeof translation === "string";
		if (translation && textFound) {
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
