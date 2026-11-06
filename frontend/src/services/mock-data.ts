
/**
 * UTSAV  Mock demonstration data
 * Clearly labelled demonstration data used while the Flask backend is unavailable.
 * Switching to real APIs: replace each service function implementation to call src/services/api.ts
 */

import type {
  User, FamilyWorkspace, Event, EventFunction, Guest, Invitation, InvitationTemplate,
  Venue, Caterer, Decorator, Vendor, Quotation, QuotationRequest, Booking, Payment,
  BudgetItem, Notification, DashboardStats, RsvpStats,
} from "@/types";

export const DELAY_MS = 600;

// ---------- Auth ----------
export const mockUser: User = {
  id: "usr_101",
  email: "rajesh.sharma@example.com",
  mobile: "+91 98765 43210",
  fullName: "Rajesh Sharma",
  role: "family",
  city: "Delhi",
  emailVerified: true,
  mobileVerified: true,
  createdAt: "2025-06-12T09:00:00Z",
};

export const mockVendorUser: User = {
  ...mockUser,
  id: "usr_201",
  email: "owner@royalbanquet.in",
  mobile: "+91 91234 56780",
  fullName: "Amit Singh",
  role: "vendor",
  city: "Mumbai",
};

// ---------- Family ----------
export const mockFamily: FamilyWorkspace = {
  id: "fam_001",
  name: "Sharma Family",
  slug: "sharma-family",
  city: "Delhi",
  ownerId: "usr_101",
  members: [
    { id: "m_1", familyId: "fam_001", userId: "usr_101", name: "Rajesh Sharma", mobile: "+91 98765 43210", email: "rajesh.sharma@example.com", role: "owner", isPrimary: true, joinedAt: "2025-06-12T09:00:00Z" },
    { id: "m_2", familyId: "fam_001", name: "Sunita Sharma", mobile: "+91 98765 43211", email: "sunita.sharma@example.com", role: "administrator", isPrimary: false, joinedAt: "2025-06-12T09:30:00Z" },
    { id: "m_3", familyId: "fam_001", name: "Karan Sharma", mobile: "+91 98765 43212", email: "karan.sharma@example.com", role: "event_coordinator", isPrimary: false, joinedAt: "2025-09-01T10:00:00Z" },
  ],
  createdAt: "2025-06-12T09:00:00Z",
};

// ---------- Events ----------
export const mockEvents: Event[] = [
  {
    id: "evt_001",
    familyId: "fam_001",
    name: "Aanya & Vihaan Wedding",
    type: "wedding",
    description: "Grand wedding celebration of Aanya and Vihaan",
    startDate: "2026-02-14",
    endDate: "2026-02-16",
    city: "Delhi",
    status: "planning",
    totalBudget: 1200000,
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    functions: [
      { id: "fn_001", eventId: "evt_001", name: "Engagement", type: "engagement", description: "Ring ceremony", date: "2026-02-14", startTime: "17:00", endTime: "20:00", venueName: "Royal Palace Banquet", guestCount: 250, budget: 300000, spent: 280000, status: "confirmed", createdAt: "2025-11-01T10:00:00Z" },
      { id: "fn_002", eventId: "evt_001", name: "Haldi Ceremony", type: "haldi", description: "Turmeric ceremony", date: "2026-02-15", startTime: "09:00", endTime: "12:00", venueName: "Sharma Family Home", guestCount: 120, budget: 80000, spent: 65000, status: "confirmed", createdAt: "2025-11-01T10:30:00Z" },
      { id: "fn_003", eventId: "evt_001", name: "Mehendi", type: "mehendi", description: "Henna ceremony", date: "2026-02-15", startTime: "15:00", endTime: "19:00", venueName: "Sharma Family Home", guestCount: 180, budget: 120000, spent: 110000, status: "confirmed", createdAt: "2025-11-01T11:00:00Z" },
      { id: "fn_004", eventId: "evt_001", name: "Wedding", type: "wedding", description: "Main wedding ceremony", date: "2026-02-16", startTime: "10:00", endTime: "13:00", venueName: "Grand Mandap Hall", guestCount: 500, budget: 500000, spent: 420000, status: "planned", createdAt: "2025-11-01T11:30:00Z" },
      { id: "fn_005", eventId: "evt_001", name: "Reception", type: "reception", description: "Wedding reception", date: "2026-02-16", startTime: "19:00", endTime: "23:00", venueName: "Grand Mandap Hall", guestCount: 600, budget: 200000, spent: 0, status: "planned", createdAt: "2025-11-01T12:00:00Z" },
    ],
    createdAt: "2025-10-15T08:00:00Z",
    updatedAt: "2025-11-10T14:00:00Z",
  },
  {
    id: "evt_002",
    familyId: "fam_001",
    name: "Arjun Birthday Celebration",
    type: "birthday",
    description: "30th birthday celebration",
    startDate: "2026-04-05",
    endDate: "2026-04-05",
    city: "Delhi",
    status: "planning",
    totalBudget: 150000,
    functions: [
      { id: "fn_006", eventId: "evt_002", name: "Birthday Party", type: "birthday", description: "Birthday dinner", date: "2026-04-05", startTime: "19:00", endTime: "23:00", venueName: "The Garden Terrace", guestCount: 60, budget: 150000, spent: 20000, status: "planned", createdAt: "2026-01-10T09:00:00Z" },
    ],
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-01-10T09:00:00Z",
  },
];

// ---------- Guests ----------
export const mockGuests: Guest[] = [
  { id: "g_001", familyId: "fam_001", groupName: "Bride Family", name: "Mrs. Kamla Sharma", mobile: "+91 98111 22222", email: "kamla@example.com", invitedFunctions: ["fn_001","fn_002","fn_003","fn_004","fn_005"], rsvpStatus: "accepted", rsvpAt: "2025-11-05T10:00:00Z", attendingCount: 2, adultCount: 2, childCount: 0, createdAt: "2025-10-20T09:00:00Z" },
  { id: "g_002", familyId: "fam_001", groupName: "Bride Family", name: "Mr. Prakash Sharma", mobile: "+91 98111 22223", invitedFunctions: ["fn_001","fn_002","fn_003","fn_004","fn_005"], rsvpStatus: "accepted", rsvpAt: "2025-11-05T10:05:00Z", attendingCount: 2, adultCount: 2, childCount: 0, createdAt: "2025-10-20T09:05:00Z" },
  { id: "g_003", familyId: "fam_001", groupName: "Groom Family", name: "Mr. Ramesh Verma", mobile: "+91 98111 33331", email: "ramesh@example.com", invitedFunctions: ["fn_001","fn_003","fn_004","fn_005"], rsvpStatus: "pending", attendingCount: 3, adultCount: 2, childCount: 1, createdAt: "2025-10-21T09:00:00Z" },
  { id: "g_004", familyId: "fam_001", groupName: "Friends", name: "Priya Mehra", mobile: "+91 98111 44441", email: "priya@example.com", invitedFunctions: ["fn_002","fn_003","fn_005"], rsvpStatus: "declined", rsvpAt: "2025-11-02T16:00:00Z", attendingCount: 0, adultCount: 0, childCount: 0, createdAt: "2025-10-22T09:00:00Z" },
  { id: "g_005", familyId: "fam_001", groupName: "Friends", name: "Rohit Kapoor", mobile: "+91 98111 44442", invitedFunctions: ["fn_001","fn_003","fn_004","fn_005"], rsvpStatus: "maybe", attendingCount: 1, adultCount: 1, childCount: 0, createdAt: "2025-10-22T09:30:00Z" },
  { id: "g_006", familyId: "fam_001", groupName: "Office Colleagues", name: "Sneha Iyer", mobile: "+91 98111 55551", email: "sneha@example.com", invitedFunctions: ["fn_004","fn_005"], rsvpStatus: "pending", attendingCount: 1, adultCount: 1, childCount: 0, createdAt: "2025-10-23T09:00:00Z" },
  { id: "g_007", familyId: "fam_001", groupName: "VIP Guests", name: "Mrs. Indira Gujral", mobile: "+91 98111 66661", invitedFunctions: ["fn_001","fn_004","fn_005"], rsvpStatus: "accepted", rsvpAt: "2025-11-01T11:00:00Z", attendingCount: 2, adultCount: 2, childCount: 0, createdAt: "2025-10-18T09:00:00Z" },
];

// ---------- Venues ----------
export const mockVenues: Venue[] = [
  {
    id: "vn_001", name: "Royal Palace Banquet Hall", type: "banquet_hall",
    city: "Delhi", address: "Connaught Place, New Delhi, Delhi 110001",
    capacity: 500, pricePerDay: 85000, rating: 4.7, reviewCount: 128,
    facilities: ["AC", "Parking", "In-house Catering", "Decoration Allowed", "Bridal Room"],
    images: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"],
    description: "Elegant banquet hall in the heart of Delhi with premium amenities.",
    isAc: true, hasParking: true, indoor: true, outdoor: false, availability: ["2026-02-14","2026-02-15","2026-02-16"], isVerified: true, createdAt: "2025-08-01T00:00:00Z",
  },
  {
    id: "vn_002", name: "Grand Mandap Garden", type: "garden",
    city: "Delhi", address: "Saket, New Delhi, Delhi 110017",
    capacity: 700, pricePerDay: 60000, rating: 4.5, reviewCount: 94,
    facilities: ["Parking", "Outdoor Mandap", "Garden Lighting", "Power Backup", "Restrooms"],
    images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"],
    description: "Lush garden venue perfect for mehendi and outdoor ceremonies.",
    isAc: false, hasParking: true, indoor: false, outdoor: true, availability: ["2026-02-15","2026-02-16"], isVerified: true, createdAt: "2025-08-05T00:00:00Z",
  },
  {
    id: "vn_003", name: "Heritage Convention Centre", type: "convention_centre",
    city: "Mumbai", address: "Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    capacity: 1000, pricePerDay: 150000, rating: 4.8, reviewCount: 210,
    facilities: ["AC", "Parking", "Valet", "In-house Catering", "Stage Setup", "AV System"],
    images: ["https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80"],
    description: "World-class convention centre for large-scale celebrations.",
    isAc: true, hasParking: true, indoor: true, outdoor: false, availability: ["2026-02-16"], isVerified: true, createdAt: "2025-09-10T00:00:00Z",
  },
  {
    id: "vn_004", name: "Green Valley Farmhouse", type: "farmhouse",
    city: "Pune", address: "Lonavala Road, Pune, Maharashtra 412101",
    capacity: 300, pricePerDay: 45000, rating: 4.3, reviewCount: 67,
    facilities: ["Parking", "Lawn", "Bonfire Area", "Camping", "Power Backup"],
    images: ["https://images.unsplash.com/photo-1470770858568-580fa194d27e?auto=format&fit=crop&w=800&q=80"],
    description: "Serene farmhouse for intimate destination celebrations.",
    isAc: false, hasParking: true, indoor: false, outdoor: true, availability: ["2026-02-14","2026-02-15"], isVerified: false, createdAt: "2025-09-20T00:00:00Z",
  },
];

// ---------- Caterers ----------
export const mockCaterers: Caterer[] = [
  {
    id: "ct_001", businessName: "Royal Spice Caterers", city: "Delhi",
    cuisine: ["north_indian","punjabi","mughlai"], pricePerPerson: 650, minimumOrder: 100,
    rating: 4.6, reviewCount: 89, images: ["https://images.unsplash.com/photo-1559339352-120250de037e?auto=format&fit=crop&w=800&q=80"],
    description: "Authentic North Indian and Mughlai cuisine for weddings.",
    serviceComponents: ["food_materials","cooking_labour","serving_staff","transportation"], isVerified: true,
  },
  {
    id: "ct_002", businessName: "South Feast Catering", city: "Delhi",
    cuisine: ["south_indian"], pricePerPerson: 550, minimumOrder: 80,
    rating: 4.4, reviewCount: 54, images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"],
    description: "Traditional South Indian vegetarian and non-vegetarian feasts.",
    serviceComponents: ["food_materials","vessels","cooking_labour","serving_staff"], isVerified: true,
  },
];

// ---------- Decorators ----------
export const mockDecorators: Decorator[] = [
  {
    id: "dc_001", businessName: "Floral Dreams", city: "Delhi",
    category: ["floral","mandap","stage"], rating: 4.7, reviewCount: 72,
    images: ["https://images.unsplash.com/photo-1609886500271-9602b2a4154f?auto=format&fit=crop&w=800&q=80"],
    description: "Exquisite floral and mandap decoration for Indian weddings.",
    startingPrice: 90000, isVerified: true,
  },
  {
    id: "dc_002", businessName: "Royal Events Decor", city: "Delhi",
    category: ["luxury","traditional","reception"], rating: 4.8, reviewCount: 110,
    images: ["https://images.unsplash.com/photo-1519170671100-7eb1354b59b5?auto=format&fit=crop&w=800&q=80"],
    description: "Luxury traditional decoration with premium lighting.",
    startingPrice: 150000, isVerified: true,
  },
];

// ---------- Vendors (marketplace) ----------
export const mockVendors: Vendor[] = [
  { id: "vd_001", businessName: "Eternal Moments Photography", category: "photographer", city: "Delhi", description: "Candid wedding photography.", images: [], rating: 4.9, reviewCount: 64, startingPrice: 35000, isVerified: true, portfolioImages: [], services: ["Wedding Photography","Pre-wedding Shoot"] },
  { id: "vd_002", businessName: "Swift Rides", category: "transportation", city: "Delhi", description: "Luxury wedding transportation.", images: [], rating: 4.5, reviewCount: 41, startingPrice: 15000, isVerified: true, portfolioImages: [], services: ["Luxury Cars","Bus Rentals"] },
  { id: "vd_003", businessName: "Glow Makeup Studio", category: "makeup_artist", city: "Delhi", description: "Bridal makeup artist.", images: [], rating: 4.7, reviewCount: 58, startingPrice: 20000, isVerified: true, portfolioImages: [], services: ["Bridal Makeup","Party Makeup"] },
];

// ---------- Invitations ----------
export const mockInvitationTemplates: InvitationTemplate[] = [
  { id: "tpl_001", name: "Royal Heritage", category: "traditional", previewImage: "https://images.unsplash.com/photo-1605028688220-18909157738e?auto=format&fit=crop&w=600&q=80", isFree: true, price: 0, config: {} },
  { id: "tpl_002", name: "Modern Minimal", category: "modern", previewImage: "https://images.unsplash.com/photo-1516634949303-20f0e03864dc?auto=format&fit=crop&w=600&q=80", isFree: true, price: 0, config: {} },
  { id: "tpl_003", name: "Floral Elegance", category: "floral", previewImage: "https://images.unsplash.com/photo-1590540624892-e1dd9f63a0e3?auto=format&fit=crop&w=600&q=80", isFree: false, price: 499, config: {} },
  { id: "tpl_004", name: "Golden Royal", category: "luxury", previewImage: "https://images.unsplash.com/photo-1516993937299-13e9e9dc640e?auto=format&fit=crop&w=600&q=80", isFree: false, price: 999, config: {} },
  { id: "tpl_005", name: "Animated Joy", category: "animated", previewImage: "https://images.unsplash.com/photo-1469313022239-659ba5a47bca?auto=format&fit=crop&w=600&q=80", isFree: false, price: 1499, config: {} },
];

export const mockInvitations: Invitation[] = [
  { id: "inv_001", familyId: "fam_001", eventId: "evt_001", name: "Aanya & Vihaan  Wedding Invitation", templateId: "tpl_001", templateName: "Royal Heritage", config: { brideName: "Aanya", groomName: "Vihaan", eventTitle: "Aanya & Vihaan", date: "2026-02-16", time: "10:00 AM", venue: "Grand Mandap Hall", address: "Connaught Place, New Delhi", message: "We cordially invite you to bless us on our special day.", themeColor: "#7A2338", font: "Playfair Display", textAlignment: "center", couplePhoto: "", backgroundImage: "" }, status: "published", recipientCount: 420, shareUrl: "/invite/inv_001_token", createdAt: "2025-11-05T00:00:00Z", updatedAt: "2025-11-05T00:00:00Z" },
];

// ---------- RSVP ----------
export const mockRsvpStats: RsvpStats = {
  totalInvited: 420, accepted: 298, declined: 38, pending: 70, maybe: 14, expectedAttendees: 342, adultCount: 302, childCount: 40,
};

// ---------- Quotations ----------
export const mockQuotationRequests: QuotationRequest[] = [
  { id: "qr_001", familyId: "fam_001", eventId: "evt_001", functionId: "fn_004", serviceCategory: "venue", vendorId: "vn_001", eventName: "Aanya & Vihaan Wedding", functionName: "Wedding", date: "2026-02-16", guestCount: 500, requirements: "Banquet hall with stage and bridal room", status: "quoted", createdAt: "2025-11-08T00:00:00Z" },
  { id: "qr_002", familyId: "fam_001", eventId: "evt_001", functionId: "fn_005", serviceCategory: "catering", vendorId: "ct_001", eventName: "Aanya & Vihaan Wedding", functionName: "Reception", date: "2026-02-16", guestCount: 600, requirements: "North Indian vegetarian and non-veg menu", status: "open", createdAt: "2025-11-09T00:00:00Z" },
];

export const mockQuotations: Quotation[] = [
  {
    id: "qt_001", requestId: "qr_001", familyId: "fam_001", vendorId: "vn_001", vendorName: "Royal Palace Banquet Hall",
    serviceCategory: "venue", packageName: "Full Day Venue Package", description: "Banquet hall rental for wedding day including stage and bridal room",
    lineItems: [
      { id: "li_1", description: "Venue rental (full day)", quantity: 1, unitPrice: 85000, amount: 85000 },
      { id: "li_2", description: "Stage setup", quantity: 1, unitPrice: 25000, amount: 25000 },
      { id: "li_3", description: "Bridal room", quantity: 1, unitPrice: 10000, amount: 10000 },
    ],
    subtotal: 120000, tax: 21600, discount: 0, total: 141600, validityDays: 7,
    terms: "Advance 50% to confirm booking. Cancellation 14 days prior.",
    status: "submitted", submittedAt: "2025-11-10T00:00:00Z",
  },
];

// ---------- Bookings ----------
export const mockBookings: Booking[] = [
  {
    id: "bk_001", bookingReference: "UTS-2025-0001", familyId: "fam_001", vendorId: "vn_001", vendorName: "Royal Palace Banquet Hall",
    eventId: "evt_001", functionId: "fn_004", serviceCategory: "venue", serviceName: "Royal Palace Banquet Hall  Wedding",
    date: "2026-02-16", startTime: "10:00", endTime: "13:00", guestCount: 500,
    quotedAmount: 141600, advancePaid: 70800, remainingAmount: 70800,
    status: "confirmed", paymentStatus: "partial", createdAt: "2025-11-12T00:00:00Z", updatedAt: "2025-11-13T00:00:00Z",
  },
  {
    id: "bk_002", bookingReference: "UTS-2025-0002", familyId: "fam_001", vendorId: "dc_001", vendorName: "Floral Dreams",
    eventId: "evt_001", functionId: "fn_003", serviceCategory: "decoration", serviceName: "Floral Dreams  Mehendi Decoration",
    date: "2026-02-15", startTime: "15:00", endTime: "19:00", guestCount: 180,
    quotedAmount: 90000, advancePaid: 45000, remainingAmount: 45000,
    status: "confirmed", paymentStatus: "partial", createdAt: "2025-11-10T00:00:00Z", updatedAt: "2025-11-11T00:00:00Z",
  },
];

// ---------- Payments ----------
export const mockPayments: Payment[] = [
  { id: "py_001", bookingId: "bk_001", bookingReference: "UTS-2025-0001", amount: 70800, status: "successful", method: "UPI", transactionId: "UPI251113001", invoiceUrl: "/invoices/inv_0001.pdf", createdAt: "2025-11-13T00:00:00Z" },
  { id: "py_002", bookingId: "bk_001", bookingReference: "UTS-2025-0001", amount: 70800, status: "pending", method: "Bank Transfer", createdAt: "2025-11-20T00:00:00Z" },
];

// ---------- Budget ----------
export const mockBudgetItems: BudgetItem[] = [
  { id: "bd_001", familyId: "fam_001", eventId: "evt_001", category: "venue", name: "Royal Palace Banquet Hall", estimatedAmount: 85000, actualAmount: 141600, paidAmount: 70800, vendor: "Royal Palace Banquet Hall", date: "2025-11-12", notes: "Venue + stage + bridal room" },
  { id: "bd_002", familyId: "fam_001", eventId: "evt_001", category: "decoration", name: "Floral Dreams Mehendi Decor", estimatedAmount: 90000, actualAmount: 90000, paidAmount: 45000, vendor: "Floral Dreams", date: "2025-11-10", notes: "Mehendi stage decoration" },
  { id: "bd_003", familyId: "fam_001", eventId: "evt_001", category: "catering", name: "Royal Spice Catering", estimatedAmount: 390000, actualAmount: 0, paidAmount: 0, vendor: "Royal Spice Caterers", date: "2025-11-09", notes: "Reception catering quote pending" },
  { id: "bd_004", familyId: "fam_001", category: "invitations", name: "Digital Invitations", estimatedAmount: 999, actualAmount: 999, paidAmount: 999, vendor: "UTSAV Templates", date: "2025-11-05", notes: "Premium template purchase" },
];

export const mockBudgetSummary: BudgetSummary = {
  totalEstimated: 1200000, totalActual: 232599, totalPaid: 116799, remainingBalance: 967401,
  byCategory: {
    venue: { estimated: 85000, actual: 141600 },
    catering: { estimated: 390000, actual: 0 },
    decoration: { estimated: 90000, actual: 90000 },
    photography: { estimated: 35000, actual: 0 },
    makeup: { estimated: 20000, actual: 0 },
    transportation: { estimated: 15000, actual: 0 },
    entertainment: { estimated: 25000, actual: 0 },
    invitations: { estimated: 999, actual: 999 },
    miscellaneous: { estimated: 50000, actual: 0 },
  },
};

// ---------- Notifications ----------
export const mockNotifications: Notification[] = [
  { id: "n_001", userId: "usr_101", type: "rsvp_update", title: "RSVP Received", message: "Mrs. Kamla Sharma accepted the wedding invitation.", read: false, createdAt: "2025-11-14T09:00:00Z" },
  { id: "n_002", userId: "usr_101", type: "quotation", title: "New Quotation", message: "Royal Palace Banquet Hall submitted a quotation.", read: false, createdAt: "2025-11-10T00:00:00Z" },
  { id: "n_003", userId: "usr_101", type: "booking_confirmed", title: "Booking Confirmed", message: "Your venue booking at Royal Palace Banquet Hall is confirmed.", read: true, createdAt: "2025-11-13T00:00:00Z" },
  { id: "n_004", userId: "usr_101", type: "payment", title: "Payment Received", message: "Advance payment of ?70,800 received.", read: true, createdAt: "2025-11-13T00:00:00Z" },
];

// ---------- Admin stats ----------
export const mockAdminStats: DashboardStats = {
  totalUsers: 12450, totalFamilies: 8900, totalVendors: 1420, pendingVerifications: 86,
  totalBookings: 3420, platformRevenue: 4250000, pendingDisputes: 4,
};

// ---------- Helpers ----------
function delay(ms = DELAY_MS) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export { delay };

