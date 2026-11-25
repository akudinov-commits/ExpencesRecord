import type { AuthConfiguration } from '../application/ports/auth.js';

export interface AuthRuntimeConfiguration extends AuthConfiguration {
  appOrigin: string;
  clientId: string;
  clientSecret: string;
  sessionKey: Uint8Array;
  flowKey: Uint8Array;
  secureCookies: boolean;
}

export function parseAuthConfiguration(environment: NodeJS.ProcessEnv): AuthRuntimeConfiguration {
  const required = (name: string) => {
    const value = environment[name]?.trim();
    if (!value) throw new Error(`${name} is required`);
    return value;
  };
  const appOrigin = required('APP_ORIGIN');
  let origin: URL;
  try { origin = new URL(appOrigin); } catch { throw new Error('APP_ORIGIN must be an exact HTTPS origin or http://localhost:5173'); }
  if (origin.origin !== appOrigin || (origin.protocol !== 'https:' && appOrigin !== 'http://localhost:5173')) {
    throw new Error('APP_ORIGIN must be an exact HTTPS origin or http://localhost:5173');
  }
  const clientId = required('GOOGLE_CLIENT_ID');
  if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) throw new Error('GOOGLE_CLIENT_ID is invalid');
  const clientSecret = required('GOOGLE_CLIENT_SECRET');
  const allowedSubject = required('GOOGLE_ALLOWED_SUBJECT');
  if (!/^[\x21-\x7e]{1,255}$/.test(allowedSubject)) throw new Error('GOOGLE_ALLOWED_SUBJECT is invalid');
  const sessionVersion = required('AUTH_SESSION_VERSION');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(sessionVersion)) throw new Error('AUTH_SESSION_VERSION is invalid');
  const key = (name: string) => {
    const encoded = required(name);
    const bytes = Buffer.from(encoded, 'base64url');
    if (bytes.length !== 32 || bytes.toString('base64url') !== encoded) throw new Error(`${name} must be a 32-byte base64url key`);
    return bytes;
  };
  const sessionKey = key('AUTH_SESSION_KEY');
  const flowKey = key('AUTH_FLOW_KEY');
  if (sessionKey.equals(flowKey)) throw new Error('AUTH_SESSION_KEY and AUTH_FLOW_KEY must be independent');
  return { appOrigin, clientId, clientSecret, allowedSubject, sessionVersion, sessionKey, flowKey, secureCookies: origin.protocol === 'https:' };
}
