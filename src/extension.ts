import * as vscode from 'vscode';
import { IncludeDefinitionProvider } from './features/definitionProvider';
import { IncludeHoverProvider } from './features/hoverProvider';
import { IncludeCompletionProvider } from './features/completionProvider';
import { extractPathAtPosition } from './common/resolver';
import { DocumentHttpLinkProvider } from './features/documentLinkProvider';
import { registerDiagnostics } from './features/diagnostics';

const LANGS = [
  'php',
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'html',
  'vue',
  'css',
  'scss',
  'less'
];

export function activate(context: vscode.ExtensionContext) {
  const defProvider = new IncludeDefinitionProvider();
  const hoverProvider = new IncludeHoverProvider();
  const completionProvider = new IncludeCompletionProvider();
  const linkProvider = new DocumentHttpLinkProvider();

  for (const lang of LANGS) {
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider({ language: lang }, defProvider),
    );
  }

  for (const lang of LANGS) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider({ language: lang }, hoverProvider),
    );
  }

  const triggerChars = ["'", '"', '/', '.', '@', '~'];
  for (const lang of LANGS) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider({ language: lang }, completionProvider, ...triggerChars),
    );
  }

  // HTTP/HTTPS links in text documents (file and untitled buffers)
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider({ scheme: 'file' }, linkProvider),
    vscode.languages.registerDocumentLinkProvider({ scheme: 'untitled' }, linkProvider)
  );

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = 'Include Navigator';
  statusBar.command = 'darNavigator.navigateToInclude';
  statusBar.tooltip = 'Navigate to Include/Import under cursor';
  statusBar.show();
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.commands.registerCommand('darNavigator.navigateToInclude', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) { return; }
      const { document, selection } = editor;
      const pos = selection.active;
      const hit = extractPathAtPosition(document, pos);
      if (!hit) {
        vscode.window.showInformationMessage('No include/import path detected at cursor.');
        return;
      }
      await vscode.commands.executeCommand('editor.action.revealDefinition');
    })
  );

  // Diagnostics for unresolved includes/imports
  registerDiagnostics(context);
}

export function deactivate() {}
