import type { Vendor } from '../../../types/vendor.types';
import { RatingDisplay } from '../../../components/common/RatingDisplay';
export function VendorProfileHeader({ vendor }: { vendor: Vendor }) {
  return <header className="vendor-profile-header">{vendor.imageUrl && <img src={vendor.imageUrl} alt="" />}
    <div><h1>{vendor.name}{vendor.verified && <span> · Verified</span>}</h1><p>{vendor.category} · {vendor.city}</p><RatingDisplay rating={vendor.rating} reviewCount={vendor.reviewCount} /></div>
  </header>;
}
