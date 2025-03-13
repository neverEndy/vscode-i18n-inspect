import * as vscode from 'vscode';
import { flattenKeys, getNestedValue } from '../utils/object-mapping';
import store from '../store';
import { getI18nMatchesForLine } from '../utils/matchers';
import { createTranslationInfoMarkdown } from '../utils/markdown';
import replaceInterpolatedPlaceholders from '../utils/replaceInterpolatedPlaceholders';

// Completion provider that offers translation key suggestions
const completionProvider = vscode.languages.registerCompletionItemProvider(
  ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
  {
    provideCompletionItems(document, position) {
      const line = document.lineAt(position.line);
      const matches = getI18nMatchesForLine(line.text, line.lineNumber);
      let currentKey: string | null = null;
      let foundRange: vscode.Range | undefined = undefined;

      // Look for a match where the cursor is within the key range.
      for (const m of matches) {
        if (m.range.contains(position)) {
          currentKey = m.key;
          foundRange = m.range;
          break;
        }
      }
      if (currentKey === null || !foundRange) {
        return undefined;
      }

      // Get all flattened keys from the translation store.
      const flattenedKeys = flattenKeys(store.translations);
      const suggestions = flattenedKeys
        .filter(key => key.startsWith(currentKey))
        .map(key => {
          const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Value);
          // Replace just the matched key text.
          item.textEdit = vscode.TextEdit.replace(foundRange, key);
          let translation = getNestedValue(key, store.translations);
          if (translation) {
            translation = replaceInterpolatedPlaceholders(translation, store.translations);
            item.detail = `${translation} (${store.crowdinConfig.languageCode})`;
            item.documentation = createTranslationInfoMarkdown(key, translation, store.crowdinConfig.languageCode);
          }
          return item;
        });
      return suggestions;
    }
  },
  // Trigger completions on these characters.
  '"', "'", "."
);

export default completionProvider;