import { useState } from 'react';
import type { VenueFilters } from '../api/venuesApi';
export function VenueFilterBar({ onChange }: { onChange: (filters: VenueFilters) => void }) {
  const [city, setCity] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const apply = () => onChange({ city: city.trim() || undefined, minCapacity: minCapacity ? Number(minCapacity) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined });
  return <div className="venue-filter-bar"><label>City<input value={city} onChange={(event) => setCity(event.currentTarget.value)} /></label><label>Minimum capacity<input type="number" min="0" value={minCapacity} onChange={(event) => setMinCapacity(event.currentTarget.value)} /></label><label>Maximum price<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.currentTarget.value)} /></label><button type="button" onClick={apply}>Apply filters</button></div>;
}
