import * as vscode from 'vscode';
import { resolveToUris, isHttpUrl } from '../common/resolver';

const PATH_CONTEXT_RE = /(include|require|include_once|require_once|import\s+|from\s+|require\s*\(|import\s*\(|<(?:script|link)[^>]+(?:src|href)\s*=|@import\s+|@use\s+|fetch\(|XMLHttpRequest|axios\.[a-z]+)/i;

function* findQuotedSpans(line: string): Generator<{ start: number; end: number; raw: string }> {
  const QUOTES = ['"', '\''];
  for (let i = 0; i < line.length; i++) {
    if (QUOTES.includes(line[i])) {
      const q = line[i];
      const j = line.indexOf(q, i + 1);
      if (j > i + 1) {
        const raw = line.slice(i + 1, j);
        yield { start: i + 1, end: j, raw };
        i = j;
      }
    }
  }
}

export function registerDiagnostics(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection('darNavigator');
  context.subscriptions.push(collection);

  async function lint(document: vscode.TextDocument) {
    if (document.uri.scheme !== 'file') { return; }
    const cfg = vscode.workspace.getConfiguration('darNavigator');
    const enable = cfg.get<boolean>('enablePHP') || cfg.get<boolean>('enableJS') || cfg.get<boolean>('enableCSS') || cfg.get<boolean>('enableHTML');
    if (!enable) { collection.delete(document.uri); return; }

    const diags: vscode.Diagnostic[] = [];
    const maxLines = Math.min(document.lineCount, 2000);
    for (let ln = 0; ln < maxLines; ln++) {
      const text = document.lineAt(ln).text;
      if (!PATH_CONTEXT_RE.test(text)) continue;
      for (const span of findQuotedSpans(text)) {
        const raw = span.raw.trim();
        if (!raw || isHttpUrl(raw)) continue;
        const uris = await resolveToUris(document, raw);
        if (!uris.length) {
          const range = new vscode.Range(new vscode.Position(ln, span.start), new vscode.Position(ln, span.end));
          const d = new vscode.Diagnostic(range, `Include/Import target not found: ${raw}`, vscode.DiagnosticSeverity.Warning);
          d.source = 'Dar Include Navigator';
          diags.push(d);
        }
      }
    }
    collection.set(document.uri, diags);
  }

  const openDocs = vscode.workspace.textDocuments;
  openDocs.forEach(doc => lint(doc));

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => lint(doc)),
    vscode.workspace.onDidSaveTextDocument(doc => lint(doc)),
    vscode.workspace.onDidCloseTextDocument(doc => collection.delete(doc.uri))
  );
}
