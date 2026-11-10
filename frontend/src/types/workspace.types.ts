export type EventRecord = {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  guests: number;
  budget: number;
  spent: number;
  status: 'Planning' | 'Confirmed' | 'Completed' | 'Cancelled';
  initials: string;
  accent: string;
};

export type GuestRecord = {
  id?: string;
  invitedFunctionIds?: string[];
  name: string;
  group: string;
  email: string;
  phone?: string;
  maxAttendees?: number;
  status: 'Confirmed' | 'Pending' | 'Declined' | 'Maybe';
};
