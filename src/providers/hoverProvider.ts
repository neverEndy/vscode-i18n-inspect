import * as vscode from 'vscode';
import { getNestedValue } from '../utils/object-mapping';
import store from '../store';
import { getI18nMatch } from '../utils/matchers';

const hoverProvider = vscode.languages.registerHoverProvider(
  ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
  {
    provideHover(document, position) {
      const match = getI18nMatch(document, position);
      if (match) {
        const translation = getNestedValue(match.key, store.translations);
        if (translation) {
          return new vscode.Hover(`> ✨ ${translation}`, match.range);
        }
      }
      return;
    },
  }
);

export default hoverProvider;
