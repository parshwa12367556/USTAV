import { z } from 'zod';

export const guestSchema = z.object({
  name: z.string().trim().min(2, 'Guest name is required.'),
  email: z.union([z.email(), z.literal('')]).optional(),
  phone: z.string().trim().optional(),
  group: z.string().trim().optional(),
  plusOnes: z.number().int().min(0).default(0),
});
