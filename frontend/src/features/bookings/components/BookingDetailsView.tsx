import type { Booking } from '../../../types/booking.types';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { StatusBadge } from '../../../components/common/StatusBadge';
export function BookingDetailsView({ booking }: { booking: Booking }) {
  return <article className="booking-details">
    <h2>{booking.serviceName}</h2><StatusBadge status={booking.status} />
    <dl><dt>Event date</dt><dd>{formatDate(booking.eventDate)}</dd><dt>Amount</dt><dd>{formatCurrency(booking.amount)}</dd><dt>Booking reference</dt><dd>{booking.id}</dd></dl>
  </article>;
}
