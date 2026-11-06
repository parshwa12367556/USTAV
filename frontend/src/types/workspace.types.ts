export type EventRecord = {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  guests: number;
  budget: number;
  spent: number;
  status: 'Planning' | 'Confirmed' | 'Completed';
  initials: string;
  accent: string;
};

export type GuestRecord = {
  name: string;
  group: string;
  email: string;
  status: 'Confirmed' | 'Pending' | 'Declined';
};
