import { useCallback, useState } from 'react';
import type { CreateEventInput, Event } from '../../../types/event.types';
import { mockEvents } from '../../../mocks/mockEvents';

export function useEvents(initial: Event[] = mockEvents) {
  const [events, setEvents] = useState(initial);
  const addEvent = useCallback((input: CreateEventInput) => {
    const event: Event = { ...input, id: `event-${Date.now()}`, status: input.status ?? 'planning' };
    setEvents((current) => [event, ...current]);
    return event;
  }, []);
  const removeEvent = useCallback((id: string) => setEvents((current) => current.filter((event) => event.id !== id)), []);
  return { events, addEvent, removeEvent };
}
