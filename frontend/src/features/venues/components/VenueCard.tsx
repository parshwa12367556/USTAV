import type { Venue } from '../../../types/venue.types';
import { PriceDisplay } from '../../../components/common/PriceDisplay';
export function VenueCard({ venue, onSelect }: { venue: Venue; onSelect?: (venue: Venue) => void }) {
  return <article className="venue-card">{venue.imageUrl && <img src={venue.imageUrl} alt="" loading="lazy" />}
    <h3>{venue.name}</h3><p>{venue.city} · Up to {venue.capacity} guests</p><p><PriceDisplay amount={venue.pricePerDay} /> / day</p>
    <ul>{venue.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>{onSelect && <button type="button" onClick={() => onSelect(venue)}>View venue</button>}
  </article>;
}
