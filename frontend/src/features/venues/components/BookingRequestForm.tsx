import { useState, type FormEvent } from 'react';
export function BookingRequestForm({ venueId, onSubmit }: { venueId: string; onSubmit: (request: { venueId: string; date: string; guestCount: number; message: string }) => void }) {
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ venueId, date, guestCount, message: message.trim() }); };
  return <form onSubmit={submit}><label>Event date<input type="date" required min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.currentTarget.value)} /></label><label>Guests<input type="number" min="1" required value={guestCount} onChange={(event) => setGuestCount(Number(event.currentTarget.value))} /></label><label>Message<textarea value={message} onChange={(event) => setMessage(event.currentTarget.value)} /></label><button type="submit">Request availability</button></form>;
}
