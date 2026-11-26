import { createExpenseOperations } from './expense-runtime.js';
import type { RegistrationDependencies } from '../application/expense-registration.js';
import { createMappingQuery } from './mapping-runtime.js';
import type { MappingDependencies } from './mapping-runtime.js';
import type { FastifyInstance } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import { createApp } from './create-app.js';
import { parseAuthConfiguration } from './auth-config.js';
import { AuthService } from '../application/auth.js';
import { GoogleIdentityAdapter } from '../infrastructure/google-identity.js';
import { secureSecrets, sessionCodec, systemClock, transactionCodec } from '../infrastructure/auth-crypto.js';

export function createConfiguredApp(environment: NodeJS.ProcessEnv = process.env, logger = true, mapping?: MappingDependencies, registration?: Partial<RegistrationDependencies>): FastifyInstance {
  const configuration = parseAuthConfiguration(environment);
  const redirectUri = `${configuration.appOrigin}/api/auth/callback`;
  const client = new OAuth2Client({ clientId: configuration.clientId, clientSecret: configuration.clientSecret, redirectUri, transporterOptions: { timeout: 10000, retry: false } });
  const service = new AuthService(configuration, {
    clock: systemClock, secrets: secureSecrets,
    identity: new GoogleIdentityAdapter(client, { clientId: configuration.clientId, redirectUri }, systemClock),
    sessions: sessionCodec(configuration.sessionKey, configuration.appOrigin),
    transactions: transactionCodec(configuration.flowKey, configuration.appOrigin),
  });
  return createApp({ logger }, { service, appOrigin: configuration.appOrigin, secureCookies: configuration.secureCookies }, createMappingQuery(environment, configuration, mapping), createExpenseOperations(environment, configuration, { ...(mapping?.reader ? { reader: mapping.reader } : {}), ...(mapping?.credentials ? { readCredentials: mapping.credentials } : {}), ...registration }));
}
