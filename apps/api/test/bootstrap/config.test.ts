import { describe, expect, test } from 'vitest';
import { parseServerConfig } from '../../src/bootstrap/config.js';

describe('local server configuration', () => {
  test('loads explicit host and integer port', () => {
    expect(parseServerConfig({ HOST: '127.0.0.1', PORT: '3001' })).toEqual({ host: '127.0.0.1', port: 3001 });
  });

  test.each([undefined, '', '0', '-1', '65536', 'abc', '12abc', '3.5'])('rejects invalid PORT %s', (port) => {
    const environment: NodeJS.ProcessEnv = { HOST: '127.0.0.1' };
    if (port !== undefined) environment.PORT = port;
    expect(() => parseServerConfig(environment)).toThrow('PORT must be an integer from 1 to 65535');
  });

  test.each([undefined, '', '   '])('requires an explicit HOST (%s)', (host) => {
    const environment: NodeJS.ProcessEnv = { PORT: '3001' };
    if (host !== undefined) environment.HOST = host;
    expect(() => parseServerConfig(environment)).toThrow('HOST is required');
  });
});
