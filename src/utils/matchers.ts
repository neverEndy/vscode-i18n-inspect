import * as vscode from 'vscode';
import { isValidKey } from './validation';

interface I18nMatch {
    key: string;
    range: vscode.Range;
    fullMatch: string;
    type: 'tFunction' | 'trans';
}

/** Regex for matching i18nKey attribute in <Trans> components. */
const transRegex = /i18nKey\s*=\s*(?:"([^"]+)"|'([^']+)'|{\s*(?:"([^"]+)"|'([^']+)')\s*})/g;

// Match all translation function call patterns
const I18N_PATTERNS = [
    // Basic t and t_ prefixed custom function calls
    /(?<![A-Za-z0-9_])t(?:_[A-Za-z0-9]+)*\(\s*(["']?)([^)]*)\1\s*\)/g,
    
    // i18n.t calls
    /i18n\.t\(\s*(["'])([^"']*?)\1\s*(?:,\s*{[^}]*})?\)/g,
];

/**
 * Find translation key match at given position
 */
export function getI18nMatch(document: vscode.TextDocument, position: vscode.Position): I18nMatch | null {
    const line = document.lineAt(position.line);
    const text = line.text;
    const matches = getI18nMatchesForLine(text, line.lineNumber);
    
    // Find match containing current position
    for (const match of matches) {
        // Check if position is within key range
        const keyStart = text.indexOf(match.key, match.range.start.character);
        const keyEnd = keyStart + match.key.length;
        
        // Create range containing only the key
        const keyRange = new vscode.Range(
            new vscode.Position(line.lineNumber, keyStart),
            new vscode.Position(line.lineNumber, keyEnd)
        );
        
        if (keyRange.contains(position)) {
            return {
                ...match,
                range: keyRange
            };
        }
    }
    
    return null;
}

/**
 * Find all translation key matches in given line
 */
export function getI18nMatchesForLine(text: string, lineNumber: number): I18nMatch[] {
    const matches: I18nMatch[] = [];

    // Process function call matches
    for (const pattern of I18N_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);  // Create new regex instance
        let match;
        while ((match = regex.exec(text)) !== null) {
            const key = match[2]; // Use second capture group as first one is quotes
            if (!key) {
                continue;
            };

            const fullMatch = match[0];
            const startIndex = match.index;
            const keyStartOffset = fullMatch.indexOf(key);
            const keyStart = startIndex + keyStartOffset;
            
            matches.push({
                key,
                range: new vscode.Range(
                    new vscode.Position(lineNumber, keyStart),
                    new vscode.Position(lineNumber, keyStart + key.length)
                ),
                fullMatch,
                type: 'tFunction'
            });
        }
    }

    // Process Trans component matches
    const transRegexInstance = new RegExp(transRegex.source, transRegex.flags);
    let transMatch;
    while ((transMatch = transRegexInstance.exec(text)) !== null) {
        // Check all possible capture groups
        const key = transMatch[1] || transMatch[2] || transMatch[3] || transMatch[4];
        if (!key) continue;

        const fullMatch = transMatch[0];
        const startIndex = transMatch.index;
        const keyStartOffset = fullMatch.indexOf(key);
        const keyStart = startIndex + keyStartOffset;
        
        matches.push({
            key,
            range: new vscode.Range(
                new vscode.Position(lineNumber, keyStart),
                new vscode.Position(lineNumber, keyStart + key.length)
            ),
            fullMatch,
            type: 'trans'
        });
    }

    return matches;
}

/**
 * Get ranges of all invalid translation keys in document
 */
export function getI18nErrorRanges(editor: vscode.TextEditor): vscode.Range[] {
    const errorRanges: vscode.Range[] = [];
    const document = editor.document;
    
    // Iterate through each line
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const matches = getI18nMatchesForLine(line.text, i);
        
        // Check if each matched key is valid
        for (const match of matches) {
            if (!isValidKey(match.key)) {
                errorRanges.push(match.range);
            }
        }
    }
    
    return errorRanges;
}

