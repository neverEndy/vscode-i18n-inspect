import * as vscode from 'vscode';
import store from '../store';
import { getI18nMatchesForLine } from '../utils/matchers';
import { getNestedValue } from '../utils/object-mapping';
import replaceInterpolatedPlaceholders from '../utils/replaceInterpolatedPlaceholders';

// Trigger refresh of inlay hints for all visible editors
export function refreshInlayHints() {
	// Create an empty edit to trigger recalculation of inlay hints
	vscode.window.visibleTextEditors.forEach(editor => {
		editor.document.save();
	});
}

function isDynamicKey(key: string): boolean {
	// Check if key contains template literal syntax
	if (key.includes('${')) {
		return true;
	}
  return false;
}

export default vscode.languages.registerInlayHintsProvider(
	['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
	{
		async provideInlayHints(document: vscode.TextDocument, range: vscode.Range) {
			const hints: vscode.InlayHint[] = [];
			
			for (let i = range.start.line; i <= range.end.line; i++) {
				const line = document.lineAt(i);
				const matches = getI18nMatchesForLine(line.text, i);
				
				for (const match of matches) {
					let translation = getNestedValue(match.key, store.translations);

					if (translation) {
						translation = replaceInterpolatedPlaceholders(translation, store.translations);
					}

					// Extract options if present
					const optionsMatch = match.fullMatch.match(/,\s*({[^}]*})/);
					const options = optionsMatch ? optionsMatch[1] : null;

					const hintText = isDynamicKey(match.key)
						? `🎲 dynamic key${options ? ` ${options}` : ''}`
						: typeof translation === "string"
							? `✨ ${translation}${options ? ` ${options}` : ''}`
							: "❗❗ Σ(°Д°; key not found ❗❗";
					
					const hint = new vscode.InlayHint(
						match.range.end,
						hintText,
						vscode.InlayHintKind.Parameter
					);
					hint.paddingLeft = true;
					hints.push(hint);
				}
			}
			
			return hints;
		}
	}
); 