import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { EventRecord } from '../types/workspace.types';
import { initialEvents } from '../data/workspaceData';
import { eventsApi } from '../features/events/api/eventsApi';
import type { Event } from '../types/event.types';
import { useAuth } from '../hooks/useAuth';
import { UserMenu } from '../components/common/UserMenu';

function toEventRecord(event: Event): EventRecord {
  const status = event.status === 'completed' ? 'Completed'
    : event.status === 'confirmed' ? 'Confirmed'
      : event.status === 'cancelled' ? 'Cancelled' : 'Planning';
  return {
    id: event.id,
    name: event.name,
    type: event.type,
    date: event.date,
    location: event.location ?? event.venue ?? '',
    guests: event.guestCount,
    budget: event.budget ?? 0,
    spent: 0,
    status,
    initials: event.name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase(),
    accent: 'rose',
  };
}

type IconName =
  | 'grid'
  | 'calendar'
  | 'users'
  | 'mail'
  | 'store'
  | 'landmark'
  | 'wallet'
  | 'settings'
  | 'search'
  | 'bell'
  | 'plus'
  | 'chevron'
  | 'arrow'
  | 'close'
  | 'sparkle'
  | 'menu';

function getInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    store: <><path d="M3 10h18l-1.6-6H4.6L3 10Z" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    landmark: <><path d="m3 9 9-6 9 6M4 10h16M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18M2 18h20" /></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M16 14h.01" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.2 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.2a7 7 0 0 1-.1 1.9Z" transform="translate(-1 -2)" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3ZM19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const navigation = [
  { label: 'Overview', path: '/', icon: 'grid' as const },
  { label: 'My events', path: '/events', icon: 'calendar' as const },
  { label: 'Plan an event', path: '/events/create', icon: 'plus' as const },
  { label: 'Functions', path: '/functions/main', icon: 'sparkle' as const },
  { label: 'Guest list', path: '/guests', icon: 'users' as const },
  { label: 'Guest groups', path: '/guest-groups', icon: 'users' as const },
  { label: 'RSVPs', path: '/rsvp', icon: 'mail' as const },
  { label: 'Invitations', path: '/invitations', icon: 'mail' as const },
  { label: 'Invitation editor', path: '/invitation-editor', icon: 'sparkle' as const },
  { label: 'Find vendors', path: '/vendors', icon: 'store' as const },
  { label: 'Venues', path: '/venues', icon: 'landmark' as const },
  { label: 'Catering', path: '/catering', icon: 'store' as const },
  { label: 'Decor & flowers', path: '/decoration', icon: 'sparkle' as const },
  { label: 'Event planners', path: '/event-management', icon: 'calendar' as const },
  { label: 'Other services', path: '/other-services', icon: 'grid' as const },
  { label: 'Quotations', path: '/quotations', icon: 'mail' as const },
  { label: 'Budget', path: '/budget', icon: 'wallet' as const },
  { label: 'Bookings', path: '/bookings', icon: 'calendar' as const },
  { label: 'Payments', path: '/payments', icon: 'wallet' as const },
  { label: 'Family members', path: '/members', icon: 'users' as const },
  { label: 'Notifications', path: '/notifications', icon: 'bell' as const },
  { label: 'Family settings', path: '/family-settings', icon: 'settings' as const },
];

const vendorNavigation = [
  { label: 'Studio overview', path: '/vendor', icon: 'grid' as const },
  { label: 'Public profile', path: '/vendor/profile', icon: 'users' as const },
  { label: 'Enquiries', path: '/vendor/quotation-requests', icon: 'mail' as const },
  { label: 'My services', path: '/vendor/services', icon: 'store' as const },
  { label: 'Packages', path: '/vendor/packages', icon: 'sparkle' as const },
  { label: 'Portfolio', path: '/vendor/portfolio', icon: 'landmark' as const },
  { label: 'Availability', path: '/vendor/availability', icon: 'calendar' as const },
  { label: 'Quotations', path: '/vendor/quotations', icon: 'mail' as const },
  { label: 'Bookings', path: '/vendor/bookings', icon: 'calendar' as const },
  { label: 'Payments', path: '/vendor/payments', icon: 'wallet' as const },
  { label: 'Reviews', path: '/vendor/reviews', icon: 'sparkle' as const },
  { label: 'Analytics', path: '/vendor/analytics', icon: 'grid' as const },
  { label: 'Studio settings', path: '/vendor/settings', icon: 'settings' as const },
];

const adminNavigation = [
  { label: 'Admin overview', path: '/admin', icon: 'grid' as const },
  { label: 'People', path: '/admin/users', icon: 'users' as const },
  { label: 'Families', path: '/admin/families', icon: 'users' as const },
  { label: 'Vendors', path: '/admin/vendors', icon: 'store' as const },
  { label: 'Verification', path: '/admin/vendor-verification', icon: 'sparkle' as const },
  { label: 'Categories', path: '/admin/categories', icon: 'grid' as const },
  { label: 'Venues', path: '/admin/venues', icon: 'landmark' as const },
  { label: 'Invitations', path: '/admin/templates', icon: 'mail' as const },
  { label: 'Bookings', path: '/admin/bookings', icon: 'calendar' as const },
  { label: 'Payments', path: '/admin/payments', icon: 'wallet' as const },
  { label: 'Commissions', path: '/admin/commissions', icon: 'wallet' as const },
  { label: 'Reviews', path: '/admin/reviews', icon: 'sparkle' as const },
  { label: 'Reports', path: '/admin/reports', icon: 'grid' as const },
  { label: 'Audit log', path: '/admin/audit-logs', icon: 'calendar' as const },
  { label: 'Platform settings', path: '/admin/settings', icon: 'settings' as const },
];

const titles: Record<string, { title: string; eyebrow: string }> = {
  '/admin': { title: 'Admin overview', eyebrow: 'THE UTSAV CONTROL ROOM' },
  '/vendor': { title: 'Your studio', eyebrow: 'A LOVELY DAY TO GROW YOUR BUSINESS' },
  '/': { title: 'Your workspace', eyebrow: 'MONDAY, 9 NOVEMBER 2026' },
  '/dashboard': { title: 'Your workspace', eyebrow: 'MONDAY, 9 NOVEMBER 2026' },
  '/planner': { title: 'Planner dashboard', eyebrow: 'COORDINATE EVERY CELEBRATION' },
  '/events': { title: 'Your events', eyebrow: 'PLAN THE MOMENTS THAT MATTER' },
  '/guests': { title: 'Guest list', eyebrow: 'EVERYONE, ALL IN ONE PLACE' },
  '/invitations': { title: 'Invitations', eyebrow: 'SET THE TONE FOR YOUR DAY' },
  '/vendors': { title: 'Find your people', eyebrow: 'THOUGHTFULLY CHOSEN FOR YOU' },
  '/venues': { title: 'Find your venue', eyebrow: 'SPACES MADE FOR CELEBRATING' },
  '/budget': { title: 'Your budget', eyebrow: 'A CLEAR VIEW OF EVERY RUPEE' },
  '/bookings': { title: 'Your bookings', eyebrow: 'EVERY DETAIL, RIGHT ON TRACK' },
  '/settings': { title: 'Settings', eyebrow: 'MAKE UTSAV YOURS' },
};

const catalogTitles: Record<string, string> = {
  '/admin/users': 'Community members',
  '/admin/families': 'Family workspaces',
  '/admin/vendors': 'Vendor directory',
  '/admin/vendor-verification': 'Vendor verification',
  '/admin/categories': 'Service categories',
  '/admin/venues': 'Venue directory',
  '/admin/templates': 'Invitation templates',
  '/admin/bookings': 'Marketplace bookings',
  '/admin/payments': 'Platform payments',
  '/admin/commissions': 'Commissions',
  '/admin/reviews': 'Reviews & moderation',
  '/admin/reports': 'Platform reports',
  '/admin/audit-logs': 'Audit log',
  '/admin/settings': 'Platform settings',
  '/vendor/quotation-requests': 'New enquiries',
  '/vendor/profile': 'Public profile',
  '/vendor/services': 'Your services',
  '/vendor/packages': 'Your packages',
  '/vendor/portfolio': 'Your portfolio',
  '/vendor/availability': 'Availability',
  '/vendor/quotations': 'Quotations',
  '/vendor/bookings': 'Your bookings',
  '/vendor/payments': 'Payments & payouts',
  '/vendor/reviews': 'Your reviews',
  '/vendor/analytics': 'Studio analytics',
  '/vendor/settings': 'Studio settings',
  '/events/create': 'Create an event',
  '/guest-groups': 'Guest groups',
  '/invitation-editor': 'Invitation editor',
  '/rsvp': 'RSVP overview',
  '/catering': 'Catering & menus',
  '/decoration': 'Decor & flowers',
  '/event-management': 'Planners & coordinators',
  '/other-services': 'Other services',
  '/quotations': 'Your quotations',
  '/payments': 'Your payments',
  '/members': 'Family members',
  '/notifications': 'Notifications',
  '/family-settings': 'Family settings',
};

export function WorkspaceLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeRole, activeWorkspace, activeBusiness, membershipId, memberships, permissions, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventRecord[]>(() => {
    try {
      const saved = localStorage.getItem('utsav-events');
      return saved ? JSON.parse(saved) as EventRecord[] : initialEvents;
    } catch (error) {
      console.error('Unable to load saved events.', error);
      return initialEvents;
    }
  });
  const [eventsLoadedFor, setEventsLoadedFor] = useState<string | null>(null);
  const [eventError, setEventError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const page = titles[location.pathname] ?? {
    title: catalogTitles[location.pathname] ?? (location.pathname.startsWith('/admin/') ? 'Admin workspace' : location.pathname.startsWith('/vendor/') ? 'Vendor studio' : 'Your celebration'),
    eyebrow: location.pathname.startsWith('/admin/') ? 'THE UTSAV CONTROL ROOM' : location.pathname.startsWith('/vendor/') ? 'YOUR BUSINESS, ALL TOGETHER' : 'PLAN THE MOMENTS THAT MATTER',
  };
  const allSidebarNavigation = location.pathname.startsWith('/admin') ? adminNavigation : location.pathname.startsWith('/vendor') ? vendorNavigation : navigation;
  const displayName = user?.name?.trim() || 'Your account';
  const displayInitials = getInitials(displayName);
  const isAdminWorkspace = activeRole === 'admin' || activeRole === 'super_admin';
  const isVendorWorkspace = activeRole === 'vendor' || activeRole === 'vendor_owner' || activeRole === 'vendor_staff';
  const isPlannerWorkspace = activeRole === 'wedding_planner';
  const sidebarNavigation = activeRole === 'vendor_staff'
    ? vendorNavigation.filter((item) => item.path === '/vendor' || item.path === '/vendor/staff')
    : allSidebarNavigation.filter((item) => {
      if (['/members', '/family-settings'].includes(item.path) && activeWorkspace?.role !== 'owner') return false;
      if (item.path === '/events/create' && !permissions.includes('event.create')) return false;
      return true;
    });
  const workspaceName = activeWorkspace?.name || activeBusiness?.name || (isAdminWorkspace ? 'Admin console' : isVendorWorkspace ? 'Vendor studio' : 'Family workspace');
  const workspaceRoleLabel = isAdminWorkspace ? 'Admin workspace' : isVendorWorkspace ? 'Vendor workspace' : isPlannerWorkspace ? 'Planner workspace' : 'Family workspace';
  const profileRoleLabel = isAdminWorkspace ? 'Platform admin' : activeRole === 'vendor_staff' ? 'Vendor team member' : isVendorWorkspace ? 'Business owner' : activeRole === 'wedding_planner' ? 'Wedding planner' : 'Family admin';
  const hasFamilyAccount = ['family', 'family_owner', 'family_member', 'wedding_planner'].includes(activeRole ?? user?.role ?? '');
  const activeMembershipKey = `${user?.id ?? ''}:${membershipId ?? ''}`;
  const eventsLoading = isAuthenticated && hasFamilyAccount && eventsLoadedFor !== activeMembershipKey;
  const visibleEvents = eventsLoading || !hasFamilyAccount ? [] : events;

  useEffect(() => {
    if (!isAuthenticated || !hasFamilyAccount || !user?.id) return;
    let active = true;
    setEventError('');
    eventsApi.list()
      .then((result) => {
        if (active) {
          setEvents(result.map(toEventRecord));
          setEventsLoadedFor(activeMembershipKey);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setEvents([]);
          setEventError(error instanceof Error ? error.message : 'Unable to load your events.');
          setEventsLoadedFor(activeMembershipKey);
        }
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, user?.role, activeMembershipKey, hasFamilyAccount]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (event.key === 'Escape') {
        setSearch('');
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const saveEvent = async (event: EventRecord) => {
    if (!isAuthenticated) throw new Error('Sign in before saving an event to your account.');
    const saved = await eventsApi.create({
      name: event.name,
      type: event.type,
      date: event.date,
      location: event.location,
      guestCount: event.guests,
      budget: event.budget,
      status: event.status.toLowerCase() as Event['status'],
    });
    setEvents((current) => [toEventRecord(saved), ...current]);
    setModalOpen(false);
    navigate('/events');
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return [...navigation, ...vendorNavigation, ...adminNavigation].filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="workspace">
      {mobileNavOpen && <button className="mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`}>
        <NavLink to="/" className="brand" onClick={() => setMobileNavOpen(false)}>
          <span className="brand-mark">u</span>
          <span className="brand-word">utsav<span>.</span></span>
        </NavLink>

        <button className="workspace-switcher" aria-expanded={workspaceMenuOpen} onClick={() => setWorkspaceMenuOpen((open) => !open)}>
          <span className="workspace-avatar">{workspaceName.slice(0, 1).toUpperCase() || 'U'}</span>
          <span className="workspace-switcher-copy"><strong>{workspaceName}</strong><small>{workspaceRoleLabel}</small></span>
          <Icon name="chevron" size={16} />
        </button>
        {workspaceMenuOpen && <div className="workspace-menu"><span>SWITCH YOUR SPACE</span>{memberships.length > 1 ? <button onClick={() => { navigate('/choose-workspace'); setWorkspaceMenuOpen(false); }}><i>↔</i><span><strong>Choose a workspace</strong><small>Switch to another account or team</small></span></button> : <p>You have one active workspace.</p>}</div>}

        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {sidebarNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/' || item.path === '/vendor' || item.path === '/admin'}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {item.path === '/guests' && <span className="nav-count">184</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-divider" />
        <div className="sidebar-label">YOUR PEOPLE</div>
        <button className="person-link" onClick={() => navigate('/settings')}>
          <span className="avatar avatar--rose">AM</span><span>Aarav & Meera</span>
        </button>
        <button className="person-link" onClick={() => navigate('/settings')}>
          <span className="avatar avatar--gold">D</span><span>Diya’s Mehendi</span>
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><Icon name="sparkle" size={17} /></span>
            <strong>A little help goes a long way</strong>
            <p>Our celebration experts are just a message away.</p>
            <button onClick={() => setNotificationsOpen(true)}>Talk to our team <span>→</span></button>
          </div>
          <NavLink to="/settings" className="profile-link">
            <span className="avatar avatar--profile">{displayInitials}</span>
            <span className="profile-copy"><strong>{displayName}</strong><small>{profileRoleLabel}</small></span>
            <Icon name="chevron" size={16} />
          </NavLink>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-leading">
            <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
              <Icon name="menu" />
            </button>
            <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page.title}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className={`global-search ${searchOpen ? 'global-search--open' : ''}`}>
              <button className="search-toggle" onClick={() => { setSearchOpen(true); window.setTimeout(() => searchInputRef.current?.focus(), 0); }} aria-label="Open search"><Icon name="search" size={17} /></button>
              <input
                ref={searchInputRef}
                aria-label="Search workspace"
                placeholder="Search anything"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchResults[0]) {
                    navigate(searchResults[0].path);
                    setSearch('');
                    setSearchOpen(false);
                  }
                }}
              />
              <kbd>Ctrl K</kbd>
              {search && (
                <div className="search-popover">
                  {searchResults.length ? searchResults.map((item) => (
                    <button key={item.path} onClick={() => { navigate(item.path); setSearch(''); setSearchOpen(false); }}>
                      <Icon name={item.icon} size={16} />{item.label}<span>↗</span>
                    </button>
                  )) : <p>No matching pages. Try “events” or “budget”.</p>}
                </div>
              )}
            </div>
            <button
              className={`icon-button notification-button ${notificationsOpen ? 'is-selected' : ''}`}
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label="Notifications"
            >
              <Icon name="bell" size={19} /><span className="notification-dot" />
            </button>
            <UserMenu />
          </div>
        </header>

        {notificationsOpen && (
          <div className="notification-panel">
            <div className="panel-heading"><div><strong>You’re all caught up</strong><small>Just a few things to keep your day moving</small></div><button className="plain-icon" onClick={() => setNotificationsOpen(false)} aria-label="Close"><Icon name="close" size={17} /></button></div>
            <div className="notification-item"><span className="notification-symbol notification-symbol--rose"><Icon name="mail" size={16} /></span><span><strong>New RSVP from Ananya</strong><small>She’s looking forward to celebrating with you.</small><time>20 minutes ago</time></span></div>
            <div className="notification-item"><span className="notification-symbol notification-symbol--gold"><Icon name="store" size={16} /></span><span><strong>A vendor replied to your enquiry</strong><small>The Marigold House sent you a message.</small><time>Yesterday</time></span></div>
          </div>
        )}

        <main className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1></div>
            <button className="button button--primary" onClick={() => setModalOpen(true)}><Icon name="plus" size={17} />Create an event</button>
          </div>
          <Outlet context={{
            events: visibleEvents,
            saveEvent,
            openCreateEvent: () => setModalOpen(true),
            eventsLoading,
            eventError,
            isAuthenticated,
          }} />
        </main>
      </div>

      {modalOpen && <CreateEventModal onClose={() => setModalOpen(false)} onSave={saveEvent} />}
    </div>
  );
}

function CreateEventModal({ onClose, onSave }: { onClose: () => void; onSave: (event: EventRecord) => Promise<void> }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Wedding');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !date || !location.trim()) {
      setError('Add an event name, date, and location to continue.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
      id: `evt-${Date.now()}`,
      name: name.trim(),
      type,
      date,
      location: location.trim(),
      guests: 0,
      budget: 0,
      spent: 0,
      status: 'Planning',
      initials: name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
      accent: 'rose',
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-event-title">
        <div className="modal-top"><span className="modal-kicker"><Icon name="sparkle" size={16} /> A new beginning</span><button className="plain-icon" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
        <h2 id="create-event-title">What are we celebrating?</h2>
        <p className="modal-description">Start with the basics. You can add all the lovely details later.</p>
        <form onSubmit={submit} className="event-form">
          <label>Event name<input autoFocus placeholder="e.g. Aarav & Meera’s wedding" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <div className="form-row">
            <label>Celebration<select value={type} onChange={(event) => setType(event.target.value)}><option>Wedding</option><option>Engagement</option><option>Mehendi</option><option>Sangeet</option><option>Birthday</option><option>Other celebration</option></select></label>
            <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          </div>
          <label>Where will it be?<input placeholder="City, venue, or somewhere special" value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={saving}>Maybe later</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : <>Create your event <span>→</span></>}</button></div>
        </form>
      </section>
    </div>
  );
}
