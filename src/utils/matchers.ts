/** Regex for matching t("...") calls.
 * It now only matches if "t" is not preceded by a word character.
 */
export const tRegex = /(?<![A-Za-z0-9_])t\((["'])([^"']*)["']?\)?/g;

/** This regex supports t(), t_custom(), etc.
 * The negative lookbehind ensures the function name starts with "t" not preceded by a letter, number, or underscore.
 */
export const i18nFunctionRegex = /(?<![A-Za-z0-9_])t(?:_[A-Za-z0-9]+)*\(\s*(["'])([^"']*)\1/g;

/** Regex for matching i18nKey attribute in <Trans> components. */
export const transRegex = /i18nKey\s*=\s*(?:"([^"]+)"|'([^']+)'|{\s*(?:"([^"]+)"|'([^']+)')\s*})/g;


import * as vscode from 'vscode';
import { isValidKey } from './validation';

/**
 * Returns a match if the cursor is within one of the i18n patterns.
 * The returned object indicates the type of match ('tFunction' or 'trans'),
 * the extracted key, and the range of the key in the document.
 */
export function getI18nMatch(
  document: vscode.TextDocument,
  position: vscode.Position
): { type: 'tFunction' | 'trans'; key: string; range: vscode.Range } | undefined {
  // Define our matchers.
  const matchers: Array<{ type: 'tFunction' | 'trans'; regex: RegExp }> = [
    {
      type: 'tFunction',
      regex: i18nFunctionRegex,
    },
    {
      type: 'trans',
      regex: transRegex,
    },
  ];

  const line = document.lineAt(position.line);
  for (const matcher of matchers) {
    let match: RegExpExecArray | null;
    while ((match = matcher.regex.exec(line.text)) !== null) {
      if (matcher.type === 'tFunction') {
        // For tFunction, group[1] is the opening quote and group[2] is the key.
        const quote = match[1];
        const keyContent = match[2];
        const matchStart = match.index;
        // Find the opening quote position in the line (starting at match.index).
        const openQuoteIndex = line.text.indexOf(quote, matchStart);
        const keyStart = openQuoteIndex + 1;
        const keyEnd = keyStart + keyContent.length;
        const keyRange = new vscode.Range(
          new vscode.Position(line.lineNumber, keyStart),
          new vscode.Position(line.lineNumber, keyEnd)
        );
        if (keyRange.contains(position)) {
          return { type: 'tFunction', key: keyContent, range: keyRange };
        }
      } else if (matcher.type === 'trans') {
        // For trans, the key might be in one of several groups.
        const key = match[1] || match[2] || match[3] || match[4];
        if (!key) {
          continue;
        }
        const keyStartOffset = line.text.indexOf(key, match.index);
        const keyEndOffset = keyStartOffset + key.length;
        const keyRange = new vscode.Range(
          new vscode.Position(line.lineNumber, keyStartOffset),
          new vscode.Position(line.lineNumber, keyEndOffset)
        );
        if (keyRange.contains(position)) {
          return { type: 'trans', key, range: keyRange };
        }
      }
    }
  }
  return undefined;
}


/**
 * Scans a given line of text (from the document) for i18n key patterns.
 * It checks for:
 *  - t(), t_custom(), etc.
 *  - <Trans> component with an i18nKey attribute.
 * Returns an array of matches with the key, its type, and its text range.
 */
export function getI18nMatchesForLine(line: string, lineNumber: number): { type: 'tFunction' | 'trans'; key: string; range: vscode.Range }[] {
  const matches: { type: 'tFunction' | 'trans'; key: string; range: vscode.Range }[] = [];

  let match: RegExpExecArray | null;

  // Process t function matches.
  while ((match = i18nFunctionRegex.exec(line)) !== null) {
    // match[1] is the opening quote; match[2] is the key.
    const quote = match[1];
    const keyContent = match[2];
    const matchStart = match.index;
    // Find the opening quote position in the line starting at match.index.
    const openQuoteIndex = line.indexOf(quote, matchStart);
    const keyStart = openQuoteIndex + 1;
    const keyEnd = keyStart + keyContent.length;
    const keyRange = new vscode.Range(
      new vscode.Position(lineNumber, keyStart),
      new vscode.Position(lineNumber, keyEnd)
    );
    matches.push({ type: 'tFunction', key: keyContent, range: keyRange });
  }

  // Process <Trans> component matches.
  while ((match = transRegex.exec(line)) !== null) {
    // The key may appear in one of several capture groups.
    const key = match[1] || match[2] || match[3] || match[4];
    if (!key) {
      continue;
    }
    const keyStartOffset = line.indexOf(key, match.index);
    const keyEndOffset = keyStartOffset + key.length;
    const keyRange = new vscode.Range(
      new vscode.Position(lineNumber, keyStartOffset),
      new vscode.Position(lineNumber, keyEndOffset)
    );
    matches.push({ type: 'trans', key, range: keyRange });
  }

  return matches;
}


/**
 * Scans the entire document text for i18n key patterns (both function calls and <Trans> components)
 * and returns an array of ranges where keys are invalid.
 */
export function getI18nErrorRanges(editor: vscode.TextEditor): vscode.Range[] {
  const text = editor.document.getText();
  const errorRanges: vscode.Range[] = [];
  let match: RegExpExecArray | null;

  // Check matches for i18n functions.
  while ((match = i18nFunctionRegex.exec(text)) !== null) {
    // match[1] is the opening quote; match[2] is the key.
    const key = match[2];
    if (!isValidKey(key)) {
      const fullMatch = match[0];
      const quote = match[1];
      // Find the position of the opening quote in the full matched string.
      const localQuoteIndex = fullMatch.indexOf(quote);
      // The key starts right after the opening quote.
      const keyStartOffset = match.index + localQuoteIndex + 1;
      const keyEndOffset = keyStartOffset + key.length;
      const startPos = editor.document.positionAt(keyStartOffset);
      const endPos = editor.document.positionAt(keyEndOffset);
      errorRanges.push(new vscode.Range(startPos, endPos));
    }
  }

  // Check matches for <Trans> components.
  while ((match = transRegex.exec(text)) !== null) {
    // The key may appear in one of several capture groups.
    const key = match[1] || match[2] || match[3] || match[4];
    if (!key) {
      continue;
    }
    if (!isValidKey(key)) {
      // Find the key's offset in the document.
      const keyStartOffset = text.indexOf(key, match.index);
      const keyEndOffset = keyStartOffset + key.length;
      const startPos = editor.document.positionAt(keyStartOffset);
      const endPos = editor.document.positionAt(keyEndOffset);
      errorRanges.push(new vscode.Range(startPos, endPos));
    }
  }

  return errorRanges;
}

