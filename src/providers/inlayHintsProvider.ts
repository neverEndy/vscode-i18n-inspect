import * as vscode from 'vscode';
import store from '../store';
import { getI18nMatchesForLine } from '../utils/matchers';
import { getNestedValue } from '../utils/object-mapping';

export async function refreshInlayHints() {
	// 触发所有可见编辑器的内联提示刷新
	vscode.window.visibleTextEditors.forEach(editor => {
		// 创建一个空编辑，这会触发内联提示的重新计算
		const edit = new vscode.WorkspaceEdit();
		editor.document.save();
	});
}

export default vscode.languages.registerInlayHintsProvider(
	['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
	{
		provideInlayHints(document: vscode.TextDocument, range: vscode.Range) {
			const hints: vscode.InlayHint[] = [];
			
			for (let i = range.start.line; i <= range.end.line; i++) {
				const line = document.lineAt(i);
				const matches = getI18nMatchesForLine(line.text, i);
				
				for (const match of matches) {
					const translation = getNestedValue(match.key, store.translations);
					const hintText = typeof translation === "string"
						? `✨ ${translation}`
						: "❗❗ Σ(°Д°; key not found ❗❗";
					
					if (translation) {
						const hint = new vscode.InlayHint(
							match.range.end,
							hintText,
							vscode.InlayHintKind.Parameter
						);
						hint.paddingLeft = true;
						hints.push(hint);
					}
				}
			}
			
			return hints;
		}
	}
); 