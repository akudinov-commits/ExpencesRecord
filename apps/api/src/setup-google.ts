import { runGoogleSetup } from './bootstrap/google-setup.js';
import { SheetsAccessError } from './application/ports/sheets-access.js';
import { GoogleSetupFailed } from './application/ports/google-setup.js';

const mode = process.argv[2];
if (!['owner', 'sheets', 'probe', 'sheets-write', 'probe-write'].includes(mode ?? '')) {
  console.error('Usage: setup-google owner|sheets|probe|sheets-write|probe-write');
  process.exitCode = 1;
} else {
  try {
    await runGoogleSetup(mode as 'owner' | 'sheets' | 'sheets-write' | 'probe' | 'probe-write');
  } catch (error) {
    console.error(error instanceof GoogleSetupFailed ? `Google setup failed: ${error.reason}` : error instanceof SheetsAccessError ? `Google setup failed: ${error.code}` : 'Google setup failed. Check docs/google-setup.md, local configuration, consent and connectivity.');
    process.exitCode = 1;
  }
}
