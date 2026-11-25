export type SessionResult = { state: 'allowed'; csrfToken: string } | { state: 'signed-out' | 'denied' | 'unavailable' };
export type LogoutResult = 'signed-out' | 'expired' | 'failed';
export interface AuthClient {
  session(): Promise<SessionResult>;
  logout(csrfToken: string): Promise<LogoutResult>;
}
export function createAuthClient(request: typeof fetch = fetch): AuthClient {
  return {
    async session() {
      try {
        const response = await request('/api/auth/session', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
        if (response.status === 401) return { state: 'signed-out' };
        if (response.status === 403) return { state: 'denied' };
        if (response.status !== 200) return { state: 'unavailable' };
        const value: unknown = await response.json();
        if (typeof value !== 'object' || value === null || !('authenticated' in value) || value.authenticated !== true
          || !('csrfToken' in value) || typeof value.csrfToken !== 'string' || !value.csrfToken) return { state: 'unavailable' };
        return { state: 'allowed', csrfToken: value.csrfToken };
      } catch { return { state: 'unavailable' }; }
    },
    async logout(csrfToken) {
      try {
        const response = await request('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', headers: { 'X-CSRF-Token': csrfToken } });
        if (response.status === 204) return 'signed-out';
        return response.status === 401 ? 'expired' : 'failed';
      } catch { return 'failed'; }
    },
  };
}
