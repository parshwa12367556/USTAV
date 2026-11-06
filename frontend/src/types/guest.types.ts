export type RSVPStatus = 'pending' | 'attending' | 'declined';

export type Guest = {
  id: string;
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
  group?: string;
  rsvpStatus: RSVPStatus;
  plusOnes?: number;
};
