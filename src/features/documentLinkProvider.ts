import * as vscode from 'vscode';

const URL_RE = /https?:\/\/[^\s"')]+/gi;

export class DocumentHttpLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
    const maxLines = Math.min(document.lineCount, 2000);
    for (let lineNum = 0; lineNum < maxLines; lineNum++) {
      const text = document.lineAt(lineNum).text;
      let m: RegExpExecArray | null;
      URL_RE.lastIndex = 0;
      while ((m = URL_RE.exec(text))) {
        const url = m[0];
        const start = m.index;
        const end = start + url.length;
        const range = new vscode.Range(new vscode.Position(lineNum, start), new vscode.Position(lineNum, end));
        const link = new vscode.DocumentLink(range, vscode.Uri.parse(url));
        link.tooltip = `Open ${url}`;
        links.push(link);
      }
    }
    return links;
  }
}
