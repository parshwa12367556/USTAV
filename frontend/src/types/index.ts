
/**
 * UTSAV  Shared TypeScript data models
 * All domain types are defined here and consumed by services, hooks and pages.
 */

export type Role = "family" | "vendor" | "admin" | "guest";

export interface User {
  id: string;
  email: string;
  mobile: string;
  fullName: string;
  role: Role;
  city?: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  city: string;
  role: "family" | "vendor";
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ---------- Family / Workspace ----------
export interface FamilyMember {
  id: string;
  familyId: string;
  userId?: string;
  name: string;
  mobile: string;
  email?: string;
  role: "owner" | "administrator" | "event_coordinator" | "viewer";
  isPrimary: boolean;
  joinedAt: string;
}

export interface FamilyWorkspace {
  id: string;
  name: string;
  slug: string;
  city?: string;
  ownerId: string;
  members: FamilyMember[];
  createdAt: string;
}

// ---------- Events & Functions ----------
export type EventType =
  | "wedding" | "engagement" | "birthday" | "anniversary"
  | "naming_ceremony" | "housewarming" | "religious_function" | "other";

export type FunctionType =
  | "engagement" | "haldi" | "mehendi" | "wedding" | "reception"
  | "birthday" | "anniversary" | "other";

export interface EventFunction {
  id: string;
  eventId: string;
  name: string;
  type: FunctionType;
  description?: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string;
  venueId?: string;
  venueName?: string;
  guestCount: number;
  budget: number;
  spent: number;
  status: "planned" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface Event {
  id: string;
  familyId: string;
  name: string;
  type: EventType;
  description?: string;
  startDate: string;
  endDate: string;
  city?: string;
  status: "draft" | "planning" | "confirmed" | "completed" | "cancelled";
  totalBudget: number;
  functions: EventFunction[];
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  name: string;
  type: EventType;
  description?: string;
  startDate: string;
  endDate: string;
  city?: string;
  totalBudget?: number;
}

export interface CreateFunctionInput {
  eventId: string;
  name: string;
  type: FunctionType;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId?: string;
  guestCount: number;
  budget: number;
}

// ---------- Guests ----------
export type RsvpStatus = "pending" | "accepted" | "declined" | "maybe";

export interface GuestGroup {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  guestCount: number;
}

export interface Guest {
  id: string;
  familyId: string;
  groupId?: string;
  groupName?: string;
  name: string;
  mobile: string;
  email?: string;
  invitedFunctions: string[]; // function ids
  rsvpStatus: RsvpStatus;
  rsvpAt?: string;
  attendingCount: number;
  adultCount: number;
  childCount: number;
  dietaryPreferences?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateGuestInput {
  familyId: string;
  groupId?: string;
  name: string;
  mobile: string;
  email?: string;
  invitedFunctions: string[];
  attendingCount?: number;
  adultCount?: number;
  childCount?: number;
  dietaryPreferences?: string;
  notes?: string;
}

// ---------- Invitations ----------
export type InvitationStatus = "draft" | "published" | "archived";

export interface InvitationTemplate {
  id: string;
  name: string;
  category: string;
  previewImage: string;
  isFree: boolean;
  price: number;
  config: any;
}

export interface Invitation {
  id: string;
  familyId: string;
  eventId: string;
  name: string;
  templateId: string;
  templateName?: string;
  config: any; // structured invitation config
  status: InvitationStatus;
  recipientCount: number;
  shareUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationConfig {
  brideName: string;
  groomName: string;
  hostNames: string[];
  eventTitle: string;
  functionName?: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  message: string;
  themeColor: string;
  font: string;
  textAlignment: "left" | "center" | "right";
  couplePhoto?: string;
  backgroundImage?: string;
}

// ---------- RSVP ----------
export interface RsvpRecord {
  id: string;
  invitationId: string;
  guestId: string;
  functionId: string;
  status: RsvpStatus;
  attendingCount: number;
  adultCount: number;
  childCount: number;
  dietaryPreferences?: string;
  respondedAt?: string;
}

export interface RsvpStats {
  totalInvited: number;
  accepted: number;
  declined: number;
  pending: number;
  maybe: number;
  expectedAttendees: number;
  adultCount: number;
  childCount: number;
}

// ---------- Venues ----------
export type VenueType =
  | "marriage_hall" | "banquet_hall" | "convention_centre"
  | "garden" | "farmhouse" | "community_hall" | "outdoor_venue"
  | "resort" | "hotel_event_hall";

export interface Venue {
  id: string;
  ownerId?: string;
  name: string;
  type: VenueType;
  city: string;
  address: string;
  capacity: number;
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  facilities: string[];
  images: string[];
  description: string;
  isAc: boolean;
  hasParking: boolean;
  indoor: boolean;
  outdoor: boolean;
  availability: string[]; // dates available (simplified)
  isVerified: boolean;
  createdAt: string;
}

export interface VenueFilters {
  location: string;
  date: string;
  guests: number;
  type: string;
  minPrice: number;
  maxPrice: number;
  indoor: boolean;
  outdoor: boolean;
  ac: boolean;
  parking: boolean;
}

// ---------- Catering ----------
export type CuisineType =
  | "north_indian" | "south_indian" | "gujarati" | "rajasthani"
  | "punjabi" | "bengali" | "maharashtrian" | "mughlai" | "indo_chinese"
  | "continental" | "other";

export type CateringServiceComponent =
  | "food_materials" | "vessels" | "cooking_labour" | "serving_staff"
  | "transportation" | "complete_catering" | "customized_menu";

export interface Caterer {
  id: string;
  ownerId?: string;
  businessName: string;
  city: string;
  cuisine: CuisineType[];
  pricePerPerson: number;
  minimumOrder: number;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  serviceComponents: CateringServiceComponent[];
  isVerified: boolean;
}

export interface CateringQuoteLine {
  component: CateringServiceComponent;
  selected: boolean;
  perPersonPrice: number;
  fixedPrice: number;
  quantity: number;
  amount: number;
}

// ---------- Decoration ----------
export type DecorationCategory =
  | "floral" | "stage" | "mandap" | "haldi" | "mehendi"
  | "reception" | "lighting" | "balloon" | "luxury" | "traditional";

export interface Decorator {
  id: string;
  ownerId?: string;
  businessName: string;
  city: string;
  category: DecorationCategory[];
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  startingPrice: number;
  isVerified: boolean;
}

// ---------- Vendors ----------
export type VendorCategory =
  | "marriage_hall" | "banquet_hall" | "convention_centre" | "garden"
  | "caterer" | "decorator" | "event_management" | "photographer"
  | "makeup_artist" | "transportation" | "dj_entertainment" | "other";

export interface Vendor {
  id: string;
  ownerId?: string;
  businessName: string;
  category: VendorCategory;
  city: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  startingPrice: number;
  isVerified: boolean;
  portfolioImages: string[];
  services: string[];
}

// ---------- Quotations ----------
export type QuotationStatus =
  | "requested" | "submitted" | "accepted" | "rejected" | "revision_requested" | "withdrawn";

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Quotation {
  id: string;
  requestId: string;
  familyId: string;
  vendorId: string;
  vendorName: string;
  serviceCategory: string;
  packageName: string;
  description: string;
  lineItems: QuotationLineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validityDays: number;
  terms: string;
  status: QuotationStatus;
  submittedAt: string;
  respondedAt?: string;
}

export interface QuotationRequest {
  id: string;
  familyId: string;
  eventId?: string;
  functionId?: string;
  serviceCategory: string;
  vendorId?: string;
  eventName: string;
  functionName?: string;
  date: string;
  guestCount: number;
  requirements: string;
  status: "open" | "quoted" | "accepted" | "closed";
  createdAt: string;
}

// ---------- Bookings ----------
export type BookingStatus =
  | "request_submitted" | "quotation_received" | "negotiation"
  | "approved" | "advance_pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  bookingReference: string;
  familyId: string;
  vendorId: string;
  vendorName: string;
  eventId?: string;
  functionId?: string;
  serviceCategory: string;
  serviceName: string;
  date: string;
  startTime?: string;
  endTime?: string;
  guestCount: number;
  quotedAmount: number;
  advancePaid: number;
  remainingAmount: number;
  status: BookingStatus;
  paymentStatus: "pending" | "partial" | "paid" | "refunded";
  createdAt: string;
  updatedAt: string;
}

// ---------- Payments ----------
export type PaymentStatus = "pending" | "processing" | "successful" | "failed" | "refunded";

export interface Payment {
  id: string;
  bookingId: string;
  bookingReference: string;
  amount: number;
  status: PaymentStatus;
  method?: string;
  transactionId?: string;
  invoiceUrl?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  pdfUrl?: string;
}

// ---------- Budget ----------
export type BudgetCategory =
  | "venue" | "catering" | "decoration" | "photography" | "makeup"
  | "transportation" | "entertainment" | "invitations" | "miscellaneous";

export interface BudgetItem {
  id: string;
  familyId: string;
  eventId?: string;
  functionId?: string;
  category: BudgetCategory;
  name: string;
  estimatedAmount: number;
  actualAmount: number;
  paidAmount: number;
  vendor?: string;
  date: string;
  notes?: string;
}

export interface BudgetSummary {
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  remainingBalance: number;
  byCategory: Record<BudgetCategory, { estimated: number; actual: number }>;
}

// ---------- Notifications ----------
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

// ---------- Admin ----------
export interface DashboardStats {
  totalUsers: number;
  totalFamilies: number;
  totalVendors: number;
  pendingVerifications: number;
  totalBookings: number;
  platformRevenue: number;
  pendingDisputes: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

