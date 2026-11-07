import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { formatCurrency, formatDate, initialTasks } from '../../data/workspaceData';
import { Icon } from '../../layouts/WorkspaceLayout';
import type { EventRecord, GuestRecord } from '../../types/workspace.types';
import { usePersistentState } from '../../hooks/usePersistentState';
import { guestsApi } from '../../features/guests/api/guestsApi';
import { guestGroupsApi, type GuestGroup } from '../../features/guests/api/guestGroupsApi';
import { AssignFunctionsModal } from '../../features/guests/components/AssignFunctionsModal';
import type { Guest } from '../../types/guest.types';
import { bookingsApi } from '../../features/bookings/api/bookingsApi';
import type { Booking } from '../../types/booking.types';
import { paymentsApi } from '../../features/payments/api/paymentsApi';
import { vendorsApi } from '../../features/vendors/api/vendorsApi';
import { venuesApi } from '../../features/venues/api/venuesApi';
import type { Vendor } from '../../types/vendor.types';
import type { Venue } from '../../types/venue.types';
import {
  budgetApi,
  type CreateBudgetCategoryInput,
  type CreateExpenseInput,
  type EventBudget,
} from '../../features/budget/api/budgetApi';
import { rsvpApi, type GuestInvitation } from '../../features/rsvp/api/rsvpApi';
import { invitationsApi, type InvitationTemplate } from '../../features/invitations/api/invitationsApi';
import {
  adminApi,
  type AdminAuditLog,
  type AdminDashboard,
  type AdminUser,
  type AdminVendor,
} from '../../features/admin/api/adminApi';
import { AdminMonitoringTables } from '../../features/admin/components/AdminMonitoringTables';
import { AuditLogTable } from '../../features/admin/components/AuditLogTable';
import { UserManagementTable } from '../../features/admin/components/UserManagementTable';
import { quotationsApi } from '../../features/quotations/api/quotationsApi';
import type { Quotation } from '../../types/quotation.types';
import { functionsApi, type EventFunction, type EventFunctionInput } from '../../features/events/api/functionsApi';
import {
  vendorManagementApi,
  type PortfolioItem,
  type VendorAvailability,
  type VendorPackage,
  type VendorService,
} from '../../features/vendors/api/vendorManagementApi';
import { vendorStaffApi, type VendorStaffMember } from '../../features/vendors/api/vendorStaffApi';
import { useAuth } from '../../hooks/useAuth';
import {
  workspaceApi,
  type WorkspaceMember,
  type WorkspacePermission,
  type WorkspaceMemberRole,
} from '../../features/workspace/api/workspaceApi';

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

let razorpayScriptPromise: Promise<void> | undefined;

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = undefined;
      reject(new Error('Unable to load Razorpay Checkout. Please try again.'));
    };
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

type WorkspaceContext = {
  events: EventRecord[];
  openCreateEvent: () => void;
  eventsLoading: boolean;
  eventError: string;
  isAuthenticated: boolean;
  saveEvent: (event: EventRecord) => Promise<void>;
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

type BookingCard = {
  id?: string;
  vendor: string;
  service: string;
  amount: number;
  status: string;
  icon: string;
  tone: string;
};

type MarketplaceCard = {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: string;
  price: string;
  icon: string;
  tone: string;
  vendorId?: string;
};

function toBookingCard(booking: Booking): BookingCard {
  return {
    id: booking.id,
    vendor: booking.vendorName ?? booking.vendorId,
    service: `${booking.serviceName} · ${formatDate(booking.eventDate)}`,
    amount: booking.amount,
    status: booking.status === 'requested' ? 'Enquiry sent'
      : booking.status === 'confirmed' ? 'Confirmed'
        : booking.status === 'cancelled' ? 'Cancelled' : 'Completed',
    icon: '✦',
    tone: 'rose',
  };
}

function toVendorCard(vendor: Vendor): MarketplaceCard {
  const category = vendor.category.toLowerCase();
  return {
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    location: vendor.city,
    rating: vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New',
    price: vendor.startingPrice ? `From ${formatCurrency(vendor.startingPrice)}` : 'Contact for pricing',
    icon: category.includes('venue') ? '⌂' : category.includes('flower') || category.includes('decor') ? '✿' : '✦',
    tone: category.includes('venue') ? 'rose' : category.includes('flower') || category.includes('decor') ? 'sage' : 'gold',
    vendorId: vendor.id,
  };
}

function toVenueCard(venue: Venue): MarketplaceCard {
  return {
    id: venue.id,
    name: venue.name,
    category: 'Wedding venues',
    location: venue.city,
    rating: 'New',
    price: `${formatCurrency(venue.pricePerDay)} / day`,
    icon: '⌂',
    tone: 'rose',
  };
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
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks, taskStorageError] = usePersistentState('utsav-planning-tasks', initialTasks, isTaskList);
  const [confirmedGuests, setConfirmedGuests] = useState(0);
  const activeEvent = events[0];
  const totalBudget = events.reduce((sum, event) => sum + event.budget, 0);
  const totalSpent = events.reduce((sum, event) => sum + event.spent, 0);
  const completedTasks = tasks.filter((task) => task.done).length;
  const firstName = user?.name?.trim().split(/\s+/).filter(Boolean)[0] ?? 'there';

  useEffect(() => {
    if (!isAuthenticated || !activeEvent) {
      setConfirmedGuests(0);
      return;
    }
    let active = true;
    guestsApi.list(activeEvent.id)
      .then((result) => {
        if (active) setConfirmedGuests(result.filter((guest) => guest.rsvpStatus === 'attending').length);
      })
      .catch(() => {
        if (active) setConfirmedGuests(0);
      });
    return () => { active = false; };
  }, [activeEvent?.id, isAuthenticated]);

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div><h2>Good morning, {firstName} <span className="wave">✦</span></h2><p>Big moments are made of little details. You’re doing wonderfully.</p></div>
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
  const { events, openCreateEvent, eventsLoading, eventError } = useWorkspace();
  const [filter, setFilter] = useState('All events');
  const navigate = useNavigate();
  const filtered = events.filter((event) => filter === 'All events' || event.status === filter);
  return (
    <div className="screen-stack">
      <section className="intro-banner intro-banner--rose"><span className="intro-sparkle">✳</span><div><h2>Every celebration starts somewhere.</h2><p>Keep all your plans, people, and precious details in one happy place.</p></div><button className="button button--primary" onClick={openCreateEvent}><Icon name="plus" size={16} />Plan a new event</button></section>
      <section className="content-card list-card">
        {eventError && <p className="form-error" role="alert">{eventError}</p>}
        {eventsLoading && <p role="status">Loading your events…</p>}
        <div className="list-toolbar"><div><SectionHeading title="Your celebrations" /><p className="section-description">{events.length} moments, each one your own.</p></div><div className="filter-tabs">{['All events', 'Planning', 'Confirmed', 'Completed'].map((item) => <button key={item} className={filter === item ? 'filter-tab filter-tab--active' : 'filter-tab'} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="event-table">
          <div className="table-header event-table-row"><span>CELEBRATION</span><span>DATE & PLACE</span><span>GUESTS</span><span>PLANNING BUDGET</span><span>STATUS</span><span /></div>
          {filtered.map((event) => <div className="event-table-row" key={event.id}>
            <div className="table-event-name"><EventMark event={event} /><span><strong>{event.name}</strong><small>{event.type}</small></span></div>
            <span className="table-secondary">{formatDate(event.date)}<small>{event.location}</small></span>
            <span className="table-secondary">{event.guests || '—'}<small>people invited</small></span>
            <span className="table-secondary">{event.budget ? formatCurrency(event.budget) : 'Not set'}<small>{event.spent ? `${formatCurrency(event.spent)} committed` : 'Add a budget'}</small></span>
            <StatusPill status={event.status} /><button className="button button--outline" onClick={() => navigate(`/events/${event.id}/functions`)}>Functions</button><button className="plain-icon row-open" aria-label={`Open ${event.name}`}>↗</button>
          </div>)}
          {!filtered.length && <div className="empty-state"><span>✿</span><strong>No celebrations here just yet.</strong><p>When you add an event, it’ll find its place right here.</p><button className="button button--primary" onClick={openCreateEvent}>Plan a celebration</button></div>}
        </div>
      </section>
      <div className="tip-banner"><span>✦</span><p><strong>A little planning tip</strong> Give each celebration its own event. It makes guests, budgets, and bookings much easier to manage.</p></div>
    </div>
  );
}

export function EventFunctionsPage() {
  const { events, eventsLoading, isAuthenticated } = useWorkspace();
  const { eventId } = useParams();
  const event = events.find((item) => item.id === eventId) ?? (!eventId ? events[0] : undefined);
  const [functions, setFunctions] = useState<EventFunction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<EventFunction | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const loadFunctions = async (targetEventId: string) => {
    setLoading(true);
    setError('');
    try {
      setFunctions(await functionsApi.list(targetEventId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load event functions.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (event) void loadFunctions(event.id);
    else setFunctions([]);
  }, [event?.id]);
  const saveFunction = async (input: EventFunctionInput) => {
    if (!event) throw new Error('Choose an event before creating a function.');
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const updated = await functionsApi.update(editing.id, input);
        setFunctions((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await functionsApi.create(event.id, input);
        setFunctions((current) => [...current, created].sort((a, b) => a.date.localeCompare(b.date)));
      }
      setEditing(null);
      setCreating(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this function.');
      throw cause;
    } finally {
      setSaving(false);
    }
  };
  const removeFunction = async (item: EventFunction) => {
    if (!window.confirm(`Delete the ${item.name} function?`)) return;
    setError('');
    try {
      await functionsApi.remove(item.id);
      setFunctions((current) => current.filter((entry) => entry.id !== item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete this function.');
    }
  };
  return (
    <div className="screen-stack">
      <section className="intro-banner intro-banner--rose"><span className="intro-sparkle">✿</span><div><h2>Every part of the day has its own story.</h2><p>{event ? `Organise the functions for ${event.name}.` : 'Choose or create an event before adding functions.'}</p></div><button className="button button--primary" disabled={!event || eventsLoading || !isAuthenticated} onClick={() => setCreating(true)}><Icon name="plus" size={16} />Add a function</button></section>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!isAuthenticated && <p className="form-error" role="alert">Sign in to manage event functions.</p>}
      {eventsLoading && <p role="status">Loading your events…</p>}
      {!eventsLoading && isAuthenticated && !event && <p className="empty-state">Create an event before adding functions.</p>}
      {loading && <p role="status">Loading event functions…</p>}
      {event && <section className="content-card list-card"><div className="list-toolbar"><div><SectionHeading title={`${event.name} functions`} /><p className="section-description">Each function can have its own date, venue, guest count, and notes.</p></div></div><div className="event-table">
        <div className="table-header event-table-row"><span>FUNCTION</span><span>DATE & VENUE</span><span>GUESTS</span><span>NOTES</span><span /></div>
        {functions.map((item) => <div className="event-table-row" key={item.id}><strong>{item.name}</strong><span className="table-secondary">{formatDate(item.date)}<small>{item.venue || 'Venue not set'}</small></span><span className="table-secondary">{item.guestCount}</span><span className="table-secondary">{item.notes || '—'}</span><span><button className="button button--outline" onClick={() => setEditing(item)}>Edit</button><button className="plain-icon" aria-label={`Delete ${item.name}`} onClick={() => void removeFunction(item)}>×</button></span></div>)}
        {!functions.length && !loading && <div className="empty-state"><strong>No functions added yet.</strong><p>Add events such as Haldi, Mehendi, or the reception.</p></div>}
      </div></section>}
      {(creating || editing) && <EventFunctionModal eventDate={event?.date ?? ''} initial={editing ?? undefined} saving={saving} onClose={() => { setCreating(false); setEditing(null); }} onSave={saveFunction} />}
    </div>
  );
}

function EventFunctionModal({
  eventDate,
  initial,
  saving,
  onClose,
  onSave,
}: {
  eventDate: string;
  initial?: EventFunction;
  saving: boolean;
  onClose: () => void;
  onSave: (input: EventFunctionInput) => Promise<void>;
}) {
  const [error, setError] = useState('');
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="event-function-title"><div className="modal-top"><span className="modal-kicker"><Icon name="calendar" size={16} /> A moment within your celebration</span><button className="plain-icon" aria-label="Close" disabled={saving} onClick={onClose}><Icon name="close" /></button></div><h2 id="event-function-title">{initial ? 'Update this function.' : 'Add a function.'}</h2><form className="event-form" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setError(''); try { await onSave({ name: String(data.get('name') ?? '').trim(), date: String(data.get('date') ?? ''), venue: String(data.get('venue') ?? '').trim() || undefined, guestCount: Number(data.get('guestCount') ?? 0), notes: String(data.get('notes') ?? '').trim() || undefined }); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save this function.'); } }}><label>Function name<input name="name" required minLength={1} maxLength={120} defaultValue={initial?.name} placeholder="e.g. Mehendi" /></label><label>Date<input name="date" type="date" required defaultValue={initial?.date ?? eventDate} /></label><label>Venue<input name="venue" maxLength={255} defaultValue={initial?.venue ?? ''} /></label><label>Guest count<input name="guestCount" type="number" min="0" max="100000" defaultValue={initial?.guestCount ?? 0} /></label><label>Notes<textarea name="notes" rows={3} maxLength={5000} defaultValue={initial?.notes ?? ''} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add function'} <span>→</span></button></div></form></section></div>;
}

export function BookingsPage() {
  const { isAuthenticated } = useWorkspace();
  const [filter, setFilter] = useState('Everything');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingCard[]>([
    { vendor: 'The Marigold House', service: 'Wedding venue · 18 Dec', amount: 420000, status: 'Confirmed', icon: '⌂', tone: 'rose' },
    { vendor: 'Saffron & Sage Catering', service: 'Wedding dinner · 18 Dec', amount: 185000, status: 'Awaiting payment', icon: '✳', tone: 'gold' },
    { vendor: 'House of Petals', service: 'Mehendi decor · 16 Dec', amount: 85000, status: 'Confirmed', icon: '✿', tone: 'sage' },
    { vendor: 'Golden Hour Studio', service: 'Wedding photography · 18 Dec', amount: 65000, status: 'Enquiry sent', icon: '◉', tone: 'lavender' },
  ]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');
  const refreshBookings = async () => {
    const result = await bookingsApi.list();
    setBookings(result.map(toBookingCard));
  };
  const startPayment = async (booking: BookingCard) => {
    if (!booking.id) return;
    setPaymentBookingId(booking.id);
    setPaymentError('');
    setPaymentNotice('');
    try {
      const checkout = await paymentsApi.createCheckout(booking.id);
      await loadRazorpayCheckout();
      if (!window.Razorpay) {
        razorpayScriptPromise = undefined;
        throw new Error('Razorpay Checkout did not initialize. Please try again.');
      }
      const modal = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: 'Utsav',
        description: `Payment for ${booking.vendor}`,
        order_id: checkout.orderId,
        theme: { color: '#8a3d50' },
        modal: {
          ondismiss: () => setPaymentBookingId(null),
        },
        handler: async (response) => {
          try {
            await paymentsApi.verifyCheckout(response);
            setPaymentNotice(`Payment received for ${booking.vendor}.`);
            await refreshBookings();
          } catch (error: unknown) {
            setPaymentError(error instanceof Error ? error.message : 'Payment verification failed.');
          } finally {
            setPaymentBookingId(null);
          }
        },
      });
      modal.on('payment.failed', (response) => {
        setPaymentError(response.error?.description ?? 'Payment was not completed. You can try again.');
        setPaymentBookingId(null);
      });
      modal.open();
    } catch (error: unknown) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to start checkout.');
      setPaymentBookingId(null);
    }
  };
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setBookingLoading(true);
    setBookingError('');
    bookingsApi.list()
      .then((result) => {
        if (active) {
          setBookings(result.map(toBookingCard));
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setBookings([]);
          setBookingError(error instanceof Error ? error.message : 'Unable to load your bookings.');
        }
      })
      .finally(() => {
        if (active) setBookingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);
  const filtered = bookings.filter((booking) => filter === 'Everything' || booking.status === filter);
  return (
    <div className="screen-stack">
      <section className="intro-banner intro-banner--rose"><span className="intro-sparkle">✦</span><div><h2>Good plans deserve good people.</h2><p>Keep every vendor conversation and confirmed detail close at hand.</p></div><button className="button button--primary" onClick={() => navigate('/vendors')}>Find a vendor <span>→</span></button></section>
      <section className="content-card list-card">
        {bookingError && <p className="form-error" role="alert">{bookingError}</p>}
        {paymentError && <p className="form-error" role="alert">{paymentError}</p>}
        {paymentNotice && <p className="payment-notice" role="status">{paymentNotice}</p>}
        {bookingLoading && <p role="status">Loading your bookings…</p>}
        <div className="list-toolbar"><div><SectionHeading title="Your vendor plans" /><p className="section-description">A clear view of what’s booked and what’s next.</p></div><div className="filter-tabs">{['Everything', 'Confirmed', 'Awaiting payment', 'Enquiry sent'].map((item) => <button key={item} className={filter === item ? 'filter-tab filter-tab--active' : 'filter-tab'} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="booking-list">
          {filtered.map((booking) => (
            <article className={`booking-item ${expandedBooking === booking.vendor ? 'booking-item--expanded' : ''}`} key={booking.id ?? booking.vendor}>
              <div className="booking-row">
                <span className={`category-icon category-icon--${booking.tone}`}>{booking.icon}</span>
                <div className="booking-vendor"><strong>{booking.vendor}</strong><small>{booking.service}</small></div>
                <div className="booking-amount"><strong>{formatCurrency(booking.amount)}</strong><small>Agreed estimate</small></div>
                <StatusPill status={booking.status} />
                <div className="booking-actions">
                  {booking.id && booking.status === 'Confirmed' && (
                    <button className="button button--primary booking-details" disabled={paymentBookingId !== null} onClick={() => void startPayment(booking)}>
                      {paymentBookingId === booking.id ? 'Opening checkout…' : 'Pay now'}
                    </button>
                  )}
                  <button className="button button--outline booking-details" aria-expanded={expandedBooking === booking.vendor} onClick={() => setExpandedBooking((current) => current === booking.vendor ? null : booking.vendor)}>
                    {expandedBooking === booking.vendor ? 'Hide details' : 'View details'} <span>{expandedBooking === booking.vendor ? '−' : '+'}</span>
                  </button>
                </div>
              </div>
              {expandedBooking === booking.vendor && <div className="booking-expanded"><span><small>YOUR CELEBRATION</small><strong>Aarav & Meera’s wedding</strong></span><span><small>BOOKING REFERENCE</small><strong>UTS-{booking.vendor.slice(0, 3).toUpperCase()}-2026</strong></span><span><small>NEXT STEP</small><strong>{booking.status === 'Confirmed' ? 'Review your payment schedule' : 'Follow up with this vendor'}</strong></span></div>}
            </article>
          ))}
          {!filtered.length && <div className="empty-state"><strong>Nothing in this category just yet.</strong><p>Your plans will show up here as they come together.</p></div>}
        </div>
      </section>
      <div className="tip-banner"><span>✦</span><p><strong>A note worth keeping</strong> Confirm the date, inclusions, and payment schedule with each vendor before making a booking.</p></div>
    </div>
  );
}

export function GuestsPage() {
  const { events, isAuthenticated } = useWorkspace();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Everyone');
  const [guestList, setGuestList] = useState<GuestRecord[]>([]);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestRecord | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [guestNotice, setGuestNotice] = useState('');
  const [importingGuests, setImportingGuests] = useState(false);
  const [eventFunctions, setEventFunctions] = useState<EventFunction[]>([]);
  const [assigningGuest, setAssigningGuest] = useState<GuestRecord | null>(null);
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<string[]>([]);
  const [savingFunctionAssignment, setSavingFunctionAssignment] = useState(false);
  const [functionAssignmentError, setFunctionAssignmentError] = useState('');
  const activeEvent = events[0];

  useEffect(() => {
    if (!isAuthenticated) {
      setGuestList([]);
      setGuestError('');
      return;
    }
    if (!activeEvent) {
      setGuestList([]);
      return;
    }
    let active = true;
    setGuestLoading(true);
    setGuestError('');
    guestsApi.list(activeEvent.id)
      .then((result) => {
        if (active) setGuestList(result.map(toGuestRecord));
      })
      .catch((error: unknown) => {
        if (active) {
          setGuestList([]);
          setGuestError(error instanceof Error ? error.message : 'Unable to load your guests.');
        }
      })
      .finally(() => {
        if (active) setGuestLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeEvent?.id, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeEvent) {
      setEventFunctions([]);
      return;
    }
    let active = true;
    functionsApi.list(activeEvent.id)
      .then((result) => {
        if (active) setEventFunctions(result);
      })
      .catch((cause: unknown) => {
        if (active) setGuestError(cause instanceof Error ? cause.message : 'Unable to load event functions.');
      });
    return () => {
      active = false;
    };
  }, [activeEvent?.id, isAuthenticated]);

  const addGuest = async (guest: GuestRecord) => {
    if (!isAuthenticated) throw new Error('Sign in before saving guests to your account.');
    if (!activeEvent) throw new Error('Create an event before adding guests.');
    const saved = await guestsApi.create(activeEvent.id, {
      name: guest.name,
      email: guest.email,
      group: guest.group,
    });
    setGuestList((current) => [toGuestRecord(saved), ...current]);
    setGuestModalOpen(false);
  };
  const updateGuest = async (guest: GuestRecord) => {
    if (!guest.id) throw new Error('This guest is not linked to a saved record.');
    const saved = await guestsApi.update(guest.id, {
      name: guest.name,
      email: guest.email || undefined,
      group: guest.group || undefined,
    });
    setGuestList((current) => current.map((item) => item.id === saved.id ? toGuestRecord(saved) : item));
    setEditingGuest(null);
    setGuestModalOpen(false);
  };
  const removeGuest = async (guest: GuestRecord) => {
    if (!guest.id || !window.confirm(`Remove ${guest.name} from this guest list?`)) return;
    setGuestError('');
    setGuestNotice('');
    try {
      await guestsApi.remove(guest.id);
      setGuestList((current) => current.filter((item) => item.id !== guest.id));
      setGuestNotice(`${guest.name} was removed from the guest list.`);
    } catch (cause) {
      setGuestError(cause instanceof Error ? cause.message : 'Unable to remove this guest.');
    }
  };
  const shareGuestInvitation = async (guest: GuestRecord, renew = false) => {
    if (!guest.id || !guest.invitationToken) return;
    setGuestError('');
    setGuestNotice('');
    try {
      let token = guest.invitationToken;
      if (renew) {
        const result = await guestsApi.rotateInvitationToken(guest.id);
        token = result.invitationToken;
        setGuestList((current) => current.map((item) => item.id === guest.id ? { ...item, invitationToken: token } : item));
      }
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${encodeURIComponent(token)}`);
      setGuestNotice(`${renew ? 'A new invitation link was created and copied' : 'Invitation link copied'} for ${guest.name}.`);
    } catch (cause) {
      setGuestError(cause instanceof Error ? cause.message : 'Unable to copy the invitation link.');
    }
  };
  const openFunctionAssignment = (guest: GuestRecord) => {
    setGuestError('');
    setFunctionAssignmentError('');
    setSelectedFunctionIds(guest.invitedFunctionIds ?? eventFunctions.map((item) => item.id));
    setAssigningGuest(guest);
  };
  const saveFunctionAssignment = async () => {
    if (!assigningGuest?.id) return;
    setSavingFunctionAssignment(true);
    setFunctionAssignmentError('');
    try {
      const invitedFunctionIds = await guestsApi.assignFunctions(assigningGuest.id, selectedFunctionIds);
      setGuestList((current) => current.map((item) =>
        item.id === assigningGuest.id ? { ...item, invitedFunctionIds } : item,
      ));
      setAssigningGuest(null);
      setGuestNotice(`Invitation functions updated for ${assigningGuest.name}.`);
    } catch (cause) {
      setFunctionAssignmentError(cause instanceof Error ? cause.message : 'Unable to update invitation functions.');
    } finally {
      setSavingFunctionAssignment(false);
    }
  };
  const importGuests = async (file: File | undefined) => {
    if (!file) return;
    if (!isAuthenticated || !activeEvent) {
      setGuestError('Sign in and create an event before importing guests.');
      return;
    }
    setImportingGuests(true);
    setGuestError('');
    try {
      const result = await guestsApi.importCsv(activeEvent.id, file);
      setGuestList((current) => [...result.guests.map(toGuestRecord), ...current]);
    } catch (cause) {
      setGuestError(cause instanceof Error ? cause.message : 'Unable to import this guest file.');
    } finally {
      setImportingGuests(false);
    }
  };
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
        <div className="guest-summary"><span>YOUR CELEBRATION</span><strong>{activeEvent ? formatDate(activeEvent.date).split(' ').slice(0, 2).join(' ') : 'Add'}<small>{activeEvent ? activeEvent.date.slice(0, 4) : 'date'}</small></strong><small>{activeEvent ? activeEvent.name : 'Create a celebration'}</small><span className="summary-calendar">{activeEvent ? new Date(`${activeEvent.date}T00:00:00`).getFullYear() : '—'}</span></div>
      </section>
      <section className="content-card guest-list-card">
        {guestError && <p className="form-error" role="alert">{guestError}</p>}
        {guestNotice && <p className="form-success" role="status">{guestNotice}</p>}
        {guestLoading && <p role="status">Loading your guest list…</p>}
        {isAuthenticated && !activeEvent && <p role="status">Create an event before managing its guest list.</p>}
        <div className="list-toolbar"><div><SectionHeading title="The people who make it special" /><p className="section-description">A warm welcome begins with knowing who’s coming.</p></div><button className="button button--primary" disabled={isAuthenticated && !activeEvent} onClick={() => { setEditingGuest(null); setGuestModalOpen(true); }}><Icon name="plus" size={16} />Add a guest</button></div>
        <div className="guest-tools"><div className="inline-search"><Icon name="search" size={17} /><input placeholder="Find someone by name or email" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="filter-tabs">{['Everyone', 'Confirmed', 'Maybe', 'Pending', 'Declined'].map((item) => <button key={item} className={status === item ? 'filter-tab filter-tab--active' : 'filter-tab'} onClick={() => setStatus(item)}>{item}</button>)}</div>{isAuthenticated && <label className="button button--outline">↑ <span>{importingGuests ? 'Importing…' : 'Import CSV'}</span><input type="file" accept=".csv,text/csv" disabled={importingGuests || !activeEvent} onChange={(event) => { void importGuests(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} hidden /></label>}<button className="button button--outline" onClick={exportGuestList}>↓ <span>Export list</span></button></div>
        <div className="guest-table">
          <div className="guest-table-row guest-table-header"><span>GUEST</span><span>GROUP</span><span>EMAIL ADDRESS</span><span>RSVP</span><span /></div>
          {results.map((guest, index) => <div className="guest-table-row" key={guest.id ?? guest.email ?? guest.name}><div className="guest-name"><span className={`avatar avatar--guest avatar--guest-${index % 4}`}>{guest.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{guest.name}</strong></div><span className="table-secondary">{guest.group}</span><span className="table-secondary">{guest.email}</span><StatusPill status={guest.status} /><div className="guest-row-actions">{guest.id && <><button className="plain-icon" aria-label={`Edit ${guest.name}`} onClick={() => { setEditingGuest(guest); setGuestModalOpen(true); }}>Edit</button>{eventFunctions.length > 0 && <button className="plain-icon" aria-label={`Assign event functions to ${guest.name}`} onClick={() => openFunctionAssignment(guest)}>Functions</button>}<button className="plain-icon" aria-label={`Copy invitation link for ${guest.name}`} onClick={() => void shareGuestInvitation(guest)}>Link</button><button className="plain-icon" aria-label={`Renew invitation link for ${guest.name}`} onClick={() => void shareGuestInvitation(guest, true)}>Renew</button><button className="plain-icon" aria-label={`Remove ${guest.name}`} onClick={() => void removeGuest(guest)}>×</button></>}</div></div>)}
          {!results.length && <div className="empty-state"><strong>No guests found</strong><p>Try a different name or RSVP filter.</p></div>}
        </div>
        <div className="table-footer"><span>Showing {results.length} {results.length === 1 ? 'guest' : 'guests'}</span><span>RSVP details update as your loved ones reply.</span></div>
      </section>
      {guestModalOpen && <AddGuestModal initial={editingGuest ?? undefined} onClose={() => { setGuestModalOpen(false); setEditingGuest(null); }} onAdd={editingGuest ? updateGuest : addGuest} />}
      {assigningGuest && <AssignFunctionsModal
        open
        guestName={assigningGuest.name}
        functions={eventFunctions}
        selectedIds={selectedFunctionIds}
        saving={savingFunctionAssignment}
        error={functionAssignmentError}
        onChange={setSelectedFunctionIds}
        onClose={() => setAssigningGuest(null)}
        onSave={() => void saveFunctionAssignment()}
      />}
    </div>
  );
}

function toGuestRecord(guest: Guest): GuestRecord {
  return {
    id: guest.id,
    invitationToken: guest.invitationToken,
    invitedFunctionIds: guest.invitedFunctionIds,
    name: guest.name,
    group: guest.group ?? '',
    email: guest.email ?? '',
    status: guest.rsvpStatus === 'attending' ? 'Confirmed'
      : guest.rsvpStatus === 'maybe' ? 'Maybe'
        : guest.rsvpStatus === 'declined' ? 'Declined' : 'Pending',
  };
}

function AddGuestModal({ initial, onClose, onAdd }: { initial?: GuestRecord; onClose: () => void; onAdd: (guest: GuestRecord) => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [group, setGroup] = useState(initial?.group ?? 'Friends');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-guest-title">
        <div className="modal-top"><span className="modal-kicker"><Icon name="users" size={16} /> Make room for one more</span><button className="plain-icon" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
        <h2 id="add-guest-title">{initial ? 'Update your guest.' : 'Add someone lovely.'}</h2><p className="modal-description">{initial ? 'Keep their contact and group details up to date.' : 'They’ll be part of the celebration before you know it.'}</p>
        <form className="event-form" onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim() || !email.trim()) { setError('Please add their name and email address.'); return; }
          setSaving(true);
          setError('');
          try {
            await onAdd({ ...initial, name: name.trim(), email: email.trim(), group, status: initial?.status ?? 'Pending' });
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to add this guest. Please try again.');
          } finally {
            setSaving(false);
          }
        }}>
          <label>Guest’s name<input autoFocus placeholder="e.g. Ananya Sharma" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Email address<input type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Add them to a group<select value={group} onChange={(event) => setGroup(event.target.value)}><option>Friends</option><option>Bride’s family</option><option>Groom’s family</option><option>Colleagues</option><option>Other</option></select></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : <>{initial ? 'Save changes' : 'Add to your guest list'} <span>→</span></>}</button></div>
        </form>
      </section>
    </div>
  );
}

export function GuestGroupsPage() {
  const { events, eventsLoading, isAuthenticated } = useWorkspace();
  const navigate = useNavigate();
  const activeEvent = events[0];
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    if (!activeEvent) {
      setGroups([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    guestGroupsApi.list(activeEvent.id).then((result) => {
      if (active) setGroups(result);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to load guest groups.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [activeEvent?.id]);
  const saveGroup = async (name: string) => {
    if (!activeEvent) throw new Error('Create an event before managing guest groups.');
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const updated = await guestGroupsApi.update(editing.id, name);
        setGroups((current) => current.map((group) => group.id === updated.id ? updated : group));
      } else {
        const created = await guestGroupsApi.create(activeEvent.id, name);
        setGroups((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setEditing(null);
      setCreating(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to save this guest group.';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };
  const removeGroup = async (group: GuestGroup) => {
    const message = group.guestCount
      ? `Delete "${group.name}"? Its ${group.guestCount} guest(s) will remain on the guest list without a group.`
      : `Delete "${group.name}"?`;
    if (!window.confirm(message)) return;
    setError('');
    try {
      await guestGroupsApi.remove(group.id);
      setGroups((current) => current.filter((item) => item.id !== group.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete this guest group.');
    }
  };
  return (
    <div className="screen-stack">
      <section className="intro-banner intro-banner--rose"><span className="intro-sparkle">✿</span><div><h2>Your people, in their own circles.</h2><p>{activeEvent ? `Create and organise guest groups for ${activeEvent.name}.` : 'Create an event before adding guest groups.'}</p></div><button className="button button--primary" disabled={!activeEvent || eventsLoading || !isAuthenticated} onClick={() => setCreating(true)}><Icon name="plus" size={16} />Create a group</button></section>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!isAuthenticated && <p className="form-error" role="alert">Sign in to manage guest groups.</p>}
      {eventsLoading && <p role="status">Loading your events…</p>}
      {loading && <p role="status">Loading your guest groups…</p>}
      {!eventsLoading && isAuthenticated && !activeEvent && <div className="empty-state"><strong>No event selected.</strong><p>Create a celebration before managing guest groups.</p></div>}
      {activeEvent && <section className="content-card list-card"><div className="list-toolbar"><div><SectionHeading title={`${activeEvent.name} guest groups`} /><p className="section-description">Guests stay on the guest list when a group is renamed or removed.</p></div><button className="text-button" onClick={() => navigate('/guests')}>Go to guest list <span>→</span></button></div><div className="event-table">
        <div className="table-header event-table-row"><span>GROUP</span><span>GUESTS</span><span /></div>
        {groups.map((group) => <div className="event-table-row" key={group.id}><strong>{group.name}</strong><span className="table-secondary">{group.guestCount} {group.guestCount === 1 ? 'guest' : 'guests'}</span><span><button className="button button--outline" onClick={() => setEditing(group)}>Rename</button><button className="plain-icon" aria-label={`Delete ${group.name}`} onClick={() => void removeGroup(group)}>×</button></span></div>)}
        {!groups.length && !loading && <div className="empty-state"><strong>No groups yet.</strong><p>Add groups such as family, friends, or colleagues.</p></div>}
      </div></section>}
      {(creating || editing) && <GuestGroupModal initialName={editing?.name} saving={saving} onClose={() => { setCreating(false); setEditing(null); }} onSave={saveGroup} />}
    </div>
  );
}

function GuestGroupModal({
  initialName,
  saving,
  onClose,
  onSave,
}: {
  initialName?: string;
  saving: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName ?? '');
  const [error, setError] = useState('');
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="guest-group-title"><div className="modal-top"><span className="modal-kicker"><Icon name="users" size={16} /> Keep your people organised</span><button className="plain-icon" aria-label="Close" disabled={saving} onClick={onClose}><Icon name="close" /></button></div><h2 id="guest-group-title">{initialName ? 'Rename this group.' : 'Create a guest group.'}</h2><form className="event-form" onSubmit={async (event) => { event.preventDefault(); setError(''); try { await onSave(name.trim()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save this group.'); } }}><label>Group name<input autoFocus required minLength={1} maxLength={100} value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="e.g. Friends" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : initialName ? 'Save name' : 'Create group'} <span>→</span></button></div></form></section></div>;
}

export function InvitationsPage() {
  const [selected, setSelected] = useState(0);
  const [templates, setTemplates] = useState<InvitationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { events, eventsLoading, isAuthenticated } = useWorkspace();
  const event = events[0];
  const tones = ['invitation-art--garden', 'invitation-art--gold', 'invitation-art--modern'];

  useEffect(() => {
    let active = true;
    invitationsApi.listTemplates()
      .then((items) => {
        if (active) setTemplates(items);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load invitation designs.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createInvitation = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!event || !templates[selected]) {
      setError(!event ? 'Create an event before starting an invitation.' : 'Choose an available invitation design.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const invitation = await invitationsApi.create({
        eventId: event.id,
        templateId: templates[selected].id,
        title: event.name,
        status: 'draft',
        design: {
          message: 'We would be delighted to celebrate with you.',
          date: event.date,
          venue: event.location,
        },
      });
      navigate(`/invitation-editor?invitation=${encodeURIComponent(invitation.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start your invitation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen-stack">
      <section className="invitation-feature">
        <div className="invitation-feature-copy"><span className="eyebrow">A NOTE FROM THE HEART</span><h2>Some days deserve<br />a beautiful beginning.</h2><p>Choose an invitation that feels like you. Add your details, then share a little joy with everyone you love.</p><button className="button button--light" onClick={() => document.getElementById('invitation-collection')?.scrollIntoView({ behavior: 'smooth' })}>Find your invitation <span>→</span></button></div>
        <div className="invitation-feature-art" aria-hidden="true"><div className="feature-paper"><span>together with their families</span><i>✿</i><strong>Aarav<br /><em>&</em> Meera</strong><small>INVITE YOU TO CELEBRATE</small><b>18 · 12 · 26</b></div><span className="feature-flower feature-flower--a">✿</span><span className="feature-flower feature-flower--b">✽</span></div>
      </section>
      <section className="invitation-section" id="invitation-collection"><div className="section-heading"><div><h2>Find the one that feels like you</h2><p className="section-description">Thoughtfully designed, ready to make your own.</p></div><button className="text-button" onClick={() => navigate('/explore/invitations')}>Explore all designs <span>→</span></button></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading && <p role="status">Finding invitation designs…</p>}
        {!loading && !templates.length && !error && <div className="empty-state"><strong>No invitation designs are available yet.</strong><p>Please check back after the template library is updated.</p></div>}
        <div className="template-grid">{templates.map((template, index) => <button className={`template-card ${selected === index ? 'template-card--selected' : ''}`} onClick={() => setSelected(index)} key={template.id}><div className={`invitation-art ${tones[index % tones.length]}`}><span className="invitation-art-flower">✿</span><small>{template.category}</small><strong>{event?.name ?? 'Your celebration'}</strong><i>✦</i><span>{event ? `${formatDate(event.date)} · ${event.location ?? 'Your chosen place'}` : 'A design made personal'}</span></div><div className="template-info"><div><strong>{template.name}</strong><small>{template.category}{template.price > 0 ? ` · ₹${template.price.toLocaleString('en-IN')}` : ' · FREE'}</small></div><span className="template-radio">{selected === index && <i />}</span></div></button>)}</div></section>
      <section className="invitation-send-card"><span className="send-icon"><Icon name="mail" size={19} /></span><div><strong>{templates[selected] ? `You’ve picked “${templates[selected].name}”` : 'Your invitation starts here'}</strong><p>Personalise the wording and event details before sharing it with your guests.</p></div><button className="button button--primary" onClick={() => void createInvitation()} disabled={saving || loading || (isAuthenticated && (eventsLoading || !event)) || !templates[selected]}>{saving ? 'Starting…' : 'Personalise this design →'}</button></section>
    </div>
  );
}

export function VendorsPage({ category }: { category?: 'venues' }) {
  const { events, eventsLoading, isAuthenticated } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [filter, setFilter] = useState(category ? 'Wedding venues' : 'Everything lovely');
  const [marketplace, setMarketplace] = useState<MarketplaceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<MarketplaceCard | null>(null);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestEventId, setRequestEventId] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestSent, setRequestSent] = useState('');
  useEffect(() => {
    if (!requestEventId && events[0]) setRequestEventId(events[0].id);
  }, [events, requestEventId]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const request = category
      ? venuesApi.list().then((items) => items.map(toVenueCard))
      : Promise.all([vendorsApi.list(), venuesApi.list()]).then(([vendorItems, venueItems]) => [
        ...vendorItems.map(toVendorCard),
        ...venueItems.map(toVenueCard),
      ]);
    request.then((items) => {
      if (active) setMarketplace(items);
    }).catch((cause: unknown) => {
      if (active) {
        setMarketplace([]);
        setError(cause instanceof Error ? cause.message : 'Unable to load the marketplace.');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [category]);
  const filtered = useMemo(() => marketplace.filter((vendor) =>
    `${vendor.name} ${vendor.category} ${vendor.location}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'Everything lovely' || vendor.category === filter),
  ), [filter, marketplace, query]);
  const createQuoteRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const selectedEvent = events.find((item) => item.id === requestEventId);
    if (!selectedVendor?.vendorId || !selectedEvent) {
      setRequestError(!selectedEvent ? 'Choose an event before requesting a quotation.' : 'This listing cannot receive a vendor quotation request.');
      return;
    }
    setRequestSaving(true);
    setRequestError('');
    try {
      await quotationsApi.create({
        eventId: selectedEvent.id,
        vendorId: selectedVendor.vendorId,
        title: requestTitle.trim(),
        items: [],
      });
      setRequestSent(`Your request was sent to ${selectedVendor.name}.`);
      setSelectedVendor(null);
      setRequestTitle('');
    } catch (cause) {
      setRequestError(cause instanceof Error ? cause.message : 'Unable to send your quotation request.');
    } finally {
      setRequestSaving(false);
    }
  };
  return (
    <div className="screen-stack">
      <section className="vendor-search-card">
        <div><span className="eyebrow">GOOD PEOPLE MAKE GREAT MEMORIES</span><h2>Meet the magic-makers.</h2><p>Meet thoughtful local vendors who care about your day as much as you do.</p></div>
        <form className="vendor-search-form" onSubmit={(event) => { event.preventDefault(); setSearchParams(query ? { q: query } : {}); }}><Icon name="search" size={19} /><input aria-label="Search vendors" placeholder="Try “florist” or “Jaipur”" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="button button--primary">Find them</button></form>
        <div className="popular-searches"><span>Little ideas to get you started</span>{['Venues', 'Flowers', 'Photography', 'Catering'].map((item) => <button key={item} onClick={() => { setFilter(item === 'Venues' ? 'Wedding venues' : item === 'Flowers' ? 'Decor & flowers' : item); setQuery(''); }}>{item} <span>↗</span></button>)}</div>
      </section>
      <section className="vendor-section"><div className="section-heading"><div><h2>{category ? 'Places worth gathering' : 'A few lovely finds'}</h2><p className="section-description">Trusted local providers for the day you imagine.</p></div><button className="text-button">View all vendors <span>→</span></button></div><div className="vendor-filter-row"><div className="filter-tabs">{['Everything lovely', 'Wedding venues', 'Catering', 'Decor & flowers'].map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'filter-tab filter-tab--active' : 'filter-tab'}>{item}</button>)}</div><span className="results-note">{filtered.length} thoughtful recommendations</span></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {requestSent && <p className="form-success" role="status">{requestSent}</p>}
        {loading && <p role="status">Finding thoughtful local providers…</p>}
        <div className="vendor-grid">{filtered.map((vendor) => <article className="vendor-card" key={vendor.id}><div className={`vendor-image vendor-image--${vendor.tone}`}><span className="vendor-image-symbol">{vendor.icon}</span><button className="favorite-button" aria-label={`Save ${vendor.name}`} onClick={(event) => event.currentTarget.classList.toggle('is-favorite')}>♡</button><span className="vendor-image-caption">A PLACE TO GATHER</span></div><div className="vendor-card-body"><div className="vendor-category">{vendor.category}<span>✦ {vendor.rating}</span></div><h3>{vendor.name}</h3><p className="vendor-location">⌖ &nbsp;{vendor.location}</p><div className="vendor-card-footer"><strong>{vendor.price}</strong>{vendor.vendorId && <button className="button button--outline" onClick={() => { setSelectedVendor(vendor); setRequestTitle(`Quotation request for ${vendor.name}`); setRequestError(''); }}>Ask for a quote</button>}</div></div></article>)}</div>
        {!filtered.length && <div className="empty-state"><strong>We haven’t found that perfect match yet.</strong><p>Try a different search or explore another category.</p></div>}
      </section>
      <div className="vendor-note"><span>✦</span><p><strong>Good things take a conversation.</strong> Send a no-pressure enquiry to learn about availability and make sure it feels right.</p><button className="text-button">How it works →</button></div>
      {selectedVendor && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !requestSaving) setSelectedVendor(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="quote-request-title"><div className="modal-top"><span className="modal-kicker"><Icon name="mail" size={16} /> Start a conversation</span><button className="plain-icon" aria-label="Close" disabled={requestSaving} onClick={() => setSelectedVendor(null)}><Icon name="close" /></button></div><h2 id="quote-request-title">Ask {selectedVendor.name} for a quotation.</h2><p className="modal-description">{eventsLoading ? 'Loading your event details…' : events.length ? 'Choose the celebration this request is for.' : 'Create an event before sending a quotation request.'}</p><form className="event-form" onSubmit={(event) => void createQuoteRequest(event)}>{isAuthenticated && <label>Celebration<select required value={requestEventId} onChange={(event) => setRequestEventId(event.currentTarget.value)}>{events.map((item) => <option value={item.id} key={item.id}>{item.name} · {formatDate(item.date)}</option>)}</select></label>}<label>What would you like a quote for?<input required minLength={2} value={requestTitle} onChange={(event) => setRequestTitle(event.currentTarget.value)} /></label>{requestError && <p className="form-error" role="alert">{requestError}</p>}<div className="modal-actions"><button type="button" className="button button--quiet" onClick={() => setSelectedVendor(null)} disabled={requestSaving}>Cancel</button><button type="submit" className="button button--primary" disabled={requestSaving || eventsLoading || (isAuthenticated && !events.length)}>{requestSaving ? 'Sending…' : 'Send request'} <span>→</span></button></div></form></section></div>}
    </div>
  );
}

export function BudgetPage() {
  const { events, isAuthenticated } = useWorkspace();
  const event = events[0];
  const [budgetData, setBudgetData] = useState<EventBudget | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetError, setBudgetError] = useState('');
  const [budgetRefreshKey, setBudgetRefreshKey] = useState(0);
  const [budgetModal, setBudgetModal] = useState<{ mode: 'category' } | { mode: 'expense'; categoryId: string } | null>(null);
  const [budgetSaving, setBudgetSaving] = useState(false);
  useEffect(() => {
    if (!isAuthenticated || !event) {
      setBudgetData(null);
      return;
    }
    let active = true;
    setBudgetLoading(true);
    setBudgetError('');
    budgetApi.getForEvent(event.id)
      .then((result) => {
        if (active) setBudgetData(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setBudgetData(null);
          setBudgetError(cause instanceof Error ? cause.message : 'Unable to load your budget.');
        }
      })
      .finally(() => {
        if (active) setBudgetLoading(false);
      });
    return () => {
      active = false;
    };
  }, [event?.id, isAuthenticated, budgetRefreshKey]);
  const saveCategory = async (input: CreateBudgetCategoryInput) => {
    if (!isAuthenticated || !event) {
      const message = 'Sign in and create an event before changing your budget.';
      setBudgetError(message);
      throw new Error(message);
    }
    setBudgetSaving(true);
    setBudgetError('');
    try {
      await budgetApi.createCategory(event.id, input);
      setBudgetModal(null);
      setBudgetRefreshKey((key) => key + 1);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to add this budget category.';
      setBudgetError(message);
      throw new Error(message);
    } finally {
      setBudgetSaving(false);
    }
  };
  const saveExpense = async (input: CreateExpenseInput) => {
    if (!isAuthenticated || !event) {
      const message = 'Sign in and create an event before adding expenses.';
      setBudgetError(message);
      throw new Error(message);
    }
    setBudgetSaving(true);
    setBudgetError('');
    try {
      await budgetApi.createExpense(event.id, input);
      setBudgetModal(null);
      setBudgetRefreshKey((key) => key + 1);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to add this expense.';
      setBudgetError(message);
      throw new Error(message);
    } finally {
      setBudgetSaving(false);
    }
  };
  const budget = isAuthenticated ? budgetData?.budget ?? event?.budget ?? 0 : event?.budget || 1850000;
  const spent = isAuthenticated ? budgetData?.spent ?? event?.spent ?? 0 : event?.spent || 845000;
  const categories = isAuthenticated
    ? (budgetData?.categories ?? []).map((item) => ({
      name: item.name,
      spent: item.spent,
      allocated: item.allocated,
      color: item.color || 'rose',
      icon: '✦',
      id: item.id,
    }))
    : [
    { name: 'Venue & accommodation', spent: 420000, allocated: 600000, color: 'rose', icon: '⌂', id: '' },
    { name: 'Food & drinks', spent: 185000, allocated: 350000, color: 'gold', icon: '✳', id: '' },
    { name: 'Photography & video', spent: 95000, allocated: 180000, color: 'lavender', icon: '◉', id: '' },
    { name: 'Flowers & decor', spent: 145000, allocated: 220000, color: 'sage', icon: '✿', id: '' },
    ];
  const safeBudget = Math.max(budget, 1);
  return (
    <div className="screen-stack">
      <section className="budget-hero"><div><span className="eyebrow">A LITTLE CLARITY, A LOT LESS STRESS</span><h2>A celebration that feels good<br />and stays in budget.</h2><p>Here’s how your wedding spending is coming along.</p></div><span className="budget-hero-art">₹<i>✦</i></span></section>
      {budgetError && <p className="form-error" role="alert">{budgetError}</p>}
      {budgetLoading && <p role="status">Loading your budget…</p>}
      {isAuthenticated && !event && <p role="status">Create an event before tracking its budget.</p>}
      <div className="budget-overview-grid"><section className="content-card budget-overview-card"><div className="section-heading"><div><span className="eyebrow">{event ? `${event.name.toUpperCase()} · ${formatDate(event.date)}` : 'YOUR CELEBRATION'}</span><h2>The numbers, made simple.</h2></div><button className="button button--outline">This celebration <Icon name="chevron" size={15} /></button></div><div className="budget-amount-row"><div><span>YOUR TOTAL BUDGET</span><strong>{formatCurrency(budget)}</strong></div><div><span>THOUGHTFULLY SPENT</span><strong>{formatCurrency(spent)}</strong></div><div><span>STILL YOURS TO PLAN</span><strong>{formatCurrency(Math.max(budget - spent, 0))}</strong></div></div><div className="budget-large-bar"><span style={{ width: `${Math.min((spent / safeBudget) * 100, 100)}%` }} /></div><div className="budget-large-meta"><span>{Math.round((spent / safeBudget) * 100)}% of your budget is spoken for</span><span>{Math.max(Math.round(((budget - spent) / safeBudget) * 100), 0)}% to go</span></div></section><aside className="content-card budget-advice"><span className="advice-symbol">✦</span><span className="eyebrow">A NOTE FROM YOUR PLANNER</span><h3>You’re doing just fine.</h3><p>Most couples set aside around 10% for little surprises. You’ve got room to make your day feel like you.</p><button className="text-button">Plan for the unexpected →</button></aside></div>
      <section className="content-card category-budget-card"><div className="section-heading"><div><h2>Every rupee has a place</h2><p className="section-description">Your spending, thoughtfully organised.</p></div><button className="button button--outline" onClick={() => setBudgetModal({ mode: 'category' })}>+ Add a category</button></div><div className="category-list">{categories.map((item) => <div className="category-row" key={item.id || item.name}><span className={`category-icon category-icon--${item.color}`}>{item.icon}</span><span className="category-copy"><strong>{item.name}</strong><small>{formatCurrency(item.spent)} spent of {formatCurrency(item.allocated)}</small></span><div className="category-progress"><span className={`category-progress-fill category-progress-fill--${item.color}`} style={{ width: `${Math.min((item.spent / Math.max(item.allocated, 1)) * 100, 100)}%` }} /></div><strong className="category-amount">{formatCurrency(item.allocated)}</strong>{item.id && <button className="text-button" onClick={() => setBudgetModal({ mode: 'expense', categoryId: item.id })}>Add expense</button>}</div>)}{isAuthenticated && !categories.length && !budgetLoading && <div className="empty-state"><strong>No budget categories yet.</strong><p>Add a category to start organising your event spending.</p></div>}</div></section>
      {budgetModal && <BudgetItemModal
        mode={budgetModal.mode}
        categoryId={budgetModal.mode === 'expense' ? budgetModal.categoryId : undefined}
        saving={budgetSaving}
        onClose={() => setBudgetModal(null)}
        onSaveCategory={saveCategory}
        onSaveExpense={saveExpense}
      />}
    </div>
  );
}

function BudgetItemModal({
  mode,
  categoryId,
  saving,
  onClose,
  onSaveCategory,
  onSaveExpense,
}: {
  mode: 'category' | 'expense';
  categoryId?: string;
  saving: boolean;
  onClose: () => void;
  onSaveCategory: (input: CreateBudgetCategoryInput) => Promise<void>;
  onSaveExpense: (input: CreateExpenseInput) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      if (mode === 'category') {
        await onSaveCategory({
          name: String(form.get('name') ?? '').trim(),
          allocated: Number(form.get('allocated')),
          color: String(form.get('color') ?? 'rose'),
        });
      } else {
        await onSaveExpense({
          categoryId: categoryId ?? '',
          description: String(form.get('description') ?? '').trim(),
          amount: Number(form.get('amount')),
          date: String(form.get('date') ?? ''),
          paid: form.get('paid') === 'on',
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this budget item.');
    }
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="budget-item-title">
        <div className="modal-top"><span className="modal-kicker"><Icon name="sparkle" size={16} /> A little more clarity</span><button className="plain-icon" aria-label="Close" onClick={onClose} disabled={saving}><Icon name="close" /></button></div>
        <h2 id="budget-item-title">{mode === 'category' ? 'Add a budget category.' : 'Add an expense.'}</h2>
        <form className="event-form" onSubmit={(event) => void submit(event)}>
          {mode === 'category' ? <>
            <label>Category name<input name="name" required maxLength={120} /></label>
            <label>Allocated amount<input name="allocated" required type="number" min="0" step="0.01" /></label>
            <label>Colour<select name="color"><option value="rose">Rose</option><option value="gold">Gold</option><option value="sage">Sage</option><option value="lavender">Lavender</option></select></label>
          </> : <>
            <label>Description<input name="description" required maxLength={180} /></label>
            <label>Amount<input name="amount" required type="number" min="0.01" step="0.01" /></label>
            <label>Date<input name="date" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
            <label className="checkbox-field"><input name="paid" type="checkbox" /> Already paid</label>
          </>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : 'Save'} <span>→</span></button></div>
        </form>
      </section>
    </div>
  );
}

const workspacePermissionOptions: { value: WorkspacePermission; label: string }[] = [
  { value: 'event.view', label: 'View events' },
  { value: 'event.update', label: 'Edit events' },
  { value: 'event.delete', label: 'Delete events' },
  { value: 'function.manage', label: 'Manage event functions' },
  { value: 'guest.view', label: 'View guests' },
  { value: 'guest.create', label: 'Add guests' },
  { value: 'guest.update', label: 'Edit guests' },
  { value: 'guest.delete', label: 'Delete guests' },
  { value: 'invitation.view', label: 'View invitations' },
  { value: 'invitation.create', label: 'Create invitations' },
  { value: 'invitation.update', label: 'Edit invitations' },
  { value: 'quotation.view', label: 'View quotations' },
  { value: 'quotation.create', label: 'Request quotations' },
  { value: 'quotation.update', label: 'Respond to quotations' },
  { value: 'booking.view', label: 'View bookings' },
  { value: 'booking.create', label: 'Create bookings' },
  { value: 'booking.update', label: 'Update bookings' },
  { value: 'payment.view', label: 'View payments' },
  { value: 'payment.manage', label: 'Manage payments' },
  { value: 'budget.view', label: 'View budget' },
  { value: 'budget.manage', label: 'Manage budget' },
  { value: 'task.manage', label: 'Manage tasks' },
];

export function MembersPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const invitationToken = searchParams.get('token') ?? '';
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<WorkspaceMemberRole, 'owner'>>('member');
  const [permissions, setPermissions] = useState<WorkspacePermission[]>(['event.view', 'guest.view']);
  const [editingMemberId, setEditingMemberId] = useState('');
  const [editRole, setEditRole] = useState<Exclude<WorkspaceMemberRole, 'owner'>>('member');
  const [editPermissions, setEditPermissions] = useState<WorkspacePermission[]>([]);
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let active = true;
    workspaceApi.listMembers()
      .then((result) => { if (active) setMembers(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load workspace members.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated]);

  const togglePermission = (
    current: WorkspacePermission[],
    value: WorkspacePermission,
    setCurrent: (next: WorkspacePermission[]) => void,
  ) => {
    setCurrent(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const inviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const invitation = await workspaceApi.invite({ email: email.trim(), role, permissions });
      setInviteToken(invitation.acceptanceToken);
      setNotice(`Invitation created for ${invitation.email}. Share the secure link below; it expires in seven days.`);
      setEmail('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create the invitation.');
    } finally {
      setSaving(false);
    }
  };

  const acceptInvitation = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await workspaceApi.acceptInvitation(invitationToken);
      setNotice(`You joined the workspace as ${result.membership.role}.`);
      setSearchParams({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to accept this invitation.');
    } finally {
      setSaving(false);
    }
  };

  const saveMember = async (memberId: string) => {
    setSaving(true);
    setError('');
    try {
      const updated = await workspaceApi.updateMember(memberId, { role: editRole, permissions: editPermissions });
      setMembers((current) => current.map((member) => member.id === memberId ? updated : member));
      setEditingMemberId('');
      setNotice('Workspace permissions updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update this member.');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (member: WorkspaceMember) => {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) return;
    setSaving(true);
    setError('');
    try {
      await workspaceApi.removeMember(member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      setNotice(`${member.name} was removed from this workspace.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to remove this member.');
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = inviteToken
    ? `${window.location.origin}/members?token=${encodeURIComponent(inviteToken)}`
    : '';
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice('Invitation link copied.');
    } catch {
      setError('Could not copy the invitation link. Select and copy it manually.');
    }
  };

  return (
    <div className="screen-stack">
      {invitationToken && <section className="content-card workspace-invite-accept"><h2>You’re invited to a Utsav workspace.</h2><p>Accept this invitation while signed in with the invited email address.</p><button className="button button--primary" disabled={saving} onClick={() => void acceptInvitation()}>{saving ? 'Accepting…' : 'Accept invitation'} <span>→</span></button></section>}
      <section className="content-card workspace-members-card">
        <div className="list-toolbar"><div><SectionHeading title="Your family workspace" /><p className="section-description">Invite trusted people and grant only the access they need.</p></div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-success" role="status">{notice}</p>}
        {loading && <p role="status">Loading workspace members…</p>}
        {!loading && <div className="workspace-member-list">
          {members.map((member) => <article className="workspace-member-row" key={member.id}>
            <div className="request-copy"><strong>{member.name} <span className="workspace-member-role">{member.role}</span></strong><span>{member.email}</span><small>{member.role === 'owner' ? 'Workspace owner' : `${member.permissions.length} permissions granted`}</small></div>
            {member.role !== 'owner' && <>
              {editingMemberId === member.id ? <div className="workspace-member-editor">
                <label>Workspace role<select value={editRole} onChange={(event) => setEditRole(event.target.value as Exclude<WorkspaceMemberRole, 'owner'>)}><option value="member">Family member</option><option value="planner">Wedding planner</option></select></label>
                <div className="workspace-permission-grid">{workspacePermissionOptions.map((option) => <label key={option.value}><input type="checkbox" checked={editPermissions.includes(option.value)} onChange={() => togglePermission(editPermissions, option.value, setEditPermissions)} />{option.label}</label>)}</div>
                <div className="workspace-member-actions"><button className="button button--quiet" disabled={saving} onClick={() => setEditingMemberId('')}>Cancel</button><button className="button button--primary" disabled={saving} onClick={() => void saveMember(member.id)}>{saving ? 'Saving…' : 'Save access'}</button></div>
              </div> : <div className="workspace-member-actions"><button className="button button--outline" disabled={saving} onClick={() => { setEditingMemberId(member.id); setEditRole(member.role === 'planner' ? 'planner' : 'member'); setEditPermissions(member.permissions); }}>Manage access</button><button className="button button--quiet" disabled={saving} onClick={() => void removeMember(member)}>Remove</button></div>}
            </>}
          </article>)}
          {!members.length && <div className="empty-state"><strong>No workspace members found.</strong><p>Invite a family member or planner to collaborate.</p></div>}
        </div>}
      </section>
      <section className="content-card workspace-members-card">
        <div className="list-toolbar"><div><SectionHeading title="Invite someone to help" /><p className="section-description">Invitations are email-bound, expire after seven days, and grant only the permissions you select.</p></div></div>
        <form className="event-form workspace-invite-form" onSubmit={(event) => void inviteMember(event)}>
          <label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="relative@example.com" /></label>
          <label>Role<select value={role} onChange={(event) => setRole(event.target.value as Exclude<WorkspaceMemberRole, 'owner'>)}><option value="member">Family member</option><option value="planner">Wedding planner</option></select></label>
          <fieldset><legend>Permissions</legend><div className="workspace-permission-grid">{workspacePermissionOptions.map((option) => <label key={option.value}><input type="checkbox" checked={permissions.includes(option.value)} onChange={() => togglePermission(permissions, option.value, setPermissions)} />{option.label}</label>)}</div></fieldset>
          <div className="modal-actions"><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Creating invitation…' : 'Create invitation'} <span>→</span></button></div>
        </form>
        {inviteToken && <div className="workspace-invite-link"><label>One-time invitation link<input readOnly value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></label><button className="button button--outline" onClick={() => void copyInviteLink()}>Copy link</button><small>Keep this link private and send it only to the invited email address.</small></div>}
      </section>
    </div>
  );
}

export function SettingsPage() {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
  }, [user?.id, user?.name, user?.phone]);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setError('Sign in before saving profile changes.');
      return;
    }
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() || undefined });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="screen-stack settings-screen">
      <section className="settings-profile"><span className="settings-avatar">{(user?.name ?? 'U').split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()}</span><div><h2>{user?.name ?? 'Your profile'}</h2><p>{user?.role ?? 'Guest'} · {user?.email ?? 'Sign in to manage your profile'}</p></div></section>
      <form className="content-card settings-card" onSubmit={save}><div className="section-heading"><div><h2>Your details</h2><p className="section-description">Update the profile details connected to your account.</p></div></div><div className="settings-form"><label>Your name<input required minLength={2} value={name} onChange={(event) => setName(event.currentTarget.value)} /></label><label>Email address<input value={user?.email ?? ''} type="email" readOnly /></label><label>Phone number<div className="phone-input"><span>Phone</span><input value={phone} onChange={(event) => setPhone(event.currentTarget.value)} /></div></label></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="settings-actions"><span>{saved ? 'Your profile details have been saved.' : 'Your information is only shared with people you choose.'}</span><button type="submit" className="button button--primary" disabled={saving || !isAuthenticated}>{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save your changes'}</button></div></form>
      <section className="content-card preferences-card"><div><h3>A little note from Utsav</h3><p>Get kind reminders, RSVP updates, and planning inspiration in your inbox.</p></div><label className="switch"><input type="checkbox" defaultChecked /><span /></label></section>
    </div>
  );
}

export function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingVendorId, setUpdatingVendorId] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState('');
  const [showReviewed, setShowReviewed] = useState(false);
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([
      adminApi.listUsers(),
      adminApi.listVendors(),
      adminApi.listAuditLogs(),
      adminApi.getDashboard(),
    ])
      .then(([userItems, vendorItems, auditItems, dashboardData]) => {
        if (active) {
          setUsers(userItems);
          setVendors(vendorItems);
          setAuditLogs(auditItems);
          setDashboard(dashboardData);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load the admin dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.role]);
  const pending = vendors.filter((vendor) => vendor.verificationStatus === 'pending');
  const visibleVendors = showReviewed ? vendors : pending;
  const updateVerification = async (vendor: AdminVendor, status: 'verified' | 'rejected') => {
    setUpdatingVendorId(vendor.id);
    setError('');
    try {
      const updated = await adminApi.updateVendorVerification(vendor.id, status);
      setVendors((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update vendor verification.');
    } finally {
      setUpdatingVendorId('');
    }
  };
  const toggleUserStatus = async (account: AdminUser) => {
    setUpdatingUserId(account.id);
    setError('');
    try {
      const status = account.status === 'active' ? 'suspended' : 'active';
      const updated = await adminApi.updateUserStatus(account.id, status);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      const [auditItems, dashboardData] = await Promise.all([
        adminApi.listAuditLogs(),
        adminApi.getDashboard(),
      ]);
      setAuditLogs(auditItems);
      setDashboard(dashboardData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update account status.');
    } finally {
      setUpdatingUserId('');
    }
  };
  return (
    <div className="screen-stack">
      <section className="admin-welcome"><div><span className="eyebrow">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' }).format(new Date()).toUpperCase()} · ADMIN CONSOLE</span><h2>A little order behind all the magic.</h2><p>Here’s how the Utsav community is coming together today.</p></div><span className="admin-welcome-mark">✳</span></section>
      <section className="admin-stat-grid">
        <article className="admin-stat"><span className="stat-icon stat-icon--rose"><Icon name="users" /></span><span className="stat-label">COMMUNITY MEMBERS</span><strong>{dashboard?.metrics.users.total.toLocaleString('en-IN') ?? '—'}</strong><small>{dashboard?.metrics.users.active.toLocaleString('en-IN') ?? '—'} active accounts</small></article>
        <article className="admin-stat"><span className="stat-icon stat-icon--gold"><Icon name="calendar" /></span><span className="stat-label">CELEBRATIONS</span><strong>{dashboard?.metrics.events.toLocaleString('en-IN') ?? '—'}</strong><small>Events across family workspaces</small></article>
        <article className="admin-stat"><span className="stat-icon stat-icon--sage"><Icon name="sparkle" /></span><span className="stat-label">TOTAL BOOKINGS</span><strong>{dashboard?.metrics.bookings.total.toLocaleString('en-IN') ?? '—'}</strong><small>{dashboard?.metrics.bookings.confirmed ?? '—'} confirmed · {dashboard?.metrics.bookings.requested ?? '—'} requested</small></article>
        <article className="admin-stat admin-stat--attention"><span className="stat-icon stat-icon--lavender"><Icon name="store" /></span><span className="stat-label">PAID PAYMENT VOLUME</span><strong>{dashboard ? formatCurrency(dashboard.metrics.payments.paidAmount) : '—'}</strong><small>{dashboard?.metrics.payments.paid ?? '—'} paid · {dashboard?.metrics.payments.pending ?? '—'} pending</small></article>
      </section>
      {dashboard && <AdminMonitoringTables bookings={dashboard.recentBookings} payments={dashboard.recentPayments} />}
      <section className="content-card admin-review-card">
        <div className="list-toolbar"><div><SectionHeading title="Community accounts" /><p className="section-description">Suspend or reactivate access when an account needs attention.</p></div></div>
        {loading ? <p role="status">Loading accounts…</p> : <UserManagementTable
          users={users}
          currentUserId={user?.id ?? ''}
          updatingUserId={updatingUserId}
          onToggleStatus={(account) => void toggleUserStatus(account)}
        />}
      </section>
      <section className="content-card admin-review-card">
        <div className="list-toolbar"><div><SectionHeading title={showReviewed ? 'Vendor applications' : 'Good people, ready to join'} /><p className="section-description">A thoughtful review helps families find vendors they can trust.</p></div><button className="text-button" onClick={() => setShowReviewed((value) => !value)}>{showReviewed ? 'Show applications to review' : 'View all applications'} <span>→</span></button></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {!isAuthenticated || user?.role !== 'admin' ? <p className="form-error" role="alert">An administrator account is required to view this dashboard.</p> : loading ? <p role="status">Loading community activity…</p> : <div className="admin-vendor-list">{visibleVendors.map((vendor) => <article className="admin-vendor-row" key={vendor.id}><span className="admin-vendor-avatar">{vendor.name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()}</span><span className="admin-vendor-name"><strong>{vendor.name}</strong><small>{vendor.category} · {vendor.city}</small></span><span className="admin-submitted">{vendor.verificationStatus === 'pending' ? 'Needs review' : vendor.verificationStatus}</span><StatusPill status={vendor.verificationStatus === 'pending' ? 'Pending' : vendor.verificationStatus === 'verified' ? 'Confirmed' : 'Declined'} />{vendor.verificationStatus === 'pending' ? <div className="admin-actions"><button className="button button--outline" disabled={updatingVendorId === vendor.id} onClick={() => void updateVerification(vendor, 'rejected')}>Reject</button><button className="button button--primary" disabled={updatingVendorId === vendor.id} onClick={() => void updateVerification(vendor, 'verified')}>{updatingVendorId === vendor.id ? 'Saving…' : 'Approve vendor'}</button></div> : <strong className={`review-result ${vendor.verificationStatus === 'verified' ? 'review-result--verified' : ''}`}>{vendor.verificationStatus}</strong>}</article>)}</div>}
        {!loading && isAuthenticated && user?.role === 'admin' && !visibleVendors.length && <div className="empty-state"><strong>{showReviewed ? 'No vendor applications yet.' : 'Every application has found its way.'}</strong><p>New vendor applications will appear here.</p></div>}
      </section>
      <section className="content-card admin-review-card">
        <div className="list-toolbar"><div><SectionHeading title="Recent administrator activity" /><p className="section-description">The latest 200 account and platform actions.</p></div></div>
        {loading ? <p role="status">Loading audit history…</p> : <AuditLogTable entries={auditLogs} />}
      </section>
      <div className="tip-banner"><span>✦</span><p><strong>Your marketplace, your standards.</strong> Clear, kind reviews help build a safer and more welcoming community for everyone.</p></div>
    </div>
  );
}

export function VendorDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Vendor | null>(null);
  const [requests, setRequests] = useState<Quotation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState('');
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') {
      setLoading(false);
      return;
    }
    let active = true;
    const profileRequest = vendorsApi.getMyProfile().catch((cause: unknown) => {
      if (isAxiosError(cause) && cause.response?.status === 404) return null;
      throw cause;
    });
    Promise.all([profileRequest, quotationsApi.list(), bookingsApi.list()])
      .then(([vendorProfile, quotations, vendorBookings]) => {
        if (active) {
          setProfile(vendorProfile);
          setRequests(quotations);
          setBookings(vendorBookings);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your studio dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.role]);
  const newRequests = requests.filter((request) => request.status === 'draft');
  const updateVendorBooking = async (booking: Booking, status: Booking['status']) => {
    setUpdatingBookingId(booking.id);
    setError('');
    try {
      const updated = await bookingsApi.updateStatus(booking.id, status);
      setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update this booking.');
    } finally {
      setUpdatingBookingId('');
    }
  };
  return (
    <div className="screen-stack">
      <section className="vendor-welcome"><div><span className="eyebrow">YOUR LITTLE CORNER OF UTSAV</span><h2>Welcome, {profile?.name ?? user?.name ?? 'vendor'} <span>✦</span></h2><p>{profile ? 'Here are the real enquiries and bookings connected to your profile.' : 'You are viewing bookings assigned to your vendor staff account.'}</p></div><div className="vendor-welcome-actions">{profile && <button className="button button--outline" onClick={() => navigate('/vendor/settings')}>Manage your profile</button>}<button className="button button--outline" onClick={() => navigate('/vendor/staff')}>{profile ? 'Manage staff' : 'Staff assignments'}</button></div></section>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!isAuthenticated || user?.role !== 'vendor' ? <p className="form-error" role="alert">Sign in with a vendor account to view your studio dashboard.</p> : loading && <p role="status">Loading your studio activity…</p>}
      <section className="vendor-stats-grid"><article className="vendor-stat-card"><span>NEW ENQUIRIES</span><strong>{newRequests.length.toLocaleString('en-IN')}</strong><small>Waiting for a proposal</small><span className="vendor-stat-icon">✉</span></article><article className="vendor-stat-card"><span>PROPOSALS SENT</span><strong>{requests.filter((item) => item.status === 'sent').length.toLocaleString('en-IN')}</strong><small>Awaiting family response</small><span className="vendor-stat-icon">◉</span></article><article className="vendor-stat-card"><span>YOUR RATING</span><strong>{profile ? `${profile.rating.toFixed(1)} ★` : '—'}</strong><small>{profile ? `From ${profile.reviewCount} reviews` : 'Vendor profile rating'}</small><span className="vendor-stat-icon">✦</span></article><article className="vendor-stat-card"><span>BOOKINGS</span><strong>{bookings.length.toLocaleString('en-IN')}</strong><small>Linked to your profile</small><span className="vendor-stat-icon">⌂</span></article></section>
      <section className="content-card vendor-requests-card"><div className="list-toolbar"><div><SectionHeading title="A few families would love to meet you" /><p className="section-description">A warm reply is often the beginning of something wonderful.</p></div><button className="button button--outline" onClick={() => navigate('/vendor/quotation-requests')}>View all enquiries <Icon name="chevron" size={14} /></button></div>
        {!loading && isAuthenticated && user?.role === 'vendor' && <div className="vendor-request-list">{newRequests.map((request) => <article className="vendor-request-row" key={request.id}><span className="avatar avatar--request">{(request.eventName ?? request.title).split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()}</span><div className="request-copy"><strong>{request.title}</strong><span>{request.eventName ?? `Event ${request.eventId}`}</span><small>{request.eventDate ? formatDate(request.eventDate) : 'Date not set'} <i>·</i> {request.guestCount ?? 0} guests</small></div><StatusPill status="Pending" /><button className="button button--primary" onClick={() => navigate('/vendor/quotation-requests')}>Prepare quotation →</button></article>)}</div>}
        {!loading && isAuthenticated && user?.role === 'vendor' && !newRequests.length && <div className="empty-state"><strong>No new enquiries just yet.</strong><p>New quotation requests for your profile will appear here.</p></div>}
        <button className="text-button vendor-request-more" onClick={() => navigate('/vendor/quotation-requests')}>See all your enquiries →</button>
      </section>
      <section className="content-card vendor-requests-card">
        <div className="list-toolbar"><div><SectionHeading title="Your bookings" /><p className="section-description">Review requests and keep booking statuses up to date.</p></div></div>
        {!loading && isAuthenticated && user?.role === 'vendor' && bookings.length > 0 && (
          <div className="vendor-booking-list">
            {bookings.map((booking) => {
              const managesBooking = profile?.id === booking.vendorId;
              return (
              <article className="vendor-booking-row" key={booking.id}>
                <div className="request-copy">
                  <strong>{booking.serviceName}</strong>
                  <span>{formatDate(booking.eventDate)}{managesBooking ? ` · ${formatCurrency(booking.amount)}` : ''}</span>
                  <small>{booking.eventName ?? `Event ${booking.eventId}`}</small>
                </div>
                <StatusPill status={booking.status === 'requested' ? 'Pending' : booking.status === 'confirmed' ? 'Confirmed' : booking.status === 'completed' ? 'Completed' : 'Cancelled'} />
                <div className="vendor-booking-actions">
                  {managesBooking && booking.status === 'requested' && <>
                    <button className="button button--outline" disabled={updatingBookingId !== ''} onClick={() => void updateVendorBooking(booking, 'cancelled')}>Decline</button>
                    <button className="button button--primary" disabled={updatingBookingId !== ''} onClick={() => void updateVendorBooking(booking, 'confirmed')}>{updatingBookingId === booking.id ? 'Saving…' : 'Confirm'}</button>
                  </>}
                  {managesBooking && booking.status === 'confirmed' && <>
                    <button className="button button--outline" disabled={updatingBookingId !== ''} onClick={() => void updateVendorBooking(booking, 'cancelled')}>Cancel</button>
                    <button className="button button--primary" disabled={updatingBookingId !== ''} onClick={() => void updateVendorBooking(booking, 'completed')}>{updatingBookingId === booking.id ? 'Saving…' : 'Mark complete'}</button>
                  </>}
                  {!managesBooking && booking.status === 'confirmed' && <button className="button button--primary" disabled={updatingBookingId !== ''} onClick={() => void updateVendorBooking(booking, 'completed')}>{updatingBookingId === booking.id ? 'Saving…' : 'Mark complete'}</button>}
                </div>
              </article>
              );
            })}
          </div>
        )}
        {!loading && isAuthenticated && user?.role === 'vendor' && bookings.length === 0 && <div className="empty-state"><strong>No bookings yet.</strong><p>Bookings for your services will appear here.</p></div>}
      </section>
      <div className="tip-banner"><span>✦</span><p><strong>Your next great review starts with a reply.</strong> Families appreciate a quick note, even when a date isn’t available.</p></div>
    </div>
  );
}

export function VendorStaffPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [staff, setStaff] = useState<VendorStaffMember[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [assignmentSelection, setAssignmentSelection] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    const [members, vendorBookings] = await Promise.all([
      vendorStaffApi.list(),
      bookingsApi.list(),
    ]);
    setStaff(members);
    setBookings(vendorBookings);
  };

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor' || token) {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([vendorStaffApi.list(), bookingsApi.list()])
      .then(([members, vendorBookings]) => {
        if (active) {
          setStaff(members);
          setBookings(vendorBookings);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load vendor staff.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, token, user?.role]);

  const acceptInvite = async () => {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await vendorStaffApi.accept(token);
      setNotice('You joined the vendor team. Assigned bookings are available in your dashboard.');
      navigate('/vendor');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to accept this vendor staff invitation.');
    } finally {
      setSaving(false);
    }
  };

  const inviteStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const invitation = await vendorStaffApi.invite(email.trim());
      setInviteToken(invitation.acceptanceToken);
      setEmail('');
      setNotice(`Invitation created for ${invitation.email}. Share this link with the invited vendor account.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to invite this staff member.');
    } finally {
      setSaving(false);
    }
  };

  const assignStaff = async (booking: Booking) => {
    const membershipId = assignmentSelection[booking.id];
    if (!membershipId) return;
    setSaving(true);
    setError('');
    try {
      await vendorStaffApi.assign(booking.id, membershipId);
      await refresh();
      setNotice('Staff member assigned to this booking.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to assign this booking.');
    } finally {
      setSaving(false);
    }
  };

  const unassignStaff = async (booking: Booking, membershipId: string) => {
    setSaving(true);
    setError('');
    try {
      await vendorStaffApi.unassign(booking.id, membershipId);
      await refresh();
      setNotice('Staff assignment removed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to remove the staff assignment.');
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (member: VendorStaffMember) => {
    if (!window.confirm(`Remove ${member.name} from your vendor team?`)) return;
    setSaving(true);
    setError('');
    try {
      await vendorStaffApi.remove(member.id);
      await refresh();
      setNotice(`${member.name} was removed from your team.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to remove this staff member.');
    } finally {
      setSaving(false);
    }
  };

  const inviteUrl = inviteToken
    ? `${window.location.origin}/vendor/staff?token=${encodeURIComponent(inviteToken)}`
    : '';

  return (
    <div className="screen-stack">
      {token && <section className="content-card workspace-invite-accept"><div><h2>You’re invited to a vendor team.</h2><p>Accept while signed in with the invited vendor account.</p></div><button className="button button--primary" disabled={saving} onClick={() => void acceptInvite()}>{saving ? 'Accepting…' : 'Accept invitation'} <span>→</span></button></section>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status">{notice}</p>}
      {!token && <>
        <section className="content-card vendor-requests-card">
          <div className="list-toolbar"><div><SectionHeading title="Your vendor team" /><p className="section-description">Invite staff without sharing owner credentials. Staff only see bookings assigned to them.</p></div></div>
          {loading && <p role="status">Loading your vendor team…</p>}
          {!loading && staff.map((member) => <article className="workspace-member-row" key={member.id}><div className="request-copy"><strong>{member.name}</strong><span>{member.email}</span><small>Vendor staff · {member.status}</small></div><button className="button button--quiet" disabled={saving} onClick={() => void removeStaff(member)}>Remove</button></article>)}
          {!loading && !staff.length && <div className="empty-state"><strong>No staff members yet.</strong><p>Invite a trusted teammate to help coordinate assigned bookings.</p></div>}
        </section>
        <section className="content-card vendor-requests-card">
          <div className="list-toolbar"><div><SectionHeading title="Invite vendor staff" /><p className="section-description">The invite is tied to one email, expires in seven days, and cannot access pricing or financial settings.</p></div></div>
          <form className="event-form workspace-invite-form" onSubmit={(event) => void inviteStaff(event)}><label>Staff email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" /></label><div className="modal-actions"><button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Creating invitation…' : 'Create invitation'} <span>→</span></button></div></form>
          {inviteUrl && <div className="workspace-invite-link"><label>One-time invitation link<input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} /></label><button className="button button--outline" onClick={() => void navigator.clipboard.writeText(inviteUrl).then(() => setNotice('Invitation link copied.')).catch(() => setError('Could not copy the invitation link; select and copy it manually.'))}>Copy link</button></div>}
        </section>
        <section className="content-card vendor-requests-card">
          <div className="list-toolbar"><div><SectionHeading title="Assign bookings" /><p className="section-description">Staff only see the bookings assigned to them.</p></div></div>
          {bookings.map((booking) => <article className="vendor-booking-row" key={booking.id}><div className="request-copy"><strong>{booking.serviceName}</strong><span>{formatDate(booking.eventDate)} · {booking.eventName ?? `Event ${booking.eventId}`}</span><small>{booking.assignedStaff?.length ? `Assigned: ${booking.assignedStaff.map((item) => item.name).join(', ')}` : 'No staff assigned'}</small></div><div className="vendor-booking-actions">{booking.assignedStaff?.map((assigned) => <button key={assigned.membershipId} className="button button--quiet" disabled={saving} onClick={() => void unassignStaff(booking, assigned.membershipId)}>Remove {assigned.name}</button>)}{staff.length > 0 && <><select aria-label={`Choose staff for ${booking.serviceName}`} value={assignmentSelection[booking.id] ?? ''} onChange={(event) => setAssignmentSelection((current) => ({ ...current, [booking.id]: event.target.value }))}><option value="">Select staff</option>{staff.filter((member) => !booking.assignedStaff?.some((assigned) => assigned.membershipId === member.id)).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select><button className="button button--primary" disabled={saving || !assignmentSelection[booking.id]} onClick={() => void assignStaff(booking)}>Assign</button></>}</div></article>)}
          {!bookings.length && !loading && <div className="empty-state"><strong>No bookings to assign.</strong><p>Vendor booking requests will appear here.</p></div>}
        </section>
      </>}
    </div>
  );
}

type VendorEditorType = 'service' | 'package' | 'portfolio' | 'availability';

export function VendorManagementPage() {
  const { section = '' } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Vendor | null>(null);
  const [services, setServices] = useState<VendorService[]>([]);
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [availability, setAvailability] = useState<VendorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<{ type: VendorEditorType; id?: string } | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileCategory, setProfileCategory] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profilePrice, setProfilePrice] = useState('');
  const [profileDescription, setProfileDescription] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'vendor') {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    const load = async () => {
      try {
        const myProfile = await vendorsApi.getMyProfile();
        if (!active) return;
        setProfile(myProfile);
        setProfileName(myProfile.name);
        setProfileCategory(myProfile.category);
        setProfileCity(myProfile.city);
        setProfilePrice(myProfile.startingPrice === undefined ? '' : String(myProfile.startingPrice));
        setProfileDescription(myProfile.description ?? '');
        if (section === 'services') setServices(await vendorManagementApi.listServices());
        if (section === 'packages') setPackages(await vendorManagementApi.listPackages());
        if (section === 'portfolio') setPortfolio(await vendorManagementApi.listPortfolio());
        if (section === 'availability') setAvailability(await vendorManagementApi.listAvailability());
      } catch (cause) {
        if (active && !(section === 'profile' && isAxiosError(cause) && cause.response?.status === 404)) {
          setError(cause instanceof Error ? cause.message : 'Unable to load vendor settings.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [isAuthenticated, section, user?.id, user?.role]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const input = {
      name: profileName.trim(),
      category: profileCategory.trim(),
      city: profileCity.trim(),
      startingPrice: profilePrice ? Number(profilePrice) : undefined,
      description: profileDescription.trim() || undefined,
    };
    try {
      const saved = profile
        ? await vendorsApi.updateMyProfile(input)
        : await vendorsApi.createMyProfile(input);
      setProfile(saved);
      setNotice(profile ? 'Your profile was saved and sent for verification review.' : 'Your vendor profile was created and is awaiting verification.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const saveResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (editor.type === 'service') {
        const input = {
          name: String(form.get('name') ?? '').trim(),
          description: String(form.get('description') ?? '').trim() || undefined,
          price: Number(form.get('price')),
          isActive: true,
        };
        const saved = editor.id
          ? await vendorManagementApi.updateService(editor.id, input)
          : await vendorManagementApi.createService(input);
        setServices((current) => editor.id
          ? current.map((item) => item.id === saved.id ? saved : item)
          : [saved, ...current]);
      } else if (editor.type === 'package') {
        const input = {
          name: String(form.get('name') ?? '').trim(),
          description: String(form.get('description') ?? '').trim() || undefined,
          price: Number(form.get('price')),
          inclusions: String(form.get('inclusions') ?? '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          isActive: true,
        };
        const saved = editor.id
          ? await vendorManagementApi.updatePackage(editor.id, input)
          : await vendorManagementApi.createPackage(input);
        setPackages((current) => editor.id
          ? current.map((item) => item.id === saved.id ? saved : item)
          : [saved, ...current]);
      } else if (editor.type === 'portfolio') {
        const input = {
          imageUrl: String(form.get('imageUrl') ?? '').trim(),
          caption: String(form.get('caption') ?? '').trim() || undefined,
        };
        const saved = await vendorManagementApi.createPortfolioItem(input);
        setPortfolio((current) => [saved, ...current]);
      } else {
        const saved = await vendorManagementApi.setAvailability({
          date: String(form.get('date') ?? ''),
          isAvailable: form.get('isAvailable') === 'true',
          note: String(form.get('note') ?? '').trim() || undefined,
        });
        setAvailability((current) => [saved, ...current.filter((item) => item.id !== saved.id)].sort((a, b) => a.date.localeCompare(b.date)));
      }
      setEditor(null);
      setNotice('Your changes were saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this item.');
    } finally {
      setSaving(false);
    }
  };

  const removeResource = async (type: 'service' | 'package' | 'portfolio' | 'availability', id: string) => {
    setError('');
    try {
      if (type === 'service') {
        await vendorManagementApi.deleteService(id);
        setServices((current) => current.filter((item) => item.id !== id));
      } else if (type === 'package') {
        await vendorManagementApi.deletePackage(id);
        setPackages((current) => current.filter((item) => item.id !== id));
      } else if (type === 'portfolio') {
        await vendorManagementApi.deletePortfolioItem(id);
        setPortfolio((current) => current.filter((item) => item.id !== id));
      } else {
        await vendorManagementApi.deleteAvailability(id);
        setAvailability((current) => current.filter((item) => item.id !== id));
      }
      setNotice('The item was removed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to remove this item.');
    }
  };

  const titles: Record<string, string> = {
    profile: 'Your public profile',
    services: 'Your services',
    packages: 'Your packages',
    portfolio: 'Your portfolio',
    availability: 'Your availability',
  };
  const title = titles[section] ?? 'Vendor workspace';
  return (
    <div className="screen-stack">
      <section className="intro-banner intro-banner--rose"><span className="intro-sparkle">✦</span><div><h2>{title}</h2><p>Keep your business details current so families can plan with confidence.</p></div>{section !== 'profile' && <button className="button button--primary" disabled={!profile || loading} onClick={() => setEditor({ type: section as VendorEditorType })}><Icon name="plus" size={16} />Add {section === 'services' ? 'service' : section === 'packages' ? 'package' : section === 'portfolio' ? 'portfolio item' : 'date'}</button>}</section>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!isAuthenticated || user?.role !== 'vendor' ? <p className="form-error" role="alert">Sign in with a vendor account to manage these details.</p> : loading && <p role="status">Loading your vendor workspace…</p>}
      {section === 'profile' && isAuthenticated && user?.role === 'vendor' && <form className="content-card settings-card" onSubmit={(event) => void saveProfile(event)}><div className="settings-form"><label>Business name<input required minLength={2} maxLength={180} value={profileName} onChange={(event) => setProfileName(event.currentTarget.value)} /></label><label>Service category<input required minLength={2} maxLength={100} value={profileCategory} onChange={(event) => setProfileCategory(event.currentTarget.value)} /></label><label>City<input required minLength={2} maxLength={120} value={profileCity} onChange={(event) => setProfileCity(event.currentTarget.value)} /></label><label>Starting price<input type="number" min="0" step="0.01" value={profilePrice} onChange={(event) => setProfilePrice(event.currentTarget.value)} /></label><label>About your business<textarea rows={4} maxLength={5000} value={profileDescription} onChange={(event) => setProfileDescription(event.currentTarget.value)} /></label></div>{profile?.verificationStatus && <p className="section-description">Verification status: {profile.verificationStatus}. Saving profile changes sends the profile for review again.</p>}<button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : profile ? 'Save profile' : 'Create vendor profile'}</button></form>}
      {section === 'services' && <section className="content-card list-card"><div className="list-toolbar"><div><SectionHeading title="Services families can book" /><p className="section-description">Describe what you offer and your starting price.</p></div></div>{services.map((item) => <article className="booking-item" key={item.id}><div className="booking-row"><div className="booking-vendor"><strong>{item.name}</strong><small>{item.description || 'No description'}</small></div><div className="booking-amount"><strong>{formatCurrency(item.price)}</strong><small>{item.isActive ? 'Visible' : 'Paused'}</small></div><button className="button button--outline" onClick={() => setEditor({ type: 'service', id: item.id })}>Edit</button><button className="plain-icon" aria-label={`Delete ${item.name}`} onClick={() => void removeResource('service', item.id)}>×</button></div></article>)}{!services.length && !loading && <div className="empty-state"><strong>No services yet.</strong><p>Add your services and pricing for families to review.</p></div>}</section>}
      {section === 'packages' && <section className="content-card list-card"><div className="list-toolbar"><div><SectionHeading title="Packages for the day" /><p className="section-description">Show families what each package includes.</p></div></div>{packages.map((item) => <article className="booking-item" key={item.id}><div className="booking-row"><div className="booking-vendor"><strong>{item.name}</strong><small>{item.inclusions.join(' · ') || item.description || 'No inclusions listed'}</small></div><div className="booking-amount"><strong>{formatCurrency(item.price)}</strong><small>{item.isActive ? 'Visible' : 'Paused'}</small></div><button className="button button--outline" onClick={() => setEditor({ type: 'package', id: item.id })}>Edit</button><button className="plain-icon" aria-label={`Delete ${item.name}`} onClick={() => void removeResource('package', item.id)}>×</button></div></article>)}{!packages.length && !loading && <div className="empty-state"><strong>No packages yet.</strong><p>Create a package with a clear price and inclusions.</p></div>}</section>}
      {section === 'portfolio' && <section className="content-card list-card"><div className="list-toolbar"><div><SectionHeading title="Work worth sharing" /><p className="section-description">Add portfolio images using a publicly accessible image URL.</p></div></div>{portfolio.map((item) => <article className="booking-item" key={item.id}><div className="booking-row"><img src={item.imageUrl} alt={item.caption || 'Vendor portfolio'} width="96" height="72" /><div className="booking-vendor"><strong>{item.caption || 'Portfolio image'}</strong><small>{item.imageUrl}</small></div><button className="plain-icon" aria-label="Remove portfolio item" onClick={() => void removeResource('portfolio', item.id)}>×</button></div></article>)}{!portfolio.length && !loading && <div className="empty-state"><strong>Your portfolio is ready for its first moment.</strong><p>Add an image URL to help families understand your work.</p></div>}</section>}
      {section === 'availability' && <section className="content-card list-card"><div className="list-toolbar"><div><SectionHeading title="Dates on your calendar" /><p className="section-description">Add dates and mark them available or unavailable.</p></div></div>{availability.map((item) => <article className="booking-item" key={item.id}><div className="booking-row"><div className="booking-vendor"><strong>{formatDate(item.date)}</strong><small>{item.note || 'No note'}</small></div><StatusPill status={item.isAvailable ? 'Available' : 'Unavailable'} /><button className="button button--outline" onClick={() => setEditor({ type: 'availability', id: item.id })}>Edit</button><button className="plain-icon" aria-label={`Remove availability for ${item.date}`} onClick={() => void removeResource('availability', item.id)}>×</button></div></article>)}{!availability.length && !loading && <div className="empty-state"><strong>No dates added.</strong><p>Add the dates you can or cannot take bookings.</p></div>}</section>}
      {editor && <VendorResourceModal
        type={editor.type}
        initial={editor.type === 'service' ? services.find((item) => item.id === editor.id) : editor.type === 'package' ? packages.find((item) => item.id === editor.id) : editor.type === 'availability' ? availability.find((item) => item.id === editor.id) : undefined}
        saving={saving}
        onClose={() => setEditor(null)}
        onSubmit={saveResource}
      />}
    </div>
  );
}

function VendorResourceModal({
  type,
  initial,
  saving,
  onClose,
  onSubmit,
}: {
  type: VendorEditorType;
  initial?: VendorService | VendorPackage | VendorAvailability;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const service = type === 'service' && initial && 'price' in initial ? initial : undefined;
  const packageItem = type === 'package' && initial && 'inclusions' in initial ? initial : undefined;
  const dateItem = type === 'availability' && initial && 'date' in initial ? initial : undefined;
  const heading = type === 'service' ? 'Service details' : type === 'package' ? 'Package details' : type === 'portfolio' ? 'Portfolio image' : 'Availability date';
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="vendor-resource-title"><div className="modal-top"><span className="modal-kicker"><Icon name="sparkle" size={16} /> Your business, thoughtfully presented</span><button className="plain-icon" aria-label="Close" disabled={saving} onClick={onClose}><Icon name="close" /></button></div><h2 id="vendor-resource-title">{heading}</h2><form className="event-form" onSubmit={onSubmit}>
    {(type === 'service' || type === 'package') && <><label>Name<input name="name" required minLength={2} maxLength={140} defaultValue={service?.name ?? packageItem?.name ?? ''} /></label><label>Description<textarea name="description" rows={3} maxLength={5000} defaultValue={service?.description ?? packageItem?.description ?? ''} /></label><label>Price (₹)<input name="price" type="number" min="0" step="0.01" required defaultValue={service?.price ?? packageItem?.price ?? ''} /></label></>}
    {type === 'package' && <label>Inclusions (one per line)<textarea name="inclusions" rows={4} maxLength={10000} defaultValue={packageItem?.inclusions.join('\n') ?? ''} /></label>}
    {type === 'portfolio' && <><label>Public image URL<input name="imageUrl" type="url" required maxLength={500} placeholder="https://..." /></label><label>Caption<input name="caption" maxLength={255} /></label></>}
    {type === 'availability' && <><label>Date<input name="date" type="date" required defaultValue={dateItem?.date ?? ''} /></label><label>Availability<select name="isAvailable" defaultValue={String(dateItem?.isAvailable ?? true)}><option value="true">Available</option><option value="false">Unavailable</option></select></label><label>Note<input name="note" maxLength={255} defaultValue={dateItem?.note ?? ''} /></label></>}
    <div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add'} <span>→</span></button></div>
  </form></section></div>;
}

export function GuestInvitationPage() {
  const { token } = useParams();
  const [response, setResponse] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [invitation, setInvitation] = useState<GuestInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!token) {
      setError('This invitation link is missing its token.');
      setLoading(false);
      return;
    }
    rsvpApi.getByToken(token)
      .then((result) => {
        if (active) {
          setInvitation(result);
          setSelectedFunctionIds(
            result.functions
              .filter((item) => item.status !== 'pending')
              .map((item) => item.id)
              .concat(result.functions.every((item) => item.status === 'pending')
                ? result.functions.map((item) => item.id)
                : []),
          );
          if (result.status === 'attending' || result.status === 'declined' || result.status === 'maybe') {
            setSubmitted(true);
            setResponse(result.status === 'attending' ? 'joyfully' : result.status === 'maybe' ? 'maybe' : 'regretfully');
          }
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load this invitation.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  const submitRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !invitation || !response) return;
    if (invitation.functions.length && !selectedFunctionIds.length) {
      setError('Select at least one function to RSVP to.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await rsvpApi.submit({
        guestId: '',
        invitationToken: token,
        status: response === 'joyfully' ? 'attending' : response === 'maybe' ? 'maybe' : 'declined',
        plusOnes: response === 'joyfully' ? Math.max(Number(partySize) - 1, 0) : 0,
        functionIds: selectedFunctionIds,
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your RSVP could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="guest-portal">
      <div className="guest-portal-brand"><span className="brand-mark">u</span><span className="brand-word">utsav<span>.</span></span></div>
      {loading && <section className="guest-thank-you"><p role="status">Loading your invitation…</p></section>}
      {!loading && error && !invitation && <section className="guest-thank-you"><p className="form-error" role="alert">{error}</p></section>}
      {!loading && invitation && (!submitted ? <section className="guest-invitation-card">
        <div className="guest-invitation-art"><span>TOGETHER WITH THEIR FAMILIES</span><i>✿</i><h1>{invitation.event.name}</h1><b>INVITE YOU TO CELEBRATE</b><strong>{invitation.event.name}</strong><small>{formatDate(invitation.event.date)} · {invitation.event.location || 'Details to follow'}</small></div>
        <div className="guest-invitation-content">
          <span className="eyebrow">A LITTLE NOTE, JUST FOR YOU</span><h2>It wouldn’t be the same without you, {invitation.guestName}.</h2><p>We’d love for you to join us as we celebrate a day full of love, laughter, and all our favourite people.</p>
          <div className="guest-event-details"><span><small>THE DAY</small><strong>{formatDate(invitation.event.date)}</strong></span><span><small>THE PLACE</small><strong>{invitation.event.location || 'Details to follow'}</strong></span></div>
          <form className="guest-rsvp-form" onSubmit={submitRsvp}>
            <span className="rsvp-question">Will you be joining us?</span>
            <div className="rsvp-options">
              <button type="button" className={response === 'joyfully' ? 'rsvp-option rsvp-option--selected' : 'rsvp-option'} onClick={() => setResponse('joyfully')}><span>☺</span><strong>Joyfully accepts</strong><small>Save a dance for us</small></button>
              <button type="button" className={response === 'regretfully' ? 'rsvp-option rsvp-option--selected' : 'rsvp-option'} onClick={() => setResponse('regretfully')}><span>♡</span><strong>Regretfully declines</strong><small>We’ll be there in spirit</small></button>
              <button type="button" className={response === 'maybe' ? 'rsvp-option rsvp-option--selected' : 'rsvp-option'} onClick={() => setResponse('maybe')}><span>◷</span><strong>Maybe</strong><small>I’ll let you know soon</small></button>
            </div>
            {invitation.functions.length > 0 && <fieldset className="guest-function-options">
              <legend>Which parts of the celebration are you responding to?</legend>
              {invitation.functions.map((item) => <label key={item.id}>
                <input
                  type="checkbox"
                  checked={selectedFunctionIds.includes(item.id)}
                  onChange={() => setSelectedFunctionIds((current) => current.includes(item.id)
                    ? current.filter((id) => id !== item.id)
                    : [...current, item.id])}
                />
                <span><strong>{item.name}</strong><small>{formatDate(item.date)}{item.venue ? ` · ${item.venue}` : ''}</small></span>
              </label>)}
            </fieldset>}
            {response === 'joyfully' && <label>How many will be joining you?<select value={partySize} onChange={(event) => setPartySize(event.target.value)}><option value="1">Just me</option><option value="2">Two of us</option><option value="3">Three of us</option><option value="4">Four of us</option></select></label>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="button button--primary guest-rsvp-submit" disabled={!response || submitting}>{submitting ? 'Sending…' : 'Send your RSVP with love →'}</button>
            <small className="guest-token-note">Invitation {token ? `#${token.slice(0, 8)}` : ''}</small>
          </form>
        </div>
      </section> : <section className="guest-thank-you"><span>✿</span><p className="eyebrow">YOUR REPLY IS SAFELY WITH US</p><h1>{response === 'joyfully' ? 'We can’t wait to see you.' : response === 'maybe' ? 'Thank you for letting us know.' : 'You’ll be there in spirit.'}</h1><p>Thank you, {invitation.guestName}. We’re so glad you could reply.</p>{response === 'joyfully' && <small>{partySize === '1' ? 'Just you' : `${partySize} guests`} joining the celebration</small>}<div className="guest-thank-you-signature">With love,<br /><strong>{invitation.event.name}</strong></div></section>)}
      <footer className="guest-portal-footer">MADE WITH LOVE, SHARED WITH UTSAV <span>✦</span></footer>
    </main>
  );
}
