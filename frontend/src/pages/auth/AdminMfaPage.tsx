import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../features/auth/api/authApi';
import { useAuth } from '../../hooks/useAuth';
import { tokenStorage } from '../../services/storage/tokenStorage';

type SetupDetails = {
  secret: string;
  otpauthUri: string;
  qrCodeSvg: string;
};

export function AdminMfaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [setupRequired] = useState(
    Boolean(location.state && typeof location.state === 'object' && 'setupRequired' in location.state &&
      location.state.setupRequired),
  );
  const [setup, setSetup] = useState<SetupDetails | null>(null);
  const [code, setCode] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!tokenStorage.get()) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="auth-form-wrap">
            <h1>Sign in again</h1>
            <p>This administrator verification step has expired.</p>
            <button className="button button--primary" onClick={() => navigate('/login', { replace: true })}>
              Return to sign in
            </button>
          </div>
        </section>
      </main>
    );
  }

  const startSetup = async () => {
    setBusy(true);
    setError('');
    try {
      setSetup(await authApi.setupAdminMfa());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start two-factor setup.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await authApi.verifyAdminMfa(code);
      setRecoveryCodes(session.recoveryCodes ?? []);
      setSession(session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The authenticator code could not be verified.');
    } finally {
      setBusy(false);
    }
  };

  if (recoveryCodes.length) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="auth-form-wrap">
            <h1>Save your recovery codes</h1>
            <p>These codes are shown once. Keep them somewhere private; each can be used one time.</p>
            <ul>{recoveryCodes.map((value) => <li key={value}><code>{value}</code></li>)}</ul>
            <button className="button button--primary" onClick={() => navigate('/admin/dashboard', { replace: true })}>
              I have saved them
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">ADMINISTRATOR SECURITY</span>
          <h1>{setupRequired ? 'Set up two-factor authentication' : 'Verify your identity'}</h1>
          {setupRequired && !setup ? (
            <>
              <p>Administrators must enroll an authenticator before opening the platform console.</p>
              <button className="button button--primary" disabled={busy} onClick={() => void startSetup()}>
                {busy ? 'Preparing…' : 'Set up authenticator'}
              </button>
            </>
          ) : (
            <>
              {setup && (
                <div>
                  <p>Scan the QR code in your authenticator app, or enter this setup key manually:</p>
                  <img alt="Authenticator setup QR code" src={`data:image/svg+xml;base64,${setup.qrCodeSvg}`} />
                  <p><code>{setup.secret}</code></p>
                </div>
              )}
              <form className="auth-form" onSubmit={(event) => void verify(event)}>
                <label htmlFor="admin-totp-code">{recoveryMode ? 'Ten-character recovery code' : 'Six-digit authenticator code'}</label>
                <input
                  id="admin-totp-code"
                  inputMode={recoveryMode ? 'text' : 'numeric'}
                  autoComplete={recoveryMode ? 'off' : 'one-time-code'}
                  pattern={recoveryMode ? '[A-Fa-f0-9]{10}' : '[0-9]{6}'}
                  maxLength={recoveryMode ? 10 : 6}
                  required
                  value={code}
                  onChange={(event) => setCode(recoveryMode ? event.target.value.toUpperCase() : event.target.value)}
                />
                <button className="button button--primary" disabled={busy}>
                  {busy ? 'Verifying…' : 'Verify and continue'}
                </button>
                {!setup && (
                  <button
                    type="button"
                    className="button button--quiet"
                    onClick={() => {
                      setRecoveryMode((value) => !value);
                      setCode('');
                    }}
                  >
                    {recoveryMode ? 'Use authenticator code' : 'Use a recovery code'}
                  </button>
                )}
              </form>
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </section>
    </main>
  );
}
