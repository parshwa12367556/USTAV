import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  family: 'Family workspace',
  vendor: 'Vendor workspace',
  planner: 'Wedding planner',
  vendor_staff: 'Vendor team member',
  vendor_owner: 'Vendor owner',
  family_owner: 'Family owner',
  family_member: 'Family member',
  wedding_planner: 'Wedding planner',
  super_admin: 'Platform administrator',
  owner: 'Family owner',
  member: 'Family member',
};

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
}

export function UserMenu() {
  const { user, activeRole, memberships, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const name = user?.name?.trim() || 'Your account';
  const role = activeRole ?? user?.role ?? '';

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const logout = async () => {
    if (loggingOut || !window.confirm('Are you sure you want to log out?')) return;
    setOpen(false);
    setLoggingOut(true);
    let notice = 'You have been logged out.';
    try {
      await signOut();
    } catch (error) {
      console.error('Server-side logout could not be confirmed.', error);
      notice = 'You are signed out on this device, but server-side session revocation could not be confirmed. Please sign in again when online.';
    }
    navigate('/login', { replace: true, state: { notice } });
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className={`user-menu-trigger${open ? ' is-open' : ''}`}
        type="button"
        aria-label={`Account menu for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="user-menu-avatar">{initials(name)}</span>
        <span className="user-menu-identity"><strong>{name}</strong><small>{roleLabels[role] ?? role}</small></span>
        <span className="user-menu-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="user-menu-popover" role="menu" aria-label="Account options">
          <div className="user-menu-summary">
            <span className="user-menu-avatar">{initials(name)}</span>
              <span><strong>{name}</strong><small>{user?.email}</small><small className="user-menu-role">{roleLabels[role] ?? role}</small></span>
          </div>
          <Link role="menuitem" to="/settings" onClick={() => setOpen(false)}>My profile &amp; settings</Link>
          {memberships.length > 1 && <Link role="menuitem" to="/choose-workspace" onClick={() => setOpen(false)}>Switch workspace</Link>}
          <button role="menuitem" type="button" onClick={() => void logout()} disabled={loggingOut}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}
