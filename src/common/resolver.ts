import * as vscode from 'vscode';
import * as path from 'path';
import { getAliasEntries, applyAlias } from './alias';

const JS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const CSS_EXTS = [".css", ".scss", ".sass", ".less"];
const PHP_EXTS = [".php", ".inc", ".phtml"];

export function isHttpUrl(s: string): boolean { return /^https?:\/\//i.test(s); }

function isWithinQuotes(text: string, idx: number): { quote: string, start: number, end: number } | undefined {
  const q = text.lastIndexOf('\'', idx) > text.lastIndexOf('"', idx) ? '\'' : '"';
  const start = text.lastIndexOf(q, idx);
  if (start === -1) { return; }
  const end = text.indexOf(q, start + 1);
  if (end !== -1 && idx >= start && idx <= end) { return { quote: q, start, end }; }
}

function extractUrlFunction(text: string, idx: number): { start: number, end: number } | undefined {
  // find nearest url( before idx
  const up = text.lastIndexOf('url(', idx);
  if (up === -1) return;
  const close = text.indexOf(')', up + 4);
  if (close === -1 || idx < up || idx > close) return;
  return { start: up + 4, end: close };
}

function lineIndicatesPathContext(line: string): boolean {
  return /\b(include|require|include_once|require_once)\b/.test(line)
    || /\b(import\s+|from\s+|require\s*\(|import\s*\()/.test(line)
    || /<(script|link)[^>]+(src|href)\s*=/.test(line)
    || /@import\s+|@use\s+/.test(line)
    || /\b(fetch|axios\.[a-z]+|XMLHttpRequest)\b/.test(line);
}

export function extractPathAtPosition(document: vscode.TextDocument, position: vscode.Position): { raw: string } | undefined {
  const line = document.lineAt(position.line).text;
  if (!lineIndicatesPathContext(line)) { return; }
  const inq = isWithinQuotes(line, position.character);
  if (inq) {
    const raw = line.slice(inq.start + 1, inq.end);
    if (raw) return { raw };
  }
  // CSS url(...) support when enabled
  const cfg = vscode.workspace.getConfiguration('darNavigator');
  if ((document.languageId === 'css' || document.languageId === 'scss' || document.languageId === 'less') && cfg.get<boolean>('enableAssetUrlsInCSS')) {
    const seg = extractUrlFunction(line, position.character);
    if (seg) {
      let raw = line.slice(seg.start, seg.end).trim();
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))) {
        raw = raw.slice(1, -1);
      }
      if (raw) return { raw };
    }
  }
  return;
}

export function extractPathContext(document: vscode.TextDocument, position: vscode.Position): { prefix: string } | undefined {
  const line = document.lineAt(position.line).text;
  if (!lineIndicatesPathContext(line)) { return; }
  const inq = isWithinQuotes(line, position.character);
  if (!inq) { return; }
  const prefix = line.slice(inq.start + 1, position.character);
  return { prefix };
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try { await vscode.workspace.fs.stat(uri); return true; } catch { return false; }
}

function toCandidates(raw: string, baseDir: vscode.Uri, exts: string[], preferCssModules = false): vscode.Uri[] {
  const uris: vscode.Uri[] = [];
  const asUri = vscode.Uri.joinPath(baseDir, raw);
  uris.push(asUri);
  if (!path.extname(raw)) {
    if (preferCssModules && exts.includes('.css')) {
      uris.push(vscode.Uri.joinPath(baseDir, raw + '.module.css'));
    }
    for (const ext of exts) { uris.push(vscode.Uri.joinPath(baseDir, raw + ext)); }
    // index.*
    uris.push(vscode.Uri.joinPath(baseDir, raw, 'index'));
    if (preferCssModules && exts.includes('.css')) {
      uris.push(vscode.Uri.joinPath(baseDir, raw, 'index.module.css'));
    }
    for (const ext of exts) { uris.push(vscode.Uri.joinPath(baseDir, raw, 'index' + ext)); }
  }
  return uris;
}

function getExtsForDoc(document: vscode.TextDocument): string[] {
  const lang = document.languageId;
  if (lang === 'php') return PHP_EXTS;
  if (lang.startsWith('javascript') || lang.startsWith('typescript') || lang === 'vue') return JS_EXTS;
  if (lang === 'css' || lang === 'scss' || lang === 'less' || lang === 'html' || lang === 'vue') return CSS_EXTS;
  return [...JS_EXTS, ...CSS_EXTS, ...PHP_EXTS];
}

function applyTsJsPathsAlias(raw: string, folder: vscode.WorkspaceFolder | undefined): string | undefined {
  if (!folder) return;
  // Very lightweight alias support: @/* -> src/*
  // Simple heuristic: '@/x' -> 'src/x'
  if (raw.startsWith('@/')) return raw.replace(/^@\//, 'src/');
  if (raw.startsWith('~')) return raw.replace(/^~\/?/, '');
  return raw;
}

export async function resolveToUris(document: vscode.TextDocument, rawInput: string): Promise<vscode.Uri[]> {
  let raw = rawInput.trim();
  if (!raw) return [];
  if (isHttpUrl(raw)) return [];

  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  const exts = getExtsForDoc(document);
  const cfg = vscode.workspace.getConfiguration('darNavigator');
  const preferCssModules = cfg.get<boolean>('preferCssModules', true);

  // Alias
  raw = applyTsJsPathsAlias(raw, folder) ?? raw;
  const aliasEntries = await getAliasEntries(folder);
  let aliasBase: vscode.Uri | undefined;
  let aliasRest = '';
  const applied = applyAlias(raw, aliasEntries);
  if (applied) {
    aliasBase = applied.base;
    aliasRest = applied.rest;
  }

  const tries: vscode.Uri[] = [];

  // Absolute from workspace
  if (raw.startsWith('/')) {
    if (folder) tries.push(...toCandidates(raw.slice(1), folder.uri, exts, preferCssModules));
  }

  // Relative to current file
  const baseDir = vscode.Uri.joinPath(document.uri, '..');
  tries.push(...toCandidates(raw, baseDir, exts, preferCssModules));

  // Relative to workspace root
  if (folder) {
    tries.push(...toCandidates(raw, folder.uri, exts, preferCssModules));
  }

  // Alias base
  if (aliasBase) {
    tries.push(...toCandidates(aliasRest, aliasBase, exts, preferCssModules));
  }

  const found: vscode.Uri[] = [];
  for (const u of tries) {
    if (await exists(u)) { found.push(u); }
  }
  return found;
}

export async function listPathCompletions(document: vscode.TextDocument, prefixRaw: string): Promise<Array<{label: string, kind: vscode.CompletionItemKind, insertText?: string, detail?: string, sortText?: string}>> {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return [];
  const prefix = prefixRaw || '';

  const base = prefix.startsWith('/') ? folder.uri : vscode.Uri.joinPath(document.uri, '..');
  try {
    const entries = await vscode.workspace.fs.readDirectory(base);
    const items = entries
      .filter(([name]) => name.toLowerCase().startsWith(path.basename(prefix).toLowerCase()))
      .map(([name, fileType]) => {
        const isDir = fileType === vscode.FileType.Directory;
        return {
          label: name + (isDir ? '/' : ''),
          kind: isDir ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File,
          detail: vscode.workspace.asRelativePath(vscode.Uri.joinPath(base, name)),
          sortText: (isDir ? '0' : '1') + name
        };
      });
    return items;
  } catch {
    return [];
  }
}

export async function headRequest(url: string): Promise<{ statusCode: number, statusMessage: string }> {
  const { request } = await import(url.startsWith('https') ? 'https' : 'http');
  return new Promise((resolve, reject) => {
    const req = request(url, { method: 'HEAD', timeout: 3000 }, (res) => {
      resolve({ statusCode: res.statusCode || 0, statusMessage: res.statusMessage || '' });
    });
    req.on('error', reject);
    req.on('timeout', () => { try { req.destroy(); } catch { /* ignore destroy error */ } reject(new Error('timeout')); });
    req.end();
  });
}
