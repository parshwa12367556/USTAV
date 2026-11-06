export type BookingStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export type Booking = {
  id: string;
  eventId: string;
  vendorId: string;
  serviceName: string;
  eventDate: string;
  amount: number;
  status: BookingStatus;
  createdAt: string;
};
