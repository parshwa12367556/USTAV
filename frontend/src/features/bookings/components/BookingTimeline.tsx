import type { Booking } from '../../../types/booking.types';
import { formatDate } from '../../../utils/formatDate';
export function BookingTimeline({ bookings }: { bookings: Booking[] }) {
  return <ol className="booking-timeline">{[...bookings].sort((a, b) => a.eventDate.localeCompare(b.eventDate)).map((booking) => <li key={booking.id}>
    <time dateTime={booking.eventDate}>{formatDate(booking.eventDate)}</time><strong>{booking.serviceName}</strong><span>{booking.status}</span>
  </li>)}</ol>;
}
