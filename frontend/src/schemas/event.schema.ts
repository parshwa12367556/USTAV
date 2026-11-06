import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().trim().min(2, 'Event name is required.'),
  type: z.string().trim().min(1, 'Choose an event type.'),
  date: z.iso.date(),
  endDate: z.iso.date().optional(),
  venue: z.string().trim().optional(),
  guestCount: z.number().int().min(0),
  budget: z.number().min(0).optional(),
  description: z.string().max(1000).optional(),
});
