import { useState, type FormEvent } from 'react';
import type { EventFunction } from '../../../types/function.types';
export function FunctionForm({ eventId, onSubmit }: { eventId: string; onSubmit: (input: Omit<EventFunction, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !date) return; onSubmit({ eventId, name: name.trim(), date }); setName(''); };
  return <form onSubmit={submit}><label>Function name<input required value={name} onChange={(event) => setName(event.currentTarget.value)} /></label><label>Date<input type="date" required value={date} onChange={(event) => setDate(event.currentTarget.value)} /></label><button type="submit">Add function</button></form>;
}
