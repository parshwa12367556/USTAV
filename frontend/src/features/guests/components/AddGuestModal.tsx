import { useState, type FormEvent } from 'react';
import type { Guest } from '../../../types/guest.types';
import { Modal } from '../../../components/ui/Modal';
export function AddGuestModal({ open, eventId, onClose, onAdd }: { open: boolean; eventId: string; onClose: () => void; onAdd: (guest: Omit<Guest, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim()) return; onAdd({ eventId, name: name.trim(), ...(email ? { email: email.trim() } : {}), rsvpStatus: 'pending' }); setName(''); setEmail(''); onClose(); };
  return <Modal open={open} title="Add a guest" onClose={onClose}><form onSubmit={submit}>
    <label>Name<input required value={name} onChange={(event) => setName(event.currentTarget.value)} /></label>
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} /></label>
    <button type="submit">Add guest</button>
  </form></Modal>;
}
