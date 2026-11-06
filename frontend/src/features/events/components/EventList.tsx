import type { Event } from '../../../types/event.types';
import { EventCard } from './EventCard';
export function EventList({ events, onSelect }: { events: Event[]; onSelect?: (event: Event) => void }) {
  return events.length ? <div className="event-list">{events.map((event) => <EventCard key={event.id} event={event} onSelect={onSelect} />)}</div> : <p role="status">No events yet. Create an event to get started.</p>;
}
