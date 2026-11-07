export type Vendor = {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviewCount: number;
  startingPrice?: number;
  description?: string;
  verified: boolean;
  imageUrl?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
};
