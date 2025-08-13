import * as vscode from 'vscode';
import { resolveToUris, extractPathAtPosition } from '../common/resolver';

export class IncludeDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): Promise<vscode.Definition | undefined> {
    const hit = extractPathAtPosition(document, position);
    if (!hit) { return; }
    const uris = await resolveToUris(document, hit.raw);
    if (!uris.length) { return; }
    return uris.map(u => new vscode.Location(u, new vscode.Position(0, 0)));
  }
}
