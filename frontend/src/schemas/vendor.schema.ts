import { z } from 'zod';

export const vendorProfileSchema = z.object({
  name: z.string().trim().min(2),
  category: z.string().min(1),
  city: z.string().trim().min(2),
  description: z.string().max(2000).optional(),
  startingPrice: z.number().min(0).optional(),
  phone: z.string().trim().optional(),
  email: z.union([z.email(), z.literal('')]).optional(),
});
