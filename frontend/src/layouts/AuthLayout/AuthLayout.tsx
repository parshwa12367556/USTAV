import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { AuthBrandPanel } from './AuthBrandPanel';
export function AuthLayout({ children, title }: PropsWithChildren<{ title: string }>) {
  return <main className="auth-layout"><AuthBrandPanel /><section className="auth-layout__content"><Link to="/" className="auth-back-link">← Back to Utsav</Link><h1>{title}</h1>{children}</section></main>;
}
