import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { workspaceApi } from '../../features/workspace/api/workspaceApi';
import { vendorStaffApi } from '../../features/vendors/api/vendorStaffApi';

function destinationFor(role: string) {
  if (role === 'vendor_owner' || role === 'vendor_staff') return '/vendor';
  if (role === 'wedding_planner') return '/planner';
  if (role === 'super_admin') return '/admin';
  return '/dashboard';
}

export function InvitationAcceptancePage() {
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, setSession } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const token = searchParams.get('token') ?? '';
  const kind = pathname.startsWith('/vendor/') ? 'vendor' : 'workspace';

  const accept = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This invitation link is missing its secure token.');
      return;
    }
    if (!isAuthenticated && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const account = isAuthenticated ? undefined : { name: name.trim(), password };
      const result = kind === 'vendor'
        ? await vendorStaffApi.accept(token, account)
        : await workspaceApi.acceptInvitation(token, account);
      setSession(result.session);
      navigate((result.session.memberships?.length ?? 0) > 1
        ? '/choose-workspace'
        : destinationFor(result.session.activeRole ?? ''), { replace: true });
    } catch (cause) {
      if (axios.isAxiosError<{ message?: string; detail?: string }>(cause)) {
        setError(cause.response?.data?.detail ?? cause.response?.data?.message ?? 'This invitation could not be accepted.');
      } else {
        setError(cause instanceof Error ? cause.message : 'This invitation could not be accepted.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">YOU’RE INVITED</span>
          <h2>{kind === 'vendor' ? 'Join the vendor team.' : 'Join the family workspace.'}</h2>
          <p>Accept this email-bound invitation to continue to your Utsav workspace.</p>
          <form className="auth-form" onSubmit={(event) => void accept(event)}>
            {!isAuthenticated && <>
              <label>Your name<input name="name" required value={name} onChange={(event) => setName(event.target.value)} minLength={2} /></label>
              <label>Create a password<input name="password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} /></label>
              <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} /></label>
            </>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="button button--primary" disabled={busy}>
              {busy ? 'Accepting…' : 'Accept invitation →'}
            </button>
          </form>
          {!isAuthenticated && (
            <p className="auth-switch">
              Already have an account? <Link to="/login" state={{ from: { pathname, search } }}>Sign in to accept</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
