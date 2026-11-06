import type { Vendor } from '../../../types/vendor.types';
import { RatingDisplay } from '../../../components/common/RatingDisplay';
import { PriceDisplay } from '../../../components/common/PriceDisplay';
export function VendorCard({ vendor, onSelect }: { vendor: Vendor; onSelect?: (vendor: Vendor) => void }) {
  return <article className="vendor-card">{vendor.imageUrl && <img src={vendor.imageUrl} alt="" loading="lazy" />}
    <h3>{vendor.name}{vendor.verified && <span aria-label="Verified vendor"> ✓</span>}</h3><p>{vendor.category} · {vendor.city}</p>
    <RatingDisplay rating={vendor.rating} reviewCount={vendor.reviewCount} />
    {vendor.startingPrice !== undefined && <p>From <PriceDisplay amount={vendor.startingPrice} /></p>}
    {onSelect && <button type="button" onClick={() => onSelect(vendor)}>View details</button>}
  </article>;
}
