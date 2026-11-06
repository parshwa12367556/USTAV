import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { LoginCredentials } from '../../../types/auth.types';
export function LoginForm({ onSubmit, busy = false, error }: { onSubmit: (credentials: LoginCredentials) => void; busy?: boolean; error?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); onSubmit({ email: email.trim(), password }); };
  return <form className="auth-form" onSubmit={handleSubmit}>
    <label>Email<Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.currentTarget.value)} /></label>
    <label>Password<Input type="password" autoComplete="current-password" minLength={8} required value={password} onChange={(event) => setPassword(event.currentTarget.value)} /></label>
    {error && <p role="alert" className="form-error">{error}</p>}
    <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
  </form>;
}
