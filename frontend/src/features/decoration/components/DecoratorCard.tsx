import type { Vendor } from '../../../types/vendor.types';
import { RatingDisplay } from '../../../components/common/RatingDisplay';
import { PriceDisplay } from '../../../components/common/PriceDisplay';
export function DecoratorCard({ vendor, onSelect }: { vendor: Vendor; onSelect?: (vendor: Vendor) => void }) {
  return <article className="vendor-card"><h3>{vendor.name}</h3><p>{vendor.city} · {vendor.category}</p><RatingDisplay rating={vendor.rating} reviewCount={vendor.reviewCount} />{vendor.startingPrice !== undefined && <p>Packages from <PriceDisplay amount={vendor.startingPrice} /></p>}{onSelect && <button type="button" onClick={() => onSelect(vendor)}>View portfolio</button>}</article>;
}
