import type { Guest } from '../types/guest.types';

export const mockGuests: Guest[] = [
  { id: 'guest-1', eventId: 'event-1', name: 'Ananya Sharma', email: 'ananya@example.com', group: 'Family', rsvpStatus: 'attending' },
  { id: 'guest-2', eventId: 'event-1', name: 'Rohan Mehta', email: 'rohan@example.com', group: 'Friends', rsvpStatus: 'pending' },
];
