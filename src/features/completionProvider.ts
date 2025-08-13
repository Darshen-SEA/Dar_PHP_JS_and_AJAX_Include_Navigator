import * as vscode from 'vscode';
import { extractPathContext, listPathCompletions } from '../common/resolver';

export class IncludeCompletionProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionItem[] | undefined> {
    const ctx = extractPathContext(document, position);
    if (!ctx) { return; }
    const items = await listPathCompletions(document, ctx.prefix);
    return items.map(i => {
      const ci = new vscode.CompletionItem(i.label, i.kind);
      ci.insertText = i.insertText ?? i.label;
      ci.detail = i.detail;
      ci.sortText = i.sortText;
      return ci;
    });
  }
}
