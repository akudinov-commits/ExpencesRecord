import type { AppSession } from '../application/ports/auth.js';
import type { AuthService } from '../application/auth.js';

export interface AuthHttpDependencies {
  service: AuthService;
  appOrigin: string;
  secureCookies: boolean;
}

declare module 'fastify' {
  interface FastifyRequest { verifiedSession: AppSession | null }
}
