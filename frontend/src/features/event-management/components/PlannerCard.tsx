import type { Vendor } from '../../../types/vendor.types';
import { RatingDisplay } from '../../../components/common/RatingDisplay';
export function PlannerCard({ planner, onContact }: { planner: Vendor; onContact?: (planner: Vendor) => void }) {
  return <article className="planner-card"><h3>{planner.name}</h3><p>{planner.city}</p><RatingDisplay rating={planner.rating} reviewCount={planner.reviewCount} />{planner.description && <p>{planner.description}</p>}{onContact && <button type="button" onClick={() => onContact(planner)}>Contact planner</button>}</article>;
}
