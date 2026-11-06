import type { RSVPStatus } from './guest.types';

export type RSVPResponse = {
  guestId: string;
  invitationToken: string;
  status: RSVPStatus;
  plusOnes: number;
  dietaryNotes?: string;
  functionIds: string[];
};
