import type { Guest } from '../../../types/guest.types';
export function AttendanceStats({ guests }: { guests: Guest[] }) {
  const attending = guests.filter((item) => item.rsvpStatus === 'attending').length;
  const declined = guests.filter((item) => item.rsvpStatus === 'declined').length;
  return <dl className="attendance-stats"><div><dt>Invited</dt><dd>{guests.length}</dd></div><div><dt>Attending</dt><dd>{attending}</dd></div><div><dt>Declined</dt><dd>{declined}</dd></div><div><dt>Awaiting reply</dt><dd>{guests.length - attending - declined}</dd></div></dl>;
}
