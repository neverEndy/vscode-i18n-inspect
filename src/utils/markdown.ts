import * as vscode from 'vscode';

export const createTranslationInfoMarkdown = (key: string, translation: string, languageCode: string) => {
    const docs = new vscode.MarkdownString();
    docs.supportHtml = true;
    docs.isTrusted = true;
    docs.supportThemeIcons = true;
    docs.appendMarkdown(`#### ✨ ${translation} \n`);
    docs.appendMarkdown(`<sub>🌐 ${languageCode}</sub>\n`);
    docs.appendMarkdown(`<sub>🔑 ${key}</sub>\n`);
    return docs;
}
