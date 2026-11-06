import { useState, type FormEvent } from 'react';
export function GuestGroupManager({ groups, onAdd, onRemove }: { groups: string[]; onAdd: (name: string) => void; onRemove?: (name: string) => void }) {
  const [name, setName] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); const value = name.trim(); if (!value || groups.includes(value)) return; onAdd(value); setName(''); };
  return <section className="guest-groups"><form onSubmit={submit}><label>New group<input value={name} onChange={(event) => setName(event.currentTarget.value)} required /></label><button type="submit">Add group</button></form>
    <ul>{groups.map((group) => <li key={group}>{group}{onRemove && <button type="button" aria-label={`Remove ${group}`} onClick={() => onRemove(group)}>×</button>}</li>)}</ul>
  </section>;
}
