export type Venue = {
  id: string;
  name: string;
  city: string;
  capacity: number;
  pricePerDay: number;
  amenities: string[];
  imageUrl?: string;
  availableDates?: string[];
};
