import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  email: z.email(),
  phone: z.string().trim().min(10, 'Enter a valid phone number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(['family', 'vendor', 'guest']),
});
