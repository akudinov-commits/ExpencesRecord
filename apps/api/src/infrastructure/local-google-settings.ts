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
    const lines = Object.entries(settings).map(([key, value]) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string' || /[\r\n\0"'\\]/.test(value)) throw new Error();
      return `${key}="${value}"`;
    });
    await writeFile(temporary, lines.join('\n') + '\n', { mode: 0o600, flag: 'wx' });
    await rename(temporary, target);
  } catch { throw new Error('Local Google settings unavailable'); }
  finally { await rm(temporary, { force: true }); }
}
