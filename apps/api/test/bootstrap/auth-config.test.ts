import { expect, test } from 'vitest';
import { parseAuthConfiguration } from '../../src/bootstrap/auth-config.js';

const environment = {
  APP_ORIGIN: 'https://auth.example.test', GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'synthetic-client-secret',
  GOOGLE_ALLOWED_SUBJECT: 'synthetic-owner-subject', AUTH_SESSION_VERSION: 'version-1',
  AUTH_SESSION_KEY: Buffer.alloc(32, 1).toString('base64url'), AUTH_FLOW_KEY: Buffer.alloc(32, 2).toString('base64url'),
};

test('parses only required authentication configuration without a Sheet identifier', () => {
  const config = parseAuthConfiguration(environment);
  expect(config).toMatchObject({ appOrigin: environment.APP_ORIGIN, allowedSubject: environment.GOOGLE_ALLOWED_SUBJECT, clientId: environment.GOOGLE_CLIENT_ID, sessionVersion: 'version-1', secureCookies: true });
  expect(config.sessionKey).toHaveLength(32);
  expect(config.flowKey).toHaveLength(32);
});

test.each(Object.keys(environment))('missing %s fails without revealing its value', (key) => {
  const missing: NodeJS.ProcessEnv = { ...environment };
  delete missing[key];
  expect(() => parseAuthConfiguration(missing)).toThrow(key);
});

test('only the exact local HTTP origin is eligible for development cookies', () => {
  expect(parseAuthConfiguration({ ...environment, APP_ORIGIN: 'http://localhost:5173' }).secureCookies).toBe(false);
});

test.each(['http://external.example', 'http://127.0.0.1:5173', 'https://auth.example.test/path', 'https://user:password@auth.example.test', 'https://auth.example.test?query=1', 'not-a-url'])('rejects unsafe or ambiguous application origin %s', (origin) => {
  expect(() => parseAuthConfiguration({ ...environment, APP_ORIGIN: origin })).toThrow('APP_ORIGIN');
});

test.each(['AUTH_SESSION_KEY', 'AUTH_FLOW_KEY'] as const)('rejects malformed %s without echoing the key', (key) => {
  expect(() => parseAuthConfiguration({ ...environment, [key]: 'synthetic-invalid-secret' })).toThrow(key);
});

test('does not reuse one encryption key for session and login flow', () => {
  expect(() => parseAuthConfiguration({ ...environment, AUTH_FLOW_KEY: environment.AUTH_SESSION_KEY })).toThrow('independent');
});

test('rejects invalid subject and session version configuration', () => {
  expect(() => parseAuthConfiguration({ ...environment, GOOGLE_ALLOWED_SUBJECT: 'contains space' })).toThrow('GOOGLE_ALLOWED_SUBJECT');
  expect(() => parseAuthConfiguration({ ...environment, AUTH_SESSION_VERSION: 'bad\nversion' })).toThrow('AUTH_SESSION_VERSION');
});
