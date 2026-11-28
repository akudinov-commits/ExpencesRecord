import { expect, test, vi } from 'vitest';
import { createConfiguredApp } from '../../src/bootstrap/runtime.js';
import { sessionCodec } from '../../src/infrastructure/auth-crypto.js';
import { parseAuthConfiguration } from '../../src/bootstrap/auth-config.js';
import { authEnvironment } from '../support/config.js';
import { mappingEnvironment } from '../support/mapping.js';
import type { SheetCell, SheetReader } from '../../src/application/ports/workbook.js';
async function cookie() {
  const config = parseAuthConfiguration(authEnvironment); const now = Math.floor(Date.now() / 1000);
  return `__Host-expences_session=${await sessionCodec(config.sessionKey, config.appOrigin).seal({ subject: config.allowedSubject, version: config.sessionVersion, csrf: 'synthetic-csrf', issuedAt: now, expiresAt: now + 604800 })}`;
}
test.each([undefined, '{private-invalid-json'])('unconfigured/invalid mapping %s gives explicit context unavailability while auth and health keep working', async mapping => {
  const app = createConfiguredApp({ ...authEnvironment, ...(mapping === undefined ? {} : { EXPENSE_WORKBOOKS_JSON: mapping }) }, false);
  try {
    const response = await app.inject({ url: '/api/expense-context?date=2099-01-15', headers: { cookie: await cookie() } });
    expect(response.statusCode).toBe(503); expect(response.json()).toEqual({ error: { code: 'mapping_unavailable' } });
    expect((await app.inject('/api/health')).statusCode).toBe(200);
    expect((await app.inject({ url: '/api/auth/session', headers: { cookie: await cookie() } })).statusCode).toBe(200);
    expect((await app.inject({ url: '/api/auth/login', headers: { host: 'auth.example.test' } })).statusCode).toBe(303);
  } finally { await app.close(); }
});
test('configured mapping without its separate Sheets grant fails as reconnect-required rather than becoming public or breaking login', async () => {
  const app = createConfiguredApp({ ...authEnvironment, ...mappingEnvironment() }, false);
  try {
    expect((await app.inject('/api/expense-context?date=2099-01-15')).statusCode).toBe(401);
    const response = await app.inject({ url: '/api/expense-context?date=2099-01-15', headers: { cookie: await cookie() } });
    expect(response.statusCode).toBe(503); expect(response.json()).toEqual({ error: { code: 'reconnect_required' } });
  } finally { await app.close(); }
});
test('portable composition connects real application mapping through injected inward I/O ports', async () => {
  const cells: SheetCell[] = [{ row: 1, column: 3, value: 'Synthetic groceries' }, { row: 16, column: 1, value: (Date.UTC(2099, 0, 15) - Date.UTC(1899, 11, 30)) / 86400000 }, { row: 39, column: 6, value: 7 }];
  const credentials = { get: vi.fn(async () => ({ subject: authEnvironment.GOOGLE_ALLOWED_SUBJECT, accessToken: 'synthetic-access' })) };
  const reader = { listSheets: vi.fn<SheetReader['listSheets']>().mockResolvedValue([{ title: 'Synthetic January', rowCount: 65, columnCount: 30 }]), readCells: vi.fn<SheetReader['readCells']>().mockImplementation(async (_id,_title,bounds) => cells.filter(cell => cell.row >= bounds.startRow && cell.row <= bounds.endRow && cell.column >= bounds.startColumn && cell.column <= bounds.endColumn)) };
  const app = createConfiguredApp({ ...authEnvironment, ...mappingEnvironment() }, false, { credentials, reader });
  try {
    const response = await app.inject({ url: '/api/expense-context?date=2099-01-15', headers: { cookie: await cookie() } });
    expect(response.statusCode).toBe(200); expect(response.json()).toEqual({ date: '2099-01-15', baseCurrency: 'KZT', categories: [{ id: 'groceries', label: 'Synthetic groceries', recordedExpense: { date: '2099-01-15', status: 'empty' } }], currencies: [{ code: 'KZT' }, { code: 'AED' }] });
    expect(credentials.get).toHaveBeenCalledTimes(2); expect(reader.readCells).toHaveBeenCalledTimes(2);
    expect(reader.readCells.mock.calls[1]![2]).toEqual({ startRow: 16, endRow: 16, startColumn: 3, endColumn: 3 });
  } finally { await app.close(); }
});
