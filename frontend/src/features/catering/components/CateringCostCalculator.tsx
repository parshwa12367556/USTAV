import { useMemo, useState } from 'react';
import { formatCurrency } from '../../../utils/formatCurrency';
export function CateringCostCalculator({ pricePerPlate, initialGuests = 100 }: { pricePerPlate: number; initialGuests?: number }) {
  const [guests, setGuests] = useState(initialGuests);
  const total = useMemo(() => Math.max(0, guests) * Math.max(0, pricePerPlate), [guests, pricePerPlate]);
  return <div className="cost-calculator"><label>Guest count<input type="number" min="0" value={guests} onChange={(event) => setGuests(Number(event.currentTarget.value) || 0)} /></label><p>Estimated catering total <strong>{formatCurrency(total)}</strong></p></div>;
}
