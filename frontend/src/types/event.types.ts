export type EventStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';

export type Event = {
  id: string;
  name: string;
  type: string;
  date: string;
  endDate?: string;
  venue?: string;
  guestCount: number;
  budget?: number;
  status: EventStatus;
  description?: string;
};

export type CreateEventInput = Omit<Event, 'id' | 'status'> & {
  status?: EventStatus;
};
