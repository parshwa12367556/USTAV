import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { RegisterInput } from '../../../types/auth.types';
export function RegisterForm({ onSubmit, busy = false, error }: { onSubmit: (input: RegisterInput) => void; busy?: boolean; error?: string }) {
  const [form, setForm] = useState<RegisterInput>({ name: '', email: '', phone: '', password: '', role: 'family' });
  const update = (key: keyof RegisterInput, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); onSubmit(form); };
  return <form className="auth-form" onSubmit={handleSubmit}>
    <label>Full name<Input autoComplete="name" required value={form.name} onChange={(event) => update('name', event.currentTarget.value)} /></label>
    <label>Email<Input type="email" autoComplete="email" required value={form.email} onChange={(event) => update('email', event.currentTarget.value)} /></label>
    <label>Phone<Input type="tel" autoComplete="tel" required value={form.phone} onChange={(event) => update('phone', event.currentTarget.value)} /></label>
    <label>Password<Input type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={(event) => update('password', event.currentTarget.value)} /></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
  </form>;
}
