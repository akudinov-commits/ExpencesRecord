import type { FastifyInstance } from 'fastify';
import { afterEach, expect, test, vi } from 'vitest';
import { createApp } from '../../src/bootstrap/create-app.js';
import { MappingError } from '../../src/application/expense-context.js';
import type { ExpenseContextQuery, MappingFailure } from '../../src/application/expense-context.js';
import { authFixture } from '../support/auth.js';
const opened: FastifyInstance[] = [];
afterEach(async () => { await Promise.all(opened.splice(0).map(app => app.close())); });
function fixture() {
  const auth = authFixture();
  const query = { execute: vi.fn<ExpenseContextQuery['execute']>().mockResolvedValue({ date: '2099-01-15', baseCurrency: 'KZT',
    categories: [{ id: 'groceries', label: 'Synthetic groceries', column: 3 }],
    currencies: [{ code: 'KZT', rate: null }, { code: 'AED', rate: { sheetTitle: 'private-sheet-marker', row: 39, column: 6, operation: 'multiply' } }],
    target: { spreadsheetId: 'private-workbook-marker', sheetTitle: 'private-sheet-marker', row: 16 } }) };
  const app = createApp({ logger: false }, { service: auth.service, appOrigin: 'http://localhost:5173', secureCookies: false }, query);
  opened.push(app); return { app, query, ...auth };
}
const browser = { host: 'localhost:5173', cookie: 'expences_session_dev=synthetic-session' };
const url = '/api/expense-context?date=2099-01-15';
test('context exposes only the explicitly requested monthly aggregate DTO, without mapping addresses',async()=>{
 const f=fixture();const value=await f.query.execute(f.session.subject,'2099-01-15');
 f.query.execute.mockResolvedValue(Object.assign(value,{monthlyTotals:{groceries:{period:'2099-01',status:'available',amount:12500,currency:'KZT'}}}));
 const response=await f.app.inject({url,headers:browser});
 expect(response.json().categories[0].monthlyTotal).toEqual({period:'2099-01',status:'available',amount:12500,currency:'KZT'});
 expect(response.body).not.toMatch(/private-|sheetTitle|spreadsheetId|row|column|rate/);
});
test('the new context endpoint requires authentication by default', async () => {
  const f = fixture(); const response = await f.app.inject(url);
  expect(response.statusCode).toBe(401); expect(response.json()).toEqual({ error: { code: 'unauthenticated' } }); expect(f.query.execute).not.toHaveBeenCalled();
});
test.each(['invalid', 'expired', 'wrong-owner'])('context denies %s sessions before application query', async state => {
  const f = fixture();
  if (state === 'invalid') f.ports.sessions.open.mockResolvedValue(null);
  if (state === 'expired') f.session.expiresAt = 1;
  if (state === 'wrong-owner') f.session.subject = 'different-owner';
  expect((await f.app.inject({ url, headers: browser })).statusCode).toBe(state === 'wrong-owner' ? 403 : 401);
  expect(f.query.execute).not.toHaveBeenCalled();
});
test('HTTP delegates the verified subject and returns only the agreed wire DTO', async () => {
  const f = fixture(); const response = await f.app.inject({ url, headers: browser });
  expect(response.statusCode).toBe(200); expect(f.query.execute).toHaveBeenCalledExactlyOnceWith(f.session.subject, '2099-01-15');
  expect(response.json()).toEqual({ date: '2099-01-15', baseCurrency: 'KZT', categories: [{ id: 'groceries', label: 'Synthetic groceries' }], currencies: [{ code: 'KZT' }, { code: 'AED' }] });
  expect(response.body).not.toMatch(/private-|sheetTitle|spreadsheetId|row|column|rate/);
  expect(response.headers['cache-control']).toBe('no-store');
});
test.each(['/api/expense-context', '/api/expense-context?date=bad', '/api/expense-context?date=2099-01-15&date=2099-01-16', `${url}&spreadsheetId=private-marker`, `${url}&range=A1:Z100`])('invalid transport %s is rejected without passing client-selected resources', async url => {
  const f = fixture(); const response = await f.app.inject({ url, headers: browser });
  expect(response.statusCode).toBe(400); expect(response.json()).toEqual({ error: { code: 'invalid_request' } }); expect(response.headers['cache-control']).toBe('no-store');
  expect(f.query.execute).not.toHaveBeenCalled(); expect(response.body).not.toContain('private-marker');
});
test.each([['invalid_date', 400], ['year_not_configured', 404], ['month_not_configured', 404], ['mapping_invalid', 409], ['mapping_unavailable', 503], ['reconnect_required', 503], ['sheets_unavailable', 503], ['access_denied', 403]] as const)('application %s is mapped to HTTP %s without cell/provider details', async (code: MappingFailure, status) => {
  const f = fixture(); f.query.execute.mockRejectedValue(new MappingError(code));
  const response = await f.app.inject({ url, headers: browser }); expect(response.statusCode).toBe(status); expect(response.json()).toEqual({ error: { code } }); expect(response.headers['cache-control']).toBe('no-store');
});
test.each(['HEAD', 'POST', 'PUT'] as const)('method %s cannot create another public context route', async method => {
  const f = fixture(); expect((await f.app.inject({ method, url, headers: browser })).statusCode).toBe(404); expect(f.query.execute).not.toHaveBeenCalled();
});
test('unexpected provider/implementation details never enter the response', async () => {
  const f = fixture(); f.query.execute.mockRejectedValue(new Error('private-provider-financial-marker'));
  const response = await f.app.inject({ url, headers: browser }); expect(response.statusCode).toBe(500); expect(response.body).not.toContain('private-provider-financial-marker'); expect(response.headers['cache-control']).toBe('no-store');
});

test('context projects the daily recorded/empty/unavailable DTO and strips internal extras',async()=>{
 const f=fixture();const value=await f.query.execute(f.session.subject,'2099-01-15');
 f.query.execute.mockResolvedValue(Object.assign(value,{recordedExpenses:{groceries:{date:value.date,status:'recorded',amount:0,currency:'KZT',formula:'=1-1',spreadsheetId:'private-marker',column:3}}}));
 const response=await f.app.inject({url,headers:browser});expect(response.json().categories[0].recordedExpense).toEqual({date:value.date,status:'recorded',amount:0,currency:'KZT',formula:'=1-1'});expect(response.body).not.toContain('private-');
 for(const status of ['empty','unavailable']){f.query.execute.mockResolvedValue(Object.assign(value,{recordedExpenses:{groceries:{date:value.date,status}}}));expect((await f.app.inject({url,headers:browser})).json().categories[0].recordedExpense).toEqual({date:value.date,status});}
});
