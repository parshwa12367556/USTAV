import { z } from 'zod';

export const quotationSchema = z.object({
  vendorId: z.string().min(1),
  title: z.string().trim().min(2),
  validUntil: z.iso.date().optional(),
  items: z.array(z.object({
    description: z.string().trim().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })).min(1),
});
