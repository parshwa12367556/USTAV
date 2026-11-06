import type { Event } from '../../../types/event.types';
import { formatDate } from '../../../utils/formatDate';
import { StatusBadge } from '../../../components/common/StatusBadge';
export function EventCard({ event, onSelect }: { event: Event; onSelect?: (event: Event) => void }) {
  const card = <><div><h3>{event.name}</h3><StatusBadge status={event.status} /></div><p>{event.type} · {formatDate(event.date)}</p><p>{event.guestCount} guests{event.venue ? ` · ${event.venue}` : ''}</p></>;
  return onSelect ? <button type="button" className="event-card" onClick={() => onSelect(event)}>{card}</button> : <article className="event-card">{card}</article>;
}
