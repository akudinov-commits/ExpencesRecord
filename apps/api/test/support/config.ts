export const authEnvironment = {
  APP_ORIGIN: 'https://auth.example.test', GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'synthetic-client-secret',
  GOOGLE_ALLOWED_SUBJECT: 'synthetic-owner-subject', AUTH_SESSION_VERSION: 'version-1',
  AUTH_SESSION_KEY: Buffer.alloc(32, 1).toString('base64url'), AUTH_FLOW_KEY: Buffer.alloc(32, 2).toString('base64url'),
};
