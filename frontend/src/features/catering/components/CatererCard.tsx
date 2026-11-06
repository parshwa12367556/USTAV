import { RatingDisplay } from '../../../components/common/RatingDisplay';
import { PriceDisplay } from '../../../components/common/PriceDisplay';
import type { Vendor } from '../../../types/vendor.types';
export function CatererCard({ vendor, onView }: { vendor: Vendor; onView?: (vendor: Vendor) => void }) {
  return <article className="vendor-card"><h3>{vendor.name}</h3><p>{vendor.city} · {vendor.category}</p><RatingDisplay rating={vendor.rating} reviewCount={vendor.reviewCount} />{vendor.startingPrice !== undefined && <p>From <PriceDisplay amount={vendor.startingPrice} /></p>}{onView && <button type="button" onClick={() => onView(vendor)}>View menus</button>}</article>;
}
