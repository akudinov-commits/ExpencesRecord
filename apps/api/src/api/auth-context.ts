import type { AuthService } from '../application/auth.js';

export interface AuthHttpDependencies {
  service: AuthService;
  appOrigin: string;
  secureCookies: boolean;
}
