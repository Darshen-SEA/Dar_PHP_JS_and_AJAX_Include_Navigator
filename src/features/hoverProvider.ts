import * as vscode from 'vscode';
import { extractPathAtPosition, resolveToUris, isHttpUrl, headRequest } from '../common/resolver';
import { readFirstLines } from '../common/utils';

export class IncludeHoverProvider implements vscode.HoverProvider {
  async provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
    const cfg = vscode.workspace.getConfiguration('darNavigator');
    if (!cfg.get<boolean>('hover.preview')) { return; }

    const hit = extractPathAtPosition(document, position);
    if (!hit) { return; }

    if (isHttpUrl(hit.raw)) {
      if (!cfg.get<boolean>('url.validation')) { return; }
      const res = await headRequest(hit.raw).catch(() => undefined);
      const status = res ? `${res.statusCode} ${res.statusMessage}` : 'unreachable';
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`URL: ${hit.raw}  \nStatus: ${status}`);
      md.isTrusted = true;
      return new vscode.Hover(md);
    }

    const uris = await resolveToUris(document, hit.raw);
    if (!uris.length) { return; }
    const maxLines = cfg.get<number>('hover.maxLines', 20);
    const parts: string[] = [];
    for (const uri of uris.slice(0, 3)) {
      const preview = await readFirstLines(uri, maxLines).catch(() => undefined);
      if (preview) {
        parts.push([`File: ${vscode.workspace.asRelativePath(uri)}`, '```', preview, '```'].join('\n'));
      }
    }
    if (!parts.length) { return; }
    const md = new vscode.MarkdownString(parts.join('\n\n'));
    md.isTrusted = true;
    return new vscode.Hover(md);
  }
}
