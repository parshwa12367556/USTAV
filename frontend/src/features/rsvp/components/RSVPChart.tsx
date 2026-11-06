import { PieChart } from '../../../components/charts/PieChart';
import type { Guest } from '../../../types/guest.types';
export function RSVPChart({ guests }: { guests: Guest[] }) {
  const counts = { attending: 0, declined: 0, pending: 0 };
  guests.forEach((guest) => { counts[guest.rsvpStatus] += 1; });
  return <PieChart label="Guest RSVP responses" values={[
    { label: 'Attending', value: counts.attending, color: '#667968' },
    { label: 'Declined', value: counts.declined, color: '#944b56' },
    { label: 'Pending', value: counts.pending, color: '#bd8f4e' },
  ]} />;
}
