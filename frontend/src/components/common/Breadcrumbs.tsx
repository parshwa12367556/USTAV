import { Link } from 'react-router-dom';

export type BreadcrumbItem = { label: string; href?: string };
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <nav aria-label="Breadcrumb"><ol className="breadcrumbs">
    {items.map((item, index) => <li key={`${item.label}-${index}`}>
      {item.href && index < items.length - 1 ? <Link to={item.href}>{item.label}</Link> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}
    </li>)}
  </ol></nav>;
}
