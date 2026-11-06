
export const APP_NAME = "UTSAV";
export const APP_TAGLINE = "Every Celebration, One Place.";
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "engagement", label: "Engagement" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "naming_ceremony", label: "Naming Ceremony" },
  { value: "housewarming", label: "Housewarming" },
  { value: "religious_function", label: "Religious Function" },
  { value: "other", label: "Other Celebration" },
];

export const FUNCTION_TYPES = [
  { value: "engagement", label: "Engagement" },
  { value: "haldi", label: "Haldi" },
  { value: "mehendi", label: "Mehendi" },
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "other", label: "Other" },
];

export const RSVP_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "maybe", label: "Maybe" },
];

export const VENUE_TYPES = [
  { value: "marriage_hall", label: "Marriage Hall" },
  { value: "banquet_hall", label: "Banquet Hall" },
  { value: "convention_centre", label: "Convention Centre" },
  { value: "garden", label: "Garden" },
  { value: "farmhouse", label: "Farmhouse" },
  { value: "community_hall", label: "Community Hall" },
  { value: "outdoor_venue", label: "Outdoor Venue" },
  { value: "resort", label: "Resort" },
  { value: "hotel_event_hall", label: "Hotel Event Hall" },
];

export const CUISINE_TYPES = [
  { value: "north_indian", label: "North Indian" },
  { value: "south_indian", label: "South Indian" },
  { value: "gujarati", label: "Gujarati" },
  { value: "rajasthani", label: "Rajasthani" },
  { value: "punjabi", label: "Punjabi" },
  { value: "bengali", label: "Bengali" },
  { value: "maharashtrian", label: "Maharashtrian" },
  { value: "mughlai", label: "Mughlai" },
  { value: "indo_chinese", label: "Indo-Chinese" },
  { value: "continental", label: "Continental" },
  { value: "other", label: "Other" },
];

export const CATERING_COMPONENTS = [
  { value: "food_materials", label: "Food Materials" },
  { value: "vessels", label: "Vessels" },
  { value: "cooking_labour", label: "Cooking Labour" },
  { value: "serving_staff", label: "Serving Staff" },
  { value: "transportation", label: "Transportation" },
  { value: "complete_catering", label: "Complete Catering" },
  { value: "customized_menu", label: "Customized Menu" },
];

export const DECORATION_CATEGORIES = [
  { value: "floral", label: "Floral Decoration" },
  { value: "stage", label: "Stage Decoration" },
  { value: "mandap", label: "Mandap Decoration" },
  { value: "haldi", label: "Haldi Decoration" },
  { value: "mehendi", label: "Mehendi Decoration" },
  { value: "reception", label: "Reception Decoration" },
  { value: "lighting", label: "Lighting" },
  { value: "balloon", label: "Balloon Decoration" },
  { value: "luxury", label: "Luxury Decoration" },
  { value: "traditional", label: "Traditional Decoration" },
];

export const VENDOR_CATEGORIES = [
  { value: "marriage_hall", label: "Marriage Hall" },
  { value: "banquet_hall", label: "Banquet Hall" },
  { value: "convention_centre", label: "Convention Centre" },
  { value: "garden", label: "Garden / Outdoor" },
  { value: "caterer", label: "Catering" },
  { value: "decorator", label: "Decoration" },
  { value: "event_management", label: "Event Management" },
  { value: "photographer", label: "Photography" },
  { value: "makeup_artist", label: "Makeup Artist" },
  { value: "transportation", label: "Transportation" },
  { value: "dj_entertainment", label: "DJ & Entertainment" },
  { value: "other", label: "Other" },
];

export const BOOKING_STATUSES = [
  { value: "request_submitted", label: "Request Submitted" },
  { value: "quotation_received", label: "Quotation Received" },
  { value: "negotiation", label: "Negotiation" },
  { value: "approved", label: "Approved" },
  { value: "advance_pending", label: "Advance Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const BUDGET_CATEGORIES = [
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "decoration", label: "Decoration" },
  { value: "photography", label: "Photography" },
  { value: "makeup", label: "Makeup" },
  { value: "transportation", label: "Transportation" },
  { value: "entertainment", label: "Entertainment" },
  { value: "invitations", label: "Invitations" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

export const INVITATION_CATEGORIES = [
  { value: "traditional", label: "Traditional" },
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "luxury", label: "Luxury" },
  { value: "floral", label: "Floral" },
  { value: "royal", label: "Royal" },
  { value: "animated", label: "Animated" },
  { value: "video", label: "Video Invitation" },
  { value: "engagement", label: "Engagement" },
  { value: "haldi", label: "Haldi" },
  { value: "mehendi", label: "Mehendi" },
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
];

export const FAMILY_MEMBER_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "administrator", label: "Administrator" },
  { value: "event_coordinator", label: "Event Coordinator" },
  { value: "viewer", label: "Viewer" },
];

export const ROUTES = {
  public: { home: "/", about: "/about", services: "/services", venues: "/venues", venueDetail: (id:string)=>`/venues/${id}`, vendors: "/vendors", vendorDetail: (id:string)=>`/vendors/${id}`, invitations: "/invitations", howItWorks: "/how-it-works", contact: "/contact" },
  auth: { login: "/login", register: "/register", forgotPassword: "/forgot-password", resetPassword: "/reset-password", verifyOTP: "/verify-otp", onboarding: "/onboarding" },
  family: { dashboard: "/family/dashboard", events: "/family/events", createEvent: "/family/events/new", eventDetail: (id:string)=>`/family/events/${id}`, functions: (id:string)=>`/family/events/${id}/functions`, invitations: "/family/invitations", editor: (id:string)=>`/family/invitations/editor/${id}`, guests: "/family/guests", rsvp: "/family/rsvp", venues: "/family/venues", catering: "/family/catering", decoration: "/family/decoration", eventManagement: "/family/event-management", vendors: "/family/vendors", quotations: "/family/quotations", bookings: "/family/bookings", payments: "/family/payments", budget: "/family/budget", notifications: "/family/notifications", members: "/family/members", settings: "/family/settings" },
  vendor: { dashboard: "/vendor/dashboard", profile: "/vendor/profile", services: "/vendor/services", packages: "/vendor/packages", portfolio: "/vendor/portfolio", availability: "/vendor/availability", quotationRequests: "/vendor/quotation-requests", quotations: "/vendor/quotations", bookings: "/vendor/bookings", payments: "/vendor/payments", reviews: "/vendor/reviews", analytics: "/vendor/analytics", settings: "/vendor/settings" },
  admin: { dashboard: "/admin/dashboard", users: "/admin/users", families: "/admin/families", vendors: "/admin/vendors", vendorVerification: "/admin/vendor-verification", categories: "/admin/categories", venues: "/admin/venues", templates: "/admin/templates", bookings: "/admin/bookings", payments: "/admin/payments", commissions: "/admin/commissions", reviews: "/admin/reviews", reports: "/admin/reports", auditLogs: "/admin/audit-logs", settings: "/admin/settings" },
  guest: { invitation: (token:string)=>`/invite/${token}`, rsvp: (token:string)=>`/invite/${token}/rsvp` },
} as const;

