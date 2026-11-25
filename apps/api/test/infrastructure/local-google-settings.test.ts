import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { afterEach, expect, test } from 'vitest';
import { saveLocalGoogleSettings } from '../../src/infrastructure/local-google-settings.js';
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => {
  if (dirname(resolve(path)) !== resolve(tmpdir()) || !basename(path).startsWith('expences-google-settings-')) throw new Error('Unexpected test cleanup target');
  return rm(path, { recursive: true, force: true });
})); });
async function path() { const directory = await mkdtemp(join(tmpdir(), 'expences-google-settings-')); directories.push(directory); return join(directory, '.env'); }
test('writes Google configuration directly to the local secret file, with no output value', async () => {
  const file = await path();
  expect(await saveLocalGoogleSettings(file, { GOOGLE_ALLOWED_SUBJECT: 'synthetic-owner', GOOGLE_SHEETS_REFRESH_TOKEN: 'synthetic-refresh' })).toBeUndefined();
  expect(parseEnv(await readFile(file, 'utf8'))).toEqual({ GOOGLE_ALLOWED_SUBJECT: 'synthetic-owner', GOOGLE_SHEETS_REFRESH_TOKEN: 'synthetic-refresh' });
});
test('updates the grant without losing existing settings or cookie keys', async () => {
  const file = await path(); await writeFile(file, 'HOST=127.0.0.1\nAUTH_SESSION_KEY=existing-synthetic-key\nGOOGLE_SHEETS_REFRESH_TOKEN=old-synthetic\n');
  await saveLocalGoogleSettings(file, { GOOGLE_SHEETS_REFRESH_TOKEN: 'new-synthetic' });
  expect(parseEnv(await readFile(file, 'utf8'))).toEqual({ HOST: '127.0.0.1', AUTH_SESSION_KEY: 'existing-synthetic-key', GOOGLE_SHEETS_REFRESH_TOKEN: 'new-synthetic' });
});
test('refuses unexpected filenames or multiline injection without changing the file', async () => {
  const file = await path(); await writeFile(file, 'HOST=127.0.0.1\n');
  await expect(saveLocalGoogleSettings(file, { GOOGLE_SHEETS_REFRESH_TOKEN: 'synthetic\nINJECTED=value' })).rejects.toThrow('Local Google settings unavailable');
  expect(await readFile(file, 'utf8')).toBe('HOST=127.0.0.1\n');
  await expect(saveLocalGoogleSettings(file + '.ts', { GOOGLE_ALLOWED_SUBJECT: 'synthetic' })).rejects.toThrow('Local Google settings unavailable');
});
