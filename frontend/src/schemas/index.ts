
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  city: z.string().min(2, "City is required"),
  role: z.enum(["family", "vendor"]),
});

export const otpSchema = z.string().length(6, "OTP must be 6 digits");

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const createEventSchema = z.object({
  name: z.string().min(2, "Event name is required"),
  type: z.string().min(1, "Select event type"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  city: z.string().optional(),
  totalBudget: z.coerce.number().optional(),
});

export const createFunctionSchema = z.object({
  name: z.string().min(2, "Function name is required"),
  type: z.string().min(1, "Select function type"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venueId: z.string().optional(),
  guestCount: z.coerce.number().min(1, "Guest count required"),
  budget: z.coerce.number().min(0, "Budget must be positive"),
});

export const createGuestSchema = z.object({
  name: z.string().min(2, "Guest name is required"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  groupId: z.string().optional(),
  invitedFunctions: z.array(z.string()).min(1, "Select at least one function"),
  attendingCount: z.coerce.number().min(1, "At least 1 attendee"),
  adultCount: z.coerce.number().min(0),
  childCount: z.coerce.number().min(0),
  dietaryPreferences: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => (d.adultCount || 0) + (d.childCount || 0) <= (d.attendingCount || 0), {
  message: "Adults + children cannot exceed total attendees",
  path: ["childCount"],
});

export const invitationConfigSchema = z.object({
  brideName: z.string().min(1, "Bride name is required"),
  groomName: z.string().min(1, "Groom name is required"),
  hostNames: z.array(z.string()).min(1, "Add at least one host name"),
  eventTitle: z.string().min(1, "Event title is required"),
  functionName: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  venue: z.string().min(1, "Venue is required"),
  address: z.string().min(1, "Address is required"),
  message: z.string().min(1, "Invitation message is required"),
  themeColor: z.string().min(1, "Select theme color"),
  font: z.string().min(1, "Select font"),
  textAlignment: z.enum(["left", "center", "right"]),
  couplePhoto: z.string().optional(),
  backgroundImage: z.string().optional(),
});

export const rsvpFormSchema = z.object({
  status: z.enum(["accepted", "declined", "maybe"]),
  attendingCount: z.coerce.number().min(1, "At least 1 attendee"),
  adultCount: z.coerce.number().min(0),
  childCount: z.coerce.number().min(0),
  dietaryPreferences: z.string().optional(),
}).refine((d) => (d.adultCount || 0) + (d.childCount || 0) <= (d.attendingCount || 0), {
  message: "Adults + children cannot exceed total attendees",
  path: ["childCount"],
});

export const venueSearchSchema = z.object({
  location: z.string().optional(),
  date: z.string().optional(),
  guests: z.coerce.number().optional(),
  type: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

export const quotationSubmitSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  description: z.string().min(1, "Description is required"),
  subtotal: z.coerce.number().min(0),
  tax: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  total: z.coerce.number().min(0),
  validityDays: z.coerce.number().min(1),
  terms: z.string().min(1, "Terms and conditions are required"),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
  })).min(1, "Add at least one line item"),
});

export const budgetItemSchema = z.object({
  category: z.string().min(1, "Select category"),
  name: z.string().min(1, "Expense name is required"),
  estimatedAmount: z.coerce.number().min(0),
  actualAmount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0),
  vendor: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateFunctionInput = z.infer<typeof createFunctionSchema>;
export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type InvitationConfigInput = z.infer<typeof invitationConfigSchema>;
export type RsvpFormInput = z.infer<typeof rsvpFormSchema>;
export type VenueSearchInput = z.infer<typeof venueSearchSchema>;
export type QuotationSubmitInput = z.infer<typeof quotationSubmitSchema>;
export type BudgetItemInput = z.infer<typeof budgetItemSchema>;

