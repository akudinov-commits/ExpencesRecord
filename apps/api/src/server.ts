import { createApp } from './bootstrap/create-app.js';
import { parseServerConfig } from './bootstrap/config.js';

const config = parseServerConfig(process.env);
const app = createApp({ logger: true });
await app.listen(config);
