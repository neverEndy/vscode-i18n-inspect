import * as vscode from 'vscode';
import { getI18nErrorRanges, getI18nMatchesForLine } from '../utils/matchers';
import { getNestedValue } from '../utils/object-mapping';
import store from '../store';


/**
 * warning decorations for incorrect i18n key usage in the active editor.
 */
export function warningDecorations(editor: vscode.TextEditor) {
  const errorRanges = getI18nErrorRanges(editor);
  editor.setDecorations(
		vscode.window.createTextEditorDecorationType({
			textDecoration: 'underline wavy yellow'
		}),
		errorRanges
	);
}


// Create a decoration type that hides text (by setting its color to transparent).
// We won’t define an "after" content here since that will be provided per decoration option.
const replacementDecorationType = vscode.window.createTextEditorDecorationType({
  color: 'transparent'
});

/**
 * Updates decorations on the editor so that when a translation is found,
 * the original key text is hidden and replaced by a decoration's "after" text.
 * The "after" text is offset with a negative margin to cover the gap.
 */
export function translationDecorations(editor: vscode.TextEditor) {
  const decorations: vscode.DecorationOptions[] = [];

  // Loop over all lines of the document.
  for (let lineNum = 0; lineNum < editor.document.lineCount; lineNum++) {
    const line = editor.document.lineAt(lineNum);
    const matches = getI18nMatchesForLine(line.text, lineNum);
    for (const match of matches) {
      const translation = getNestedValue(match.key, store.translations);
      let hintText: string;
      let hintKind: string;
      if (typeof translation === 'string') {
        hintText = `✨ ${translation}`;
        hintKind = 'found';
      } else {
        hintText = '❗ key not found';
        hintKind = 'missing';
      }

      // Create a decoration option for the entire key range.
      // The original text will be hidden (via the decoration type),
      // and the "after" text will be rendered on top.
      const decoration: vscode.DecorationOptions = {
        range: match.range,
        renderOptions: {
          after: {
            // This text will appear in place of the hidden text.
            contentText: hintText,
            // Adjust negative margin (here using "ch" units) to move the after text left
            // so that it visually replaces the original key text.
            margin: '0 0 0 -5ch',
            // You can adjust the color based on whether the key was found or not.
            color: hintKind === 'found'
              ? 'var(--vscode-editorInlayHint-foreground)'  // use theme variable or custom color
              : 'red'
          }
        }
      };

      decorations.push(decoration);
    }
  }
  editor.setDecorations(replacementDecorationType, decorations);
}
