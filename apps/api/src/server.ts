import { createConfiguredApp } from './bootstrap/runtime.js';
import { parseServerConfig } from './bootstrap/config.js';

const config = parseServerConfig(process.env);
const app = createConfiguredApp();
await app.listen(config);
