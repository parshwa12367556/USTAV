import { Logo } from '../../components/common/Logo';
export function AuthBrandPanel({ title = 'Make room for joy.', description = 'Plan meaningful celebrations together, one thoughtful detail at a time.' }: { title?: string; description?: string }) {
  return <aside className="auth-brand-panel"><Logo /><div><span className="eyebrow">UTSAV · CELEBRATE TOGETHER</span><h2>{title}</h2><p>{description}</p></div></aside>;
}
