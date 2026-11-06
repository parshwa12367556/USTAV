import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { formatCurrency, formatDate, guests, initialTasks, vendors } from '../../data/workspaceData';
import { Icon } from '../../layouts/WorkspaceLayout';
import type { EventRecord, GuestRecord } from '../../types/workspace.types';
import { usePersistentState } from '../../hooks/usePersistentState';

type WorkspaceContext = {
  events: EventRecord[];
  openCreateEvent: () => void;
};

function useWorkspace() {
  return useOutletContext<WorkspaceContext>();
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {action && <button className="text-button" onClick={onAction}>{action}<span>→</span></button>}
    </div>
  );
}

function EventMark({ event }: { event: EventRecord }) {
  return <span className={`event-mark event-mark--${event.accent}`}>{event.initials}</span>;
}

function StatusPill({ status }: { status: string }) {
  const tone = status.toLowerCase().replaceAll(' ', '-');
  return <span className={`status-pill status-pill--${tone}`}><i />{status}</span>;
}

function isTaskList(value: unknown): value is typeof initialTasks {
  return Array.isArray(value) && value.every((task) =>
    typeof task === 'object' && task !== null &&
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.detail === 'string' &&
    typeof task.due === 'string' &&
    typeof task.done === 'boolean',
  );
}

export function DashboardPage() {
  const { events, openCreateEvent } = useWorkspace();
  const navigate = useNavigate();
  const [tasks, setTasks, taskStorageError] = usePersistentState('utsav-planning-tasks', initialTasks, isTaskList);
  const activeEvent = events[0];
  const totalBudget = events.reduce((sum, event) => sum + event.budget, 0);
  const totalSpent = events.reduce((sum, event) => sum + event.spent, 0);
  const confirmedGuests = guests.filter((guest) => guest.status === 'Confirmed').length;
  const completedTasks = tasks.filter((task) => task.done).length;

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div><h2>Good morning, Priya <span className="wave">✦</span></h2><p>Big moments are made of little details. You’re doing wonderfully.</p></div>
        <span className="welcome-note">Your next celebration is in <strong>39 days</strong></span>
      </section>

      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-overline"><span className="hero-live-dot" /> YOUR NEXT BIG MOMENT</div>
          <h2>{activeEvent?.name ?? 'Your next celebration'}</h2>
          <p className="hero-subtitle"><span>{activeEvent?.type ?? 'A special day'}</span><b>·</b><span>{activeEvent ? formatDate(activeEvent.date) : 'Add a date'}</span><b>·</b><span>{activeEvent?.location ?? 'Your favourite place'}</span></p>
          <div className="hero-progress">
            <div className="hero-progress-copy"><span>Planning progress</span><strong>{completedTasks} of {tasks.length} little things done</strong></div>
            <div className="progress-track"><span style={{ width: `${(completedTasks / tasks.length) * 100}%` }} /></div>
          </div>
          <button className="button button--light" onClick={() => document.getElementById('planning-checklist')?.scrollIntoView({ behavior: 'smooth' })}>See your checklist <span>→</span></button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-sun" />
          <div className="hero-arch"><div className="arch-inner" /><span className="arch-star arch-star--one">✳</span><span className="arch-star arch-star--two">✦</span><span className="arch-flower arch-flower--one">✿</span><span className="arch-flower arch-flower--two">✿</span><span className="arch-caption">made for your moment</span></div>
          <div className="hero-leaf hero-leaf--one">❋</div><div className="hero-leaf hero-leaf--two">✿</div>
        </div>
      </section>

      <section className="stat-grid" aria-label="Celebration overview">
        <article className="stat-card">
          <span className="stat-icon stat-icon--rose"><Icon name="calendar" size={18} /></span><span className="stat-label">UPCOMING CELEBRATIONS</span>
          <strong className="stat-value">{events.length.toString().padStart(2, '0')}</strong><span className="stat-foot">All your special days, together</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-icon--sage"><Icon name="users" size={18} /></span><span className="stat-label">GUESTS CONFIRMED</span>
          <strong className="stat-value">{confirmedGuests}<small> / {activeEvent?.guests || 250}</small></strong><span className="stat-foot"><span className="stat-positive">+12</span> lovely replies this week</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-icon--gold"><Icon name="wallet" size={18} /></span><span className="stat-label">BUDGET ALLOCATED</span>
          <strong className="stat-value stat-value--money">{formatCurrency(totalBudget || 1850000)}</strong><span className="stat-foot">{formatCurrency(totalSpent)} thoughtfully spent so far</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-icon--lavender"><Icon name="sparkle" size={18} /></span><span className="stat-label">ON YOUR CHECKLIST</span>
          <strong className="stat-value">{tasks.length - completedTasks}<small> things to do</small></strong><span className="stat-foot">One step at a time, you’ve got this</span>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="content-card checklist-card" id="planning-checklist">
          <SectionHeading title="Your little to-do list" action="View all" onAction={() => navigate('/events')} />
          <p className="section-description">A few thoughtful steps to bring it all together.</p>
          {taskStorageError && <p className="form-error" role="alert">{taskStorageError}</p>}
          <div className="checklist">
            {tasks.map((task) => (
              <button
                className={`task-row ${task.done ? 'task-row--done' : ''}`}
                key={task.id}
                onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))}
              >
                <span className={`task-check ${task.done ? 'task-check--checked' : ''}`}>{task.done && '✓'}</span>
                <span className="task-copy"><strong>{task.title}</strong><small>{task.detail}</small></span>
                <span className="task-due">{task.due}</span><span className="task-arrow">›</span>
              </button>
            ))}
          </div>
          <button className="add-task-button" onClick={openCreateEvent}><span>+</span> Add a celebration to plan</button>
        </section>

        <section className="content-card budget-card">
          <SectionHeading title="The big picture" action="See budget" onAction={() => navigate('/budget')} />
          <p className="section-description">Your wedding budget, at a glance.</p>
          <div className="budget-total"><div><span>YOUR TOTAL BUDGET</span><strong>{formatCurrency(activeEvent?.budget ?? 1850000)}</strong></div><span className="budget-total-icon"><Icon name="wallet" size={19} /></span></div>
          <div className="budget-bar"><span style={{ width: `${Math.min(((activeEvent?.spent ?? 845000) / (activeEvent?.budget || 1850000)) * 100, 100)}%` }} /></div>
          <div className="budget-legend"><span><i className="legend-dot legend-dot--rose" />Spent <strong>{formatCurrency(activeEvent?.spent ?? 845000)}</strong></span><span><i className="legend-dot legend-dot--pale" />Left <strong>{formatCurrency(Math.max((activeEvent?.budget ?? 1850000) - (activeEvent?.spent ?? 845000), 0))}</strong></span></div>
          <div className="budget-insight"><span className="insight-icon">✦</span><p>You’re right on track. The average wedding spends <strong>46% by this stage</strong> of planning.</p></div>
        </section>
      </div>

      <section className="content-card upcoming-card">
        <SectionHeading title="All the days worth celebrating" action="See all events" onAction={() => navigate('/events')} />
        <p className="section-description">The moments your family is looking forward to.</p>
        <div className="event-preview-grid">
          {events.slice(0, 3).map((event) => (
            <article className="event-preview" key={event.id}>
              <EventMark event={event} /><div className="event-preview-copy"><strong>{event.name}</strong><span>{formatDate(event.date)} <i>·</i> {event.location}</span></div>
              <StatusPill status={event.status} /><Icon name="arrow" size={15} />
            </article>
          ))}
          <button className="event-preview event-preview--add" onClick={openCreateEvent}><span className="add-event-mark"><Icon name="plus" /></span><span className="event-preview-copy"><strong>Another reason to celebrate?</strong><span>Add an event to your family calendar</span></span><span className="add-link">Add one <b>→</b></span></button>
        </div>
      </section>
    </div>
  );
}

export function EventsPage() {
  const { events, openCreateEvent } = useWorkspace();
  const [filter, setFilter] = useState('All events');
  const filtered = events.filter((event) => filter === 'All events' || event.status === filter);
  return (
    <div className="screen-stack">
      <section className="intro-banner intro-banner--rose"><span className="intro-sparkle">✳</span><div><h2>Every celebration starts somewhere.</h2><p>Keep all your plans, people, and precious details in one happy place.</p></div><button className="button button--primary" onClick={openCreateEvent}><Icon name="plus" size={16} />Plan a new event</button></section>
      <section className="content-card list-card">
        <div className="list-toolbar"><div><SectionHeading title="Your celebrations" /><p className="section-description">{events.length} moments, each one your own.</p></div><div className="filter-tabs">{['All events', 'Planning', 'Confirmed', 'Completed'].map((item) => <button key={item} className={filter === item ? 'filter-tab filter-tab--active' : 'filter-tab'} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="event-table">
          <div className="table-header event-table-row"><span>CELEBRATION</span><span>DATE & PLACE</span><span>GUESTS</span><span>PLANNING BUDGET</span><span>STATUS</span><span /></div>
          {filtered.map((event) => <div className="event-table-row" key={event.id}>
            <div className="table-event-name"><EventMark event={event} /><span><strong>{event.name}</strong><small>{event.type}</small></span></div>
            <span className="table-secondary">{formatDate(event.date)}<small>{event.location}</small></span>
            <span className="table-secondary">{event.guests || '—'}<small>people invited</small></span>
            <span className="table-secondary">{event.budget ? formatCurrency(event.budget) : 'Not set'}<small>{event.spent ? `${formatCurrency(event.spent)} committed` : 'Add a budget'}</small></span>
            <StatusPill status={event.status} /><button className="plain-icon row-open" aria-label={`Open ${event.name}`}>↗</button>
          </div>)}
          {!filtered.length && <div className="empty-state"><span>✿</span><strong>No celebrations here just yet.</strong><p>When you add an event, it’ll find its place right here.</p><button className="button button--primary" onClick={openCreateEvent}>Plan a celebration</button></div>}
        </div>
      </section>
      <div className="tip-banner"><span>✦</span><p><strong>A little planning tip</strong> Give each celebration its own event. It makes guests, budgets, and bookings much easier to manage.</p></div>
    </div>
  );
}

export function BookingsPage() {
  const [filter, setFilter] = useState('Everything');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const navigate = useNavigate();
  const bookings = [
    { vendor: 'The Marigold House', service: 'Wedding venue · 18 Dec', amount: 420000, status: 'Confirmed', icon: '⌂', tone: 'rose' },
    { vendor: 'Saffron & Sage Catering', service: 'Wedding dinner · 18 Dec', amount: 185000, status: 'Awaiting payment', icon: '✳', tone: 'gold' },
    { vendor: 'House of Petals', service: 'Mehendi decor · 16 Dec', amount: 85000, status: 'Confirmed', icon: '✿', tone: 'sage' },
    { vendor: 'Golden Hour Studio', service: 'Wedding photography · 18 Dec', amount: 65000, status: 'Enquiry sent', icon: '◉', tone: 'lavender' },
  ];
  const filtered = bookings.filter((booking) => filter === 'Everything' || booking.status === filter);
  return (
    <div className="screen-stack">
      <section className="intro-banner intro-banner--rose"><span className="intro-sparkle">✦</span><div><h2>Good plans deserve good people.</h2><p>Keep every vendor conversation and confirmed detail close at hand.</p></div><button className="button button--primary" onClick={() => navigate('/vendors')}>Find a vendor <span>→</span></button></section>
      <section className="content-card list-card">
        <div className="list-toolbar"><div><SectionHeading title="Your vendor plans" /><p className="section-description">A clear view of what’s booked and what’s next.</p></div><div className="filter-tabs">{['Everything', 'Confirmed', 'Awaiting payment', 'Enquiry sent'].map((item) => <button key={item} className={filter === item ? 'filter-tab filter-tab--active' : 'filter-tab'} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="booking-list">{filtered.map((booking) => <article className={`booking-item ${expandedBooking === booking.vendor ? 'booking-item--expanded' : ''}`} key={booking.vendor}><div className="booking-row"><span className={`category-icon category-icon--${booking.tone}`}>{booking.icon}</span><div className="booking-vendor"><strong>{booking.vendor}</strong><small>{booking.service}</small></div><div className="booking-amount"><strong>{formatCurrency(booking.amount)}</strong><small>Agreed estimate</small></div><StatusPill status={booking.status} /><button className="button button--outline booking-details" aria-expanded={expandedBooking === booking.vendor} onClick={() => setExpandedBooking((current) => current === booking.vendor ? null : booking.vendor)}>{expandedBooking === booking.vendor ? 'Hide details' : 'View details'} <span>{expandedBooking === booking.vendor ? '−' : '+'}</span></button></div>{expandedBooking === booking.vendor && <div className="booking-expanded"><span><small>YOUR CELEBRATION</small><strong>Aarav & Meera’s wedding</strong></span><span><small>BOOKING REFERENCE</small><strong>UTS-{booking.vendor.slice(0, 3).toUpperCase()}-2026</strong></span><span><small>NEXT STEP</small><strong>{booking.status === 'Confirmed' ? 'Review your payment schedule' : 'Follow up with this vendor'}</strong></span></div>}</article>)}{!filtered.length && <div className="empty-state"><strong>Nothing in this category just yet.</strong><p>Your plans will show up here as they come together.</p></div>}</div>
      </section>
      <div className="tip-banner"><span>✦</span><p><strong>A note worth keeping</strong> Confirm the date, inclusions, and payment schedule with each vendor before making a booking.</p></div>
    </div>
  );
}

export function GuestsPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Everyone');
  const [guestList, setGuestList, storageError] = usePersistentState('utsav-guests', guests, isGuestList);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const results = guestList.filter((guest) =>
    `${guest.name} ${guest.email} ${guest.group}`.toLowerCase().includes(query.toLowerCase()) &&
    (status === 'Everyone' || guest.status === status),
  );
  const confirmed = guestList.filter((guest) => guest.status === 'Confirmed').length;
  const pending = guestList.filter((guest) => guest.status === 'Pending').length;
  const exportGuestList = () => {
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [
      ['Name', 'Group', 'Email', 'RSVP'].map(escapeCell).join(','),
      ...guestList.map((guest) => [guest.name, guest.group, guest.email, guest.status].map(escapeCell).join(',')),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'utsav-guest-list.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="screen-stack">
      <section className="guest-summary-grid">
        <div className="guest-summary guest-summary--total"><span>ON YOUR LIST</span><strong>{guestList.length}</strong><small>A wonderful gathering</small><span className="summary-decoration">✿</span></div>
        <div className="guest-summary"><span>CAN’T WAIT TO SEE YOU</span><strong>{confirmed}</strong><small>Kindly said yes</small><span className="mini-avatars"><i>AS</i><i>RM</i><i>AK</i><b>+{confirmed}</b></span></div>
        <div className="guest-summary"><span>STILL THINKING IT OVER</span><strong>{pending}</strong><small>A gentle reminder might help</small><span className="summary-mini-link">Send a reminder →</span></div>
        <div className="guest-summary"><span>YOUR CELEBRATION</span><strong>18 <small>Dec</small></strong><small>Aarav & Meera’s wedding</small><span className="summary-calendar">2026</span></div>
      </section>
      <section className="content-card guest-list-card">
        {storageError && <p className="form-error" role="alert">{storageError}</p>}
        <div className="list-toolbar"><div><SectionHeading title="The people who make it special" /><p className="section-description">A warm welcome begins with knowing who’s coming.</p></div><button className="button button--primary" onClick={() => setGuestModalOpen(true)}><Icon name="plus" size={16} />Add a guest</button></div>
        <div className="guest-tools"><div className="inline-search"><Icon name="search" size={17} /><input placeholder="Find someone by name or email" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-tabs">{['Everyone', 'Confirmed', 'Pending', 'Declined'].map((item) => <button key={item} className={status === item ? 'filter-tab filter-tab--active' : 'filter-tab'} onClick={() => setStatus(item)}>{item}</button>)}</div><button className="button button--outline" onClick={exportGuestList}>↓ <span>Export list</span></button></div>
        <div className="guest-table">
          <div className="guest-table-row guest-table-header"><span>GUEST</span><span>GROUP</span><span>EMAIL ADDRESS</span><span>RSVP</span><span /></div>
          {results.map((guest, index) => <div className="guest-table-row" key={guest.email}><div className="guest-name"><span className={`avatar avatar--guest avatar--guest-${index % 4}`}>{guest.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{guest.name}</strong></div><span className="table-secondary">{guest.group}</span><span className="table-secondary">{guest.email}</span><StatusPill status={guest.status} /><button className="plain-icon row-open" aria-label={`More options for ${guest.name}`}>···</button></div>)}
          {!results.length && <div className="empty-state"><strong>No guests found</strong><p>Try a different name or RSVP filter.</p></div>}
        </div>
        <div className="table-footer"><span>Showing {results.length} {results.length === 1 ? 'guest' : 'guests'}</span><span>RSVP details update as your loved ones reply.</span></div>
      </section>
      {guestModalOpen && <AddGuestModal onClose={() => setGuestModalOpen(false)} onAdd={(guest) => { setGuestList((current) => [guest, ...current]); setGuestModalOpen(false); }} />}
    </div>
  );
}

function isGuestList(value: unknown): value is GuestRecord[] {
  return Array.isArray(value) && value.every((guest) =>
    typeof guest === 'object' && guest !== null &&
    typeof guest.name === 'string' &&
    typeof guest.group === 'string' &&
    typeof guest.email === 'string' &&
    (guest.status === 'Confirmed' || guest.status === 'Pending' || guest.status === 'Declined'),
  );
}

function AddGuestModal({ onClose, onAdd }: { onClose: () => void; onAdd: (guest: GuestRecord) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('Friends');
  const [error, setError] = useState('');
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-guest-title">
        <div className="modal-top"><span className="modal-kicker"><Icon name="users" size={16} /> Make room for one more</span><button className="plain-icon" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
        <h2 id="add-guest-title">Add someone lovely.</h2><p className="modal-description">They’ll be part of the celebration before you know it.</p>
        <form className="event-form" onSubmit={(event) => { event.preventDefault(); if (!name.trim() || !email.trim()) { setError('Please add their name and email address.'); return; } onAdd({ name: name.trim(), email: email.trim(), group, status: 'Pending' }); }}>
          <label>Guest’s name<input autoFocus placeholder="e.g. Ananya Sharma" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Email address<input type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Add them to a group<select value={group} onChange={(event) => setGroup(event.target.value)}><option>Friends</option><option>Bride’s family</option><option>Groom’s family</option><option>Colleagues</option><option>Other</option></select></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button--primary">Add to your guest list <span>→</span></button></div>
        </form>
      </section>
    </div>
  );
}

const invitationTemplates = [
  { title: 'The Jaipur Garden', type: 'FLORAL · TRADITIONAL', tone: 'invitation-art--garden', note: 'With the blessings of our families', names: 'Aarav & Meera' },
  { title: 'A Golden Promise', type: 'MINIMAL · WARM', tone: 'invitation-art--gold', note: 'Together with our families', names: 'Aarav & Meera' },
  { title: 'A Little More Modern', type: 'CONTEMPORARY · BOLD', tone: 'invitation-art--modern', note: 'Save the date', names: 'Meera ♥ Aarav' },
];

export function InvitationsPage() {
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  return (
    <div className="screen-stack">
      <section className="invitation-feature">
        <div className="invitation-feature-copy"><span className="eyebrow">A NOTE FROM THE HEART</span><h2>Some days deserve<br />a beautiful beginning.</h2><p>Choose an invitation that feels like you. Add your details, then share a little joy with everyone you love.</p><button className="button button--light" onClick={() => document.getElementById('invitation-collection')?.scrollIntoView({ behavior: 'smooth' })}>Find your invitation <span>→</span></button></div>
        <div className="invitation-feature-art" aria-hidden="true"><div className="feature-paper"><span>together with their families</span><i>✿</i><strong>Aarav<br /><em>&</em> Meera</strong><small>INVITE YOU TO CELEBRATE</small><b>18 · 12 · 26</b></div><span className="feature-flower feature-flower--a">✿</span><span className="feature-flower feature-flower--b">✽</span></div>
      </section>
      <section className="invitation-section" id="invitation-collection"><div className="section-heading"><div><h2>Find the one that feels like you</h2><p className="section-description">Thoughtfully designed, ready to make your own.</p></div><button className="text-button" onClick={() => navigate('/explore/invitations')}>Explore all designs <span>→</span></button></div><div className="template-grid">{invitationTemplates.map((template, index) => <button className={`template-card ${selected === index ? 'template-card--selected' : ''}`} onClick={() => setSelected(index)} key={template.title}><div className={`invitation-art ${template.tone}`}><span className="invitation-art-flower">✿</span><small>{template.note}</small><strong>{template.names}</strong><i>✦</i><span>18 December 2026 · Jaipur</span></div><div className="template-info"><div><strong>{template.title}</strong><small>{template.type}</small></div><span className="template-radio">{selected === index && <i />}</span></div></button>)}</div></section>
      <section className="invitation-send-card"><span className="send-icon"><Icon name="mail" size={19} /></span><div><strong>You’ve picked “{invitationTemplates[selected].title}”</strong><p>Personalise the wording and event details before sharing it with your guests.</p></div><button className="button button--primary" onClick={() => navigate(`/invitation-editor?template=${encodeURIComponent(invitationTemplates[selected].title)}`)}>Personalise this design →</button></section>
    </div>
  );
}

export function VendorsPage({ category }: { category?: 'venues' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [filter, setFilter] = useState(category ? 'Wedding venues' : 'Everything lovely');
  const filtered = useMemo(() => vendors.filter((vendor) =>
    `${vendor.name} ${vendor.category} ${vendor.location}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'Everything lovely' || vendor.category === filter),
  ), [filter, query]);
  return (
    <div className="screen-stack">
      <section className="vendor-search-card">
        <div><span className="eyebrow">GOOD PEOPLE MAKE GREAT MEMORIES</span><h2>Meet the magic-makers.</h2><p>Meet thoughtful local vendors who care about your day as much as you do.</p></div>
        <form className="vendor-search-form" onSubmit={(event) => { event.preventDefault(); setSearchParams(query ? { q: query } : {}); }}><Icon name="search" size={19} /><input aria-label="Search vendors" placeholder="Try “florist” or “Jaipur”" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="button button--primary">Find them</button></form>
        <div className="popular-searches"><span>Little ideas to get you started</span>{['Venues', 'Flowers', 'Photography', 'Catering'].map((item) => <button key={item} onClick={() => { setFilter(item === 'Venues' ? 'Wedding venues' : item === 'Flowers' ? 'Decor & flowers' : item); setQuery(''); }}>{item} <span>↗</span></button>)}</div>
      </section>
      <section className="vendor-section"><div className="section-heading"><div><h2>{category ? 'Places worth gathering' : 'A few lovely finds'}</h2><p className="section-description">Trusted favourites around Jaipur, picked just for you.</p></div><button className="text-button">View all vendors <span>→</span></button></div><div className="vendor-filter-row"><div className="filter-tabs">{['Everything lovely', 'Wedding venues', 'Catering', 'Decor & flowers'].map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'filter-tab filter-tab--active' : 'filter-tab'}>{item}</button>)}</div><span className="results-note">{filtered.length} thoughtful recommendations</span></div>
        <div className="vendor-grid">{filtered.map((vendor) => <article className="vendor-card" key={vendor.name}><div className={`vendor-image vendor-image--${vendor.tone}`}><span className="vendor-image-symbol">{vendor.icon}</span><button className="favorite-button" aria-label={`Save ${vendor.name}`} onClick={(event) => event.currentTarget.classList.toggle('is-favorite')}>♡</button><span className="vendor-image-caption">A PLACE TO GATHER</span></div><div className="vendor-card-body"><div className="vendor-category">{vendor.category}<span>✦ {vendor.rating}</span></div><h3>{vendor.name}</h3><p className="vendor-location">⌖ &nbsp;{vendor.location}</p><div className="vendor-card-footer"><strong>{vendor.price}</strong><button className="vendor-arrow" aria-label={`View ${vendor.name}`}>↗</button></div></div></article>)}</div>
        {!filtered.length && <div className="empty-state"><strong>We haven’t found that perfect match yet.</strong><p>Try a different search or explore another category.</p></div>}
      </section>
      <div className="vendor-note"><span>✦</span><p><strong>Good things take a conversation.</strong> Send a no-pressure enquiry to learn about availability and make sure it feels right.</p><button className="text-button">How it works →</button></div>
    </div>
  );
}

export function BudgetPage() {
  const { events } = useWorkspace();
  const event = events[0];
  const budget = event?.budget || 1850000;
  const spent = event?.spent || 845000;
  const categories = [
    { name: 'Venue & accommodation', amount: 420000, color: 'rose', icon: '⌂' },
    { name: 'Food & drinks', amount: 185000, color: 'gold', icon: '✳' },
    { name: 'Photography & video', amount: 95000, color: 'lavender', icon: '◉' },
    { name: 'Flowers & decor', amount: 145000, color: 'sage', icon: '✿' },
  ];
  return (
    <div className="screen-stack">
      <section className="budget-hero"><div><span className="eyebrow">A LITTLE CLARITY, A LOT LESS STRESS</span><h2>A celebration that feels good<br />and stays in budget.</h2><p>Here’s how your wedding spending is coming along.</p></div><span className="budget-hero-art">₹<i>✦</i></span></section>
      <div className="budget-overview-grid"><section className="content-card budget-overview-card"><div className="section-heading"><div><span className="eyebrow">YOUR WEDDING · 18 DEC 2026</span><h2>The numbers, made simple.</h2></div><button className="button button--outline">This celebration <Icon name="chevron" size={15} /></button></div><div className="budget-amount-row"><div><span>YOUR TOTAL BUDGET</span><strong>{formatCurrency(budget)}</strong></div><div><span>THOUGHTFULLY SPENT</span><strong>{formatCurrency(spent)}</strong></div><div><span>STILL YOURS TO PLAN</span><strong>{formatCurrency(Math.max(budget - spent, 0))}</strong></div></div><div className="budget-large-bar"><span style={{ width: `${Math.min((spent / budget) * 100, 100)}%` }} /></div><div className="budget-large-meta"><span>46% of your budget is spoken for</span><span>{Math.max(Math.round(((budget - spent) / budget) * 100), 0)}% to go</span></div></section><aside className="content-card budget-advice"><span className="advice-symbol">✦</span><span className="eyebrow">A NOTE FROM YOUR PLANNER</span><h3>You’re doing just fine.</h3><p>Most couples set aside around 10% for little surprises. You’ve got room to make your day feel like you.</p><button className="text-button">Plan for the unexpected →</button></aside></div>
      <section className="content-card category-budget-card"><div className="section-heading"><div><h2>Every rupee has a place</h2><p className="section-description">Your spending, thoughtfully organised.</p></div><button className="button button--outline">+ Add a category</button></div><div className="category-list">{categories.map((item) => <div className="category-row" key={item.name}><span className={`category-icon category-icon--${item.color}`}>{item.icon}</span><span className="category-copy"><strong>{item.name}</strong><small>{Math.round((item.amount / budget) * 100)}% of your overall budget</small></span><div className="category-progress"><span className={`category-progress-fill category-progress-fill--${item.color}`} style={{ width: `${Math.min((item.amount / budget) * 240, 100)}%` }} /></div><strong className="category-amount">{formatCurrency(item.amount)}</strong><button className="plain-icon" aria-label={`Edit ${item.name}`}>···</button></div>)}</div></section>
    </div>
  );
}

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="screen-stack settings-screen">
      <section className="settings-profile"><span className="settings-avatar">PS</span><div><h2>Priya Sharma</h2><p>Family admin · Sharma family workspace</p><button className="text-button">Change profile photo <span>↗</span></button></div><span className="profile-member-since">A MEMBER SINCE<br /><strong>SEPTEMBER 2026</strong></span></section>
      <section className="content-card settings-card"><div className="section-heading"><div><h2>Your details</h2><p className="section-description">A few things about you and your family.</p></div></div><div className="settings-form"><label>Your name<input defaultValue="Priya Sharma" /></label><label>Email address<input defaultValue="priya.sharma@email.com" type="email" /></label><label>Phone number<div className="phone-input"><span>🇮🇳 +91</span><input defaultValue="98765 43210" /></div></label><label>Your family name<input defaultValue="Sharma family" /></label><label className="settings-wide">Where are you celebrating?<input defaultValue="Jaipur, Rajasthan" /></label></div><div className="settings-actions"><span>{saved ? 'Your lovely details have been saved.' : 'Your information is only shared with people you choose.'}</span><button className="button button--primary" onClick={() => setSaved(true)}>{saved ? 'Saved ✓' : 'Save your changes'}</button></div></section>
      <section className="content-card preferences-card"><div><h3>A little note from Utsav</h3><p>Get kind reminders, RSVP updates, and planning inspiration in your inbox.</p></div><label className="switch"><input type="checkbox" defaultChecked /><span /></label></section>
    </div>
  );
}

export function AdminPage() {
  const [vendorsToReview, setVendorsToReview] = useState([
    { name: 'Saffron & Sage Catering', category: 'Catering', submitted: 'Today, 9:42 am', location: 'Jaipur', status: 'Needs review', initials: 'SS' },
    { name: 'The Courtyard Palace', category: 'Wedding venues', submitted: 'Yesterday', location: 'Udaipur', status: 'Needs review', initials: 'CP' },
    { name: 'Golden Hour Studio', category: 'Photography', submitted: '6 Nov 2026', location: 'Jaipur', status: 'Needs review', initials: 'GH' },
  ]);
  const [showReviewed, setShowReviewed] = useState(false);
  const pending = vendorsToReview.filter((vendor) => vendor.status === 'Needs review');
  return (
    <div className="screen-stack">
      <section className="admin-welcome"><div><span className="eyebrow">FRIDAY, 6 NOVEMBER 2026 · ADMIN CONSOLE</span><h2>A little order behind all the magic.</h2><p>Here’s how the Utsav community is coming together today.</p></div><span className="admin-welcome-mark">✳</span></section>
      <section className="admin-stat-grid">
        <article className="admin-stat"><span className="stat-icon stat-icon--rose"><Icon name="users" /></span><span className="stat-label">COMMUNITY MEMBERS</span><strong>2,486</strong><small><b>↑ 12%</b> from last month</small></article>
        <article className="admin-stat"><span className="stat-icon stat-icon--gold"><Icon name="store" /></span><span className="stat-label">VERIFIED VENDORS</span><strong>318</strong><small><b>+18</b> joined this month</small></article>
        <article className="admin-stat"><span className="stat-icon stat-icon--sage"><Icon name="calendar" /></span><span className="stat-label">CELEBRATIONS PLANNED</span><strong>742</strong><small><b>86</b> happening this month</small></article>
        <article className="admin-stat admin-stat--attention"><span className="stat-icon stat-icon--lavender"><Icon name="sparkle" /></span><span className="stat-label">READY FOR YOUR EYES</span><strong>{pending.length.toString().padStart(2, '0')}</strong><small>Vendor applications to review</small></article>
      </section>
      <section className="content-card admin-review-card">
        <div className="list-toolbar"><div><SectionHeading title="Good people, ready to join" /><p className="section-description">A thoughtful review helps families find vendors they can trust.</p></div><button className="text-button" onClick={() => setShowReviewed((value) => !value)}>{showReviewed ? 'Show applications to review' : 'View the verification guide'} <span>→</span></button></div>
        {showReviewed && <div className="verification-note"><span>✦</span><p><strong>A quick check goes a long way.</strong> Look for a valid business identity, a clear portfolio, and current contact details before approving a vendor.</p></div>}
        <div className="admin-vendor-list">{vendorsToReview.map((vendor) => <article className="admin-vendor-row" key={vendor.name}><span className="admin-vendor-avatar">{vendor.initials}</span><span className="admin-vendor-name"><strong>{vendor.name}</strong><small>{vendor.category} · {vendor.location}</small></span><span className="admin-submitted">{vendor.submitted}</span><StatusPill status={vendor.status} />{vendor.status === 'Needs review' ? <div className="admin-actions"><button className="button button--outline" onClick={() => setVendorsToReview((items) => items.map((item) => item.name === vendor.name ? { ...item, status: 'Needs changes' } : item))}>Request changes</button><button className="button button--primary" onClick={() => setVendorsToReview((items) => items.map((item) => item.name === vendor.name ? { ...item, status: 'Verified' } : item))}>Approve vendor</button></div> : <strong className={`review-result ${vendor.status === 'Verified' ? 'review-result--verified' : ''}`}>{vendor.status}</strong>}</article>)}</div>
        {!vendorsToReview.length && <div className="empty-state"><strong>Every application has found its way.</strong><p>New vendor applications will appear here.</p></div>}
      </section>
      <div className="tip-banner"><span>✦</span><p><strong>Your marketplace, your standards.</strong> Clear, kind reviews help build a safer and more welcoming community for everyone.</p></div>
    </div>
  );
}

export function VendorDashboardPage() {
  const [requests, setRequests] = useState([
    { id: 'q1', name: 'Meera Sharma', event: 'Aarav & Meera’s Wedding', date: '18 Dec 2026', guests: '250 guests', type: 'Wedding venue', status: 'New request', initials: 'MS' },
    { id: 'q2', name: 'Ritika Jain', event: 'An intimate winter wedding', date: '22 Dec 2026', guests: '120 guests', type: 'Venue & catering', status: 'New request', initials: 'RJ' },
    { id: 'q3', name: 'Kabir Mehta', event: 'The Mehta family sangeet', date: '3 Jan 2027', guests: '180 guests', type: 'Wedding venue', status: 'Replied', initials: 'KM' },
  ]);
  const [availability, setAvailability] = useState(true);
  const [period, setPeriod] = useState('This month');
  return (
    <div className="screen-stack">
      <section className="vendor-welcome"><div><span className="eyebrow">YOUR LITTLE CORNER OF UTSAV</span><h2>Good morning, Marigold House <span>✦</span></h2><p>Let’s make room for a few more beautiful memories.</p></div><div className="availability-toggle"><span className={`availability-dot ${availability ? 'availability-dot--on' : ''}`} /><span><strong>{availability ? 'Taking enquiries' : 'Not taking enquiries'}</strong><small>{availability ? 'You’re visible to families' : 'You’re temporarily hidden'}</small></span><label className="switch"><input type="checkbox" checked={availability} onChange={(event) => setAvailability(event.target.checked)} /><span /></label></div></section>
      <section className="vendor-stats-grid"><article className="vendor-stat-card"><span>NEW ENQUIRIES</span><strong>12</strong><small><b>+4</b> this week</small><span className="vendor-stat-icon">✉</span></article><article className="vendor-stat-card"><span>PROFILE VISITS</span><strong>1,284</strong><small><b>↑ 18%</b> from last month</small><span className="vendor-stat-icon">◉</span></article><article className="vendor-stat-card"><span>YOUR RATING</span><strong>4.9 <i>★</i></strong><small>From 86 lovely reviews</small><span className="vendor-stat-icon">✦</span></article><article className="vendor-stat-card"><span>BOOKINGS THIS MONTH</span><strong>08</strong><small>3 dates still available</small><span className="vendor-stat-icon">⌂</span></article></section>
      <section className="content-card vendor-requests-card"><div className="list-toolbar"><div><SectionHeading title="A few families would love to meet you" /><p className="section-description">A warm reply is often the beginning of something wonderful.</p></div><button className="button button--outline" onClick={() => setPeriod((current) => current === 'This month' ? 'All time' : 'This month')}>{period} <Icon name="chevron" size={14} /></button></div><div className="vendor-request-list">{requests.map((request) => <article className="vendor-request-row" key={request.id}><span className="avatar avatar--request">{request.initials}</span><div className="request-copy"><strong>{request.name}</strong><span>{request.event}</span><small>{request.type} <i>·</i> {request.date} <i>·</i> {request.guests}</small></div><StatusPill status={request.status === 'New request' ? 'Pending' : request.status === 'Replied' ? 'Confirmed' : 'Declined'} />{request.status === 'New request' ? <div className="request-actions"><button className="button button--outline" onClick={() => setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: 'Passed' } : item))}>Not for me</button><button className="button button--primary" onClick={() => setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: 'Replied' } : item))}>Accept request →</button></div> : <strong className="request-result">{request.status === 'Replied' ? 'Request accepted ✓' : 'Request passed'}</strong>}</article>)}</div><button className="text-button vendor-request-more">See all your enquiries →</button></section>
      <div className="tip-banner"><span>✦</span><p><strong>Your next great review starts with a reply.</strong> Families appreciate a quick note, even when a date isn’t available.</p></div>
    </div>
  );
}

export function GuestInvitationPage() {
  const { token } = useParams();
  const [response, setResponse] = useState('');
  const [guestName, setGuestName] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="guest-portal">
      <div className="guest-portal-brand"><span className="brand-mark">u</span><span className="brand-word">utsav<span>.</span></span></div>
      {!submitted ? <section className="guest-invitation-card"><div className="guest-invitation-art"><span>TOGETHER WITH THEIR FAMILIES</span><i>✿</i><h1>Aarav<br /><em>&</em> Meera</h1><b>INVITE YOU TO CELEBRATE</b><strong>THEIR WEDDING</strong><small>18 DECEMBER 2026 · JAIPUR</small></div><div className="guest-invitation-content"><span className="eyebrow">A LITTLE NOTE, JUST FOR YOU</span><h2>It wouldn’t be the same without you.</h2><p>We’d love for you to join us as we celebrate a day full of love, laughter, and all our favourite people.</p><div className="guest-event-details"><span><small>THE DAY</small><strong>Friday, 18 December 2026</strong></span><span><small>THE PLACE</small><strong>The Marigold House, Jaipur</strong></span></div><form className="guest-rsvp-form" onSubmit={(event) => { event.preventDefault(); if (response && guestName.trim()) setSubmitted(true); }}><label>Your name<input required value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="The name on your invitation" /></label><span className="rsvp-question">Will you be joining us?</span><div className="rsvp-options"><button type="button" className={response === 'joyfully' ? 'rsvp-option rsvp-option--selected' : 'rsvp-option'} onClick={() => setResponse('joyfully')}><span>☺</span><strong>Joyfully accepts</strong><small>Save a dance for us</small></button><button type="button" className={response === 'regretfully' ? 'rsvp-option rsvp-option--selected' : 'rsvp-option'} onClick={() => setResponse('regretfully')}><span>♡</span><strong>Regretfully declines</strong><small>We’ll be there in spirit</small></button></div>{response === 'joyfully' && <label>How many will be joining you?<select value={partySize} onChange={(event) => setPartySize(event.target.value)}><option value="1">Just me</option><option value="2">Two of us</option><option value="3">Three of us</option><option value="4">Four of us</option></select></label>}<button type="submit" className="button button--primary guest-rsvp-submit" disabled={!response || !guestName.trim()}>Send your RSVP with love →</button><small className="guest-token-note">Invitation {token ? `#${token.slice(0, 8)}` : ''} · Kindly reply by 20 November</small></form></div></section> : <section className="guest-thank-you"><span>✿</span><p className="eyebrow">YOUR REPLY IS SAFELY WITH US</p><h1>{response === 'joyfully' ? 'We can’t wait to see you.' : 'You’ll be there in spirit.'}</h1><p>Thank you, {guestName}. Aarav and Meera will be so happy to hear from you.</p>{response === 'joyfully' && <small>{partySize === '1' ? 'Just you' : `${partySize} guests`} joining the celebration</small>}<div className="guest-thank-you-signature">With love,<br /><strong>Aarav & Meera</strong></div></section>}
      <footer className="guest-portal-footer">MADE WITH LOVE, SHARED WITH UTSAV <span>✦</span></footer>
    </main>
  );
}
