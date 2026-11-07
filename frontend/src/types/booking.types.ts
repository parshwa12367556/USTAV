export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export type Booking = {
  id: string;
  eventId: string;
  eventName?: string;
  vendorId: string;
  vendorName?: string;
  serviceName: string;
  eventDate: string;
  amount: number;
  status: BookingStatus;
  createdAt: string;
  assignedStaff?: { membershipId: string; userId: string; name: string }[];
};
