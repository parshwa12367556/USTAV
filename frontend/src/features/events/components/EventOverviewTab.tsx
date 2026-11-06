import type { Event } from '../../../types/event.types';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
export function EventOverviewTab({ event }: { event: Event }) {
  return <section className="event-overview"><h2>{event.name}</h2>{event.description && <p>{event.description}</p>}
    <dl><dt>Date</dt><dd>{formatDate(event.date)}</dd><dt>Venue</dt><dd>{event.venue || 'Not selected'}</dd><dt>Guests</dt><dd>{event.guestCount}</dd>{event.budget !== undefined && <><dt>Budget</dt><dd>{formatCurrency(event.budget)}</dd></>}</dl>
  </section>;
}
