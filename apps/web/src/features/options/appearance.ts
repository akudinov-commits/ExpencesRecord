export type Appearance = 'light' | 'dark';
export interface AppearanceSetting { read(): Appearance; save(value: Appearance): boolean }
export function createAppearanceSetting(storage: Pick<Storage, 'getItem' | 'setItem'> | null, prefersDark: () => boolean): AppearanceSetting {
  return {
    read() { try { const stored = storage?.getItem('expences-record.appearance'); if (stored === 'light' || stored === 'dark') return stored; } catch { /* Storage can be disabled by the browser. */ } return prefersDark() ? 'dark' : 'light'; },
    save(value) { try { if (!storage || (value !== 'light' && value !== 'dark')) return false; storage.setItem('expences-record.appearance', value); return true; } catch { return false; } },
  };
}
export function browserAppearanceSetting(): AppearanceSetting {
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* An opaque/private browser may deny the getter itself. */ }
  return createAppearanceSetting(storage, () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
}
