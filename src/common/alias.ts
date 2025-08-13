import * as vscode from 'vscode';

export type AliasEntry = { prefix: string; target: vscode.Uri };

const aliasCache = new Map<string, AliasEntry[]>();

export function invalidateAliasCache(folder?: vscode.WorkspaceFolder) {
  if (folder) aliasCache.delete(folder.uri.fsPath);
  else aliasCache.clear();
}

export async function getAliasEntries(folder: vscode.WorkspaceFolder | undefined): Promise<AliasEntry[]> {
  if (!folder) return [];
  const key = folder.uri.fsPath;
  const cached = aliasCache.get(key);
  if (cached) return cached;

  const entries: AliasEntry[] = [];

  // tsconfig/jsconfig paths
  for (const cfg of ['tsconfig.json', 'jsconfig.json']) {
    try {
      const uri = vscode.Uri.joinPath(folder.uri, cfg);
      const raw = await vscode.workspace.fs.readFile(uri);
      const json = JSON.parse(Buffer.from(raw).toString('utf8'));
      const co = json.compilerOptions || {};
      const baseUrl: string = co.baseUrl || '.';
      const baseUri = vscode.Uri.joinPath(folder.uri, baseUrl);
      const paths = co.paths || {};
      for (const k of Object.keys(paths)) {
        const vals: string[] = paths[k];
        if (!Array.isArray(vals) || !vals.length) continue;
        const prefix = k.replace(/\*.*$/, '');
        const first = vals[0].replace(/\*.*$/, '');
        const target = vscode.Uri.joinPath(baseUri, first);
        entries.push({ prefix, target });
      }
    } catch { /* ignore errors reading ts/js config */ }
  }

  // vite.config.(ts|js)
  for (const cfg of ['vite.config.ts', 'vite.config.js']) {
    try {
      const uri = vscode.Uri.joinPath(folder.uri, cfg);
      const raw = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(raw).toString('utf8');
      // object style: alias: { '@': '/src', 'foo': './x' }
      const objAliasBlock = /alias\s*:\s*\{([\s\S]*?)\}/m.exec(text);
      if (objAliasBlock) {
        const body = objAliasBlock[1];
        const pairRe = /['"]([^'"\n]+)['"]\s*:\s*['"]([^'"\n]+)['"]/g;
        let m: RegExpExecArray | null;
        while ((m = pairRe.exec(body))) {
          const prefix = m[1];
          const val = m[2];
          const target = val.startsWith('/')
            ? vscode.Uri.joinPath(folder.uri, val.replace(/^\//, ''))
            : vscode.Uri.joinPath(folder.uri, val);
          entries.push({ prefix, target });
        }
      }
      // array style: alias: [{ find: '@', replacement: 'src' }]
      const arrRe = /\{\s*find\s*:\s*['"]([^'"\n]+)['"],\s*replacement\s*:\s*['"]([^'"\n]+)['"]\s*\}/g;
      let m2: RegExpExecArray | null;
      while ((m2 = arrRe.exec(text))) {
        const prefix = m2[1];
        const val = m2[2];
        const target = val.startsWith('/')
          ? vscode.Uri.joinPath(folder.uri, val.replace(/^\//, ''))
          : vscode.Uri.joinPath(folder.uri, val);
        entries.push({ prefix, target });
      }
    } catch { /* ignore errors reading vite config */ }
  }

  // webpack.config.(js|ts|cjs|mjs)
  for (const cfg of ['webpack.config.js', 'webpack.config.ts', 'webpack.config.cjs', 'webpack.config.mjs']) {
    try {
      const uri = vscode.Uri.joinPath(folder.uri, cfg);
      const raw = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(raw).toString('utf8');
      const block = /alias\s*:\s*\{([\s\S]*?)\}/m.exec(text);
      if (block) {
        const body = block[1];
        const pairRe = /['"]([^'"\n]+)['"]\s*:\s*['"]([^'"\n]+)['"]/g;
        let m: RegExpExecArray | null;
        while ((m = pairRe.exec(body))) {
          const prefix = m[1];
          const val = m[2];
          const target = val.startsWith('/')
            ? vscode.Uri.joinPath(folder.uri, val.replace(/^\//, ''))
            : vscode.Uri.joinPath(folder.uri, val);
          entries.push({ prefix, target });
        }
      }
    } catch { /* ignore errors reading webpack config */ }
  }

  // normalize ordering: longer prefixes first
  entries.sort((a, b) => b.prefix.length - a.prefix.length);
  aliasCache.set(key, entries);
  return entries;
}

export function applyAlias(raw: string, entries: AliasEntry[]): { base: vscode.Uri, rest: string } | undefined {
  for (const e of entries) {
    if (raw.startsWith(e.prefix)) {
      const rest = raw.slice(e.prefix.length).replace(/^\/?/, '');
      return { base: e.target, rest };
    }
  }
  return;
}
