import * as vscode from 'vscode';
import { getNestedValue } from '../utils/object-mapping';
import store from '../store';
import { getI18nMatchesForLine } from '../utils/matchers';

class InlayHintsProvider implements vscode.InlayHintsProvider {
  // (Optional) Event to signal that hints need to be refreshed.
  onDidChangeInlayHints?: vscode.Event<void>;

  provideInlayHints(document: vscode.TextDocument, range: vscode.Range, token: vscode.CancellationToken): vscode.ProviderResult<vscode.InlayHint[]> {
    const hints: vscode.InlayHint[] = [];

    // Process each line in the requested range.
    for (let lineNum = range.start.line; lineNum <= range.end.line; lineNum++) {
      const line = document.lineAt(lineNum);
      const matches = getI18nMatchesForLine(line.text, lineNum);
      for (const match of matches) {
        const translation = getNestedValue(match.key, store.translations);
				const hintText = typeof translation === "string"
					? `✨ ${translation}`
					: "❗❗ Σ(°Д°; key not found ❗❗";
				// Position the hint right after the matched key.
				const hintPosition = new vscode.Position(lineNum, match.range.end.character);
				const hint = new vscode.InlayHint(hintPosition, ` ${hintText}`, vscode.InlayHintKind.Type);
				hints.push(hint);
      }
    }

    return hints;
  }
}

const translationInlayHintsProvider = vscode.languages.registerInlayHintsProvider(
	['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
	new InlayHintsProvider()
);

export default translationInlayHintsProvider;