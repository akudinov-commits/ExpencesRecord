import { useEffect, useState } from 'react';
import { createAuthClient } from '../api/auth.js';
import type { AuthClient, SessionResult } from '../api/auth.js';

const defaultClient = createAuthClient();
type View = SessionResult | { state: 'loading' };
function callbackMessage(): string {
  switch (new URLSearchParams(window.location.search).get('auth')) {
    case 'denied': return 'This Google account does not have access.';
    case 'failed': return 'Sign-in was not completed. Try again.';
    case 'unavailable': return 'Google sign-in is temporarily unavailable. Try again.';
    default: return '';
  }
}

export default function App({ client = defaultClient }: { client?: AuthClient }) {
  const [view, setView] = useState<View>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState(callbackMessage);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    let active = true;
    void client.session().then((result) => { if (active) setView(result); });
    return () => { active = false; };
  }, [client, attempt]);

  async function logout() {
    if (view.state !== 'allowed' || signingOut) return;
    setSigningOut(true);
    const result = await client.logout(view.csrfToken);
    setSigningOut(false);
    if (result === 'failed') { setMessage('Could not sign out. Try again.'); return; }
    setMessage(result === 'expired' ? 'Your sign-in expired. Sign in again.' : '');
    setView({ state: 'signed-out' });
  }
  const alert = view.state === 'denied' ? 'This Google account does not have access.'
    : view.state === 'unavailable' ? 'Could not check your sign-in. Try again.' : message;

  return (
    <main className="shell">
      <section className="intro" aria-labelledby="app-title">
        <span className="brand-mark" aria-hidden="true">E</span>
        <h1 id="app-title">ExpencesRecord</h1>
        <p>Keep track of everyday spending.</p>
        <div className="auth-panel">
          {view.state === 'loading' ? <p role="status">Checking your sign-in…</p> : <>
            {alert && <p role="alert">{alert}</p>}
            {view.state === 'allowed' ? <>
              <p>You are signed in.</p>
              <button type="button" onClick={() => { void logout(); }} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
            </> : view.state === 'unavailable' ? <button type="button" onClick={() => { setView({ state: 'loading' }); setAttempt((value) => value + 1); }}>Try again</button>
              : <><p>Sign in with your Google account to continue.</p><a className="primary-action" href="/api/auth/login">Sign in with Google</a></>}
          </>}
        </div>
      </section>
    </main>
  );
}
