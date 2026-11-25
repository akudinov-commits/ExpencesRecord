import { expect, test } from 'vitest';
import { parseGoogleClientRegistration, parseSheetsProbeConfiguration } from '../../src/bootstrap/google-setup-config.js';

const callback = 'http://localhost:5173/api/auth/callback';
function registration() { return { web: { client_id: 'client.apps.googleusercontent.com', client_secret: 'synthetic-client-secret', redirect_uris: [callback] } }; }
test('downloaded Google web client JSON must contain the exact registered local callback', () => {
  expect(parseGoogleClientRegistration(registration())).toEqual({ clientId: 'client.apps.googleusercontent.com', clientSecret: 'synthetic-client-secret', redirectUri: callback });
});
test.each([null, { installed: registration().web }, { web: {} }, { web: { ...registration().web, redirect_uris: ['http://localhost:3001/api/auth/callback'] } }, { web: { ...registration().web, client_id: 'not-a-client' } }])('rejects invalid or native client registration without exposing values', (value) => {
  expect(() => parseGoogleClientRegistration(value)).toThrow('Google web client registration is invalid');
});
test('read-only probe requires separate refresh and isolated-workbook settings', () => {
  expect(parseSheetsProbeConfiguration({ GOOGLE_SHEETS_REFRESH_TOKEN: 'synthetic-refresh', GOOGLE_TEST_SPREADSHEET_ID: 'isolated_test_workbook' })).toEqual({ refreshToken: 'synthetic-refresh', testSpreadsheetId: 'isolated_test_workbook' });
});
test.each([{}, { GOOGLE_SHEETS_REFRESH_TOKEN: 'synthetic-refresh' }, { GOOGLE_TEST_SPREADSHEET_ID: 'isolated_test_workbook' }, { GOOGLE_SHEETS_REFRESH_TOKEN: 'synthetic-refresh', GOOGLE_TEST_SPREADSHEET_ID: '../unsafe?query' }])('missing or malformed probe configuration fails explicitly', (value) => {
  expect(() => parseSheetsProbeConfiguration(value)).toThrow(/GOOGLE_(?:SHEETS_REFRESH_TOKEN|TEST_SPREADSHEET_ID)/);
});
