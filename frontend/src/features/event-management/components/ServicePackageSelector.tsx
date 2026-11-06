export type ServicePackage = { id: string; name: string; description: string; price: number };
export function ServicePackageSelector({ packages, value, onChange }: { packages: ServicePackage[]; value?: string; onChange: (id: string) => void }) {
  return <div className="service-packages">{packages.map((item) => <label key={item.id}>
    <input type="radio" name="service-package" checked={value === item.id} onChange={() => onChange(item.id)} />
    <span><strong>{item.name}</strong><small>{item.description}</small><b>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price)}</b></span>
  </label>)}</div>;
}
