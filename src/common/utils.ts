import * as vscode from 'vscode';

export async function readFirstLines(uri: vscode.Uri, maxLines: number): Promise<string> {
  const data = await vscode.workspace.fs.readFile(uri);
  const text = Buffer.from(data).toString('utf8');
  const lines = text.split(/\r?\n/).slice(0, maxLines);
  return lines.join('\n');
}
