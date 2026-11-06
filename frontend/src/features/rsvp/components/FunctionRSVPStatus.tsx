import type { RSVPStatus } from '../../../types/guest.types';
export function FunctionRSVPStatus({ status }: { status: RSVPStatus }) {
  return <span className={`rsvp-status rsvp-status--${status}`}>{status === 'attending' ? 'Attending' : status === 'declined' ? 'Not attending' : 'Awaiting reply'}</span>;
}
