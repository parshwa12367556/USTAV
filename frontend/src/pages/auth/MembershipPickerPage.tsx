import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../features/auth/api/authApi';
import { useAuth } from '../../hooks/useAuth';
import { tokenStorage } from '../../services/storage/tokenStorage';

function destinationFor(role: string) {
  if (role === 'super_admin') return '/admin';
  if (role === 'vendor_owner' || role === 'vendor_staff') return '/vendor';
  if (role === 'wedding_planner') return '/planner';
  return '/dashboard';
}

export function MembershipPickerPage() {
  const { memberships, setSession } = useAuth();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const choose = async (membershipId: string) => {
    setBusyId(membershipId);
    setError('');
    try {
      const session = await authApi.switchMembership(membershipId, tokenStorage.getRefresh());
      setSession(session);
      navigate(destinationFor(session.activeRole ?? ''), { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open this workspace.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR UTSAV WORKSPACES</span>
          <h2>Where would you like to go?</h2>
          <p>Choose the account or workspace you want to use right now.</p>
          <div className="auth-form">
            {memberships.map((membership) => (
              <button
                className="button button--primary"
                key={membership.id}
                type="button"
                disabled={Boolean(busyId)}
                onClick={() => void choose(membership.id)}
              >
                {busyId === membership.id ? 'Opening…' : `${membership.name} · ${membership.role.replaceAll('_', ' ')}`}
              </button>
            ))}
            {error && <p className="form-error" role="alert">{error}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
