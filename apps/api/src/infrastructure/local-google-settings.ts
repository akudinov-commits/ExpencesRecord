import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';

export async function saveLocalGoogleSettings(file: string, values: Record<string, string>): Promise<void> {
  const target = resolve(file);
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    if (basename(target) !== '.env') throw new Error();
    let existing = '';
    try { existing = await readFile(target, 'utf8'); }
    catch (error) { if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'ENOENT') throw error; }
    const settings = { ...parseEnv(existing), ...values };
    const encoded = new Map(Object.entries(values).map(([key, value]) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string' || /[\r\n\0"'\\]/.test(value)) throw new Error();
      return [key, `${key}="${value}"`] as const;
    }));
    const seen = new Set<string>();
    const assignment = /(^|\n)(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*(?:"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'|[^\r\n]*)[ \t]*(?:#[^\r\n]*)?(?=\r?\n|$)/g;
    let output = existing.replace(assignment, (match: string, prefix: string, key: string) => {
      const replacement = encoded.get(key); if (replacement === undefined) return match;
      if (seen.has(key)) return prefix;
      seen.add(key); return prefix + replacement;
    });
    if (output && !output.endsWith('\n')) output += '\n';
    for (const [key, line] of encoded) if (!seen.has(key)) output += line + '\n';
    const parsed = parseEnv(output);
    if (Object.keys(parsed).length !== Object.keys(settings).length || Object.entries(settings).some(([key, value]) => parsed[key] !== value)) throw new Error();
    await writeFile(temporary, output, { mode: 0o600, flag: 'wx' });
    await rename(temporary, target);
  } catch { throw new Error('Local Google settings unavailable'); }
  finally { await rm(temporary, { force: true }); }
}
