import { PriceDisplay } from '../../../components/common/PriceDisplay';
export type VendorService = { id: string; name: string; description?: string; price: number };
export function ServiceList({ services }: { services: VendorService[] }) {
  return <ul className="vendor-service-list">{services.map((service) => <li key={service.id}><div><strong>{service.name}</strong>{service.description && <p>{service.description}</p>}</div><PriceDisplay amount={service.price} /></li>)}</ul>;
}
