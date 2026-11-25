import { expect, test, vi } from 'vitest';
import { CheckSheetsAccess } from '../../src/application/check-sheets-access.js';
import { SheetsAccessError } from '../../src/application/ports/sheets-access.js';

function fixture() {
  const credentials = { get: vi.fn(async () => ({ accessToken: 'synthetic-access', subject: 'configured-owner' })) };
  const probe = { check: vi.fn<(id: string, token: string) => Promise<void>>().mockResolvedValue() };
  const useCase = new CheckSheetsAccess({ allowedSubject: 'configured-owner', testSpreadsheetId: 'isolated-test-workbook' }, credentials, probe);
  return { credentials, probe, useCase };
}
test('probes only the configured isolated workbook using credentials for the authorized subject', async () => {
  const { useCase, credentials, probe } = fixture();
  expect(await useCase.execute()).toBeUndefined();
  expect(credentials.get).toHaveBeenCalledOnce();
  expect(probe.check).toHaveBeenCalledExactlyOnceWith('isolated-test-workbook', 'synthetic-access');
});
test('another verified grant cannot access any workbook', async () => {
  const { useCase, credentials, probe } = fixture();
  credentials.get.mockResolvedValue({ accessToken: 'other-token', subject: 'another-user' });
  await expect(useCase.execute()).rejects.toMatchObject({ code: 'access_denied' });
  expect(probe.check).not.toHaveBeenCalled();
});
test('revocation remains reconnect-required and never calls the workbook probe', async () => {
  const { useCase, credentials, probe } = fixture();
  credentials.get.mockRejectedValue(new SheetsAccessError('reconnect_required'));
  await expect(useCase.execute()).rejects.toMatchObject({ code: 'reconnect_required' });
  expect(probe.check).not.toHaveBeenCalled();
});
test.each([{ allowedSubject: '', testSpreadsheetId: 'isolated' }, { allowedSubject: 'owner', testSpreadsheetId: '' }])('required owner and test resource cannot default silently', (configuration) => {
  expect(() => new CheckSheetsAccess(configuration, fixture().credentials, fixture().probe)).toThrow('Sheets access configuration is required');
});
