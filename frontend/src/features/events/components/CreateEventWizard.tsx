import { useState, type FormEvent } from 'react';
import type { CreateEventInput } from '../../../types/event.types';
import { Button } from '../../../components/ui/Button';
export function CreateEventWizard({ onCreate }: { onCreate: (event: CreateEventInput) => void }) {
  const [form, setForm] = useState<CreateEventInput>({ name: '', type: '', date: '', guestCount: 0 });
  const set = (key: keyof CreateEventInput, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); onCreate(form); };
  return <form className="event-wizard" onSubmit={submit}>
    <label>Event name<input required minLength={2} value={form.name} onChange={(event) => set('name', event.currentTarget.value)} /></label>
    <label>Event type<input required value={form.type} onChange={(event) => set('type', event.currentTarget.value)} /></label>
    <label>Date<input type="date" required value={form.date} onChange={(event) => set('date', event.currentTarget.value)} /></label>
    <label>Guest count<input type="number" min="0" required value={form.guestCount} onChange={(event) => set('guestCount', Number(event.currentTarget.value))} /></label>
    <Button type="submit">Create event</Button>
  </form>;
}
