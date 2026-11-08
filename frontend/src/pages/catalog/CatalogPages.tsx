import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Icon } from '../../layouts/WorkspaceLayout';
import { formatDate, guests, vendors } from '../../data/workspaceData';
import { authApi } from '../../features/auth/api/authApi';
import { adminApi } from '../../features/admin/api/adminApi';
import { cateringApi } from '../../features/catering/api/cateringApi';
import { eventsApi } from '../../features/events/api/eventsApi';
import { guestsApi } from '../../features/guests/api/guestsApi';
import { invitationsApi } from '../../features/invitations/api/invitationsApi';
import { paymentsApi } from '../../features/payments/api/paymentsApi';
import { quotationsApi } from '../../features/quotations/api/quotationsApi';
import { venuesApi } from '../../features/venues/api/venuesApi';
import type { Quotation } from '../../types/quotation.types';
import { useAuth } from '../../hooks/useAuth';
import { usePersistentState } from '../../hooks/usePersistentState';

type CatalogItem = {
  name: string;
  detail: string;
  date: string;
  status: string;
  entityId?: string;
  quotation?: Quotation;
};

type PageSpec = {
  path: string;
  title: string;
  eyebrow: string;
  description: string;
  section: 'family' | 'vendor' | 'admin' | 'public' | 'auth' | 'guest';
  action: string;
  mode?: 'table' | 'form' | 'landing' | 'editor' | 'profile' | 'auth' | 'confirmation';
  fields?: string[];
  categories?: string[];
  stats?: { label: string; value: string; foot: string }[];
  items?: CatalogItem[];
};

const specs: PageSpec[] = [
  { path: '/home', title: 'Gather around what matters.', eyebrow: 'A LITTLE MORE JOY IN THE PLANNING', description: 'Thoughtful tools, trusted people, and all the room you need to make your celebration feel like you.', section: 'public', action: 'Start planning', mode: 'landing' },
  { path: '/about', title: 'Every celebration has a story.', eyebrow: 'A LITTLE ABOUT UTSAV', description: 'We bring the people, places, and plans behind your meaningful moments together.', section: 'public', action: 'Meet our community', mode: 'landing' },
  { path: '/services', title: 'Everything for the day you imagine.', eyebrow: 'OUR SERVICES', description: 'Bring the moving pieces together, from the first guest list to the last dance.', section: 'public', action: 'Explore the workspace', mode: 'landing' },
  { path: '/how-it-works', title: 'A thoughtful plan, one step at a time.', eyebrow: 'HOW UTSAV WORKS', description: 'Start with your event. Add your people. Then watch the details find their place.', section: 'public', action: 'Create your event', mode: 'landing' },
  { path: '/contact', title: 'We’re here when you need us.', eyebrow: 'A REAL PERSON, JUST A MESSAGE AWAY', description: 'Tell us how we can make planning a little easier. Our celebration team would love to hear from you.', section: 'public', action: 'Send your message', mode: 'form', fields: ['Your name', 'Email address', 'What can we help with?'] },
  { path: '/explore/venues', title: 'Find a place to gather.', eyebrow: 'SPACES WITH A STORY TO TELL', description: 'Explore welcoming places for the moments you want to remember.', section: 'public', action: 'Enquire about this venue', mode: 'landing' },
  { path: '/explore/invitations', title: 'A lovely way to say, “be there.”', eyebrow: 'INVITATIONS, MADE PERSONAL', description: 'Find a design that feels like you, then share a little joy with your favourite people.', section: 'public', action: 'Choose an invitation', mode: 'landing' },

  { path: '/login', title: 'Welcome back to your people.', eyebrow: 'YOUR CELEBRATION IS RIGHT WHERE YOU LEFT IT', description: 'Sign in to pick up where the lovely details left off.', section: 'auth', action: 'Sign in', mode: 'auth', fields: ['Email address', 'Password'] },
  { path: '/register', title: 'Let’s make room for a celebration.', eyebrow: 'A LITTLE JOY STARTS HERE', description: 'Create your free account and bring your family’s plans together.', section: 'auth', action: 'Create my account', mode: 'auth', fields: ['Your name', 'Email address', 'Phone number', 'Create a password'] },
  { path: '/verify-otp', title: 'One quick check, then you’re in.', eyebrow: 'A LITTLE SECURITY FOR YOUR SPACE', description: 'Enter the six-digit code we sent to your phone or email.', section: 'auth', action: 'Verify my code', mode: 'auth', fields: ['Verification code'] },
  { path: '/forgot-password', title: 'A fresh start is one email away.', eyebrow: 'IT HAPPENS TO THE BEST OF US', description: 'Share your email and we’ll send a secure link to help you back in.', section: 'auth', action: 'Send me a reset link', mode: 'auth', fields: ['Email address'] },
  { path: '/reset-password', title: 'Choose a password that feels safe.', eyebrow: 'ALMOST BACK IN YOUR SPACE', description: 'Enter the reset code from your email and choose a new password.', section: 'auth', action: 'Save my new password', mode: 'auth', fields: ['Email address', 'Verification code', 'New password', 'Confirm new password'] },
  { path: '/onboarding', title: 'Let’s start with the good stuff.', eyebrow: 'YOUR SPACE, YOUR CELEBRATION', description: 'Tell us a little about your family and what you’re planning.', section: 'auth', action: 'Set up my workspace', mode: 'auth', fields: ['Family or workspace name', 'Your role', 'Celebration type', 'Celebration city'] },

  { path: '/events/create', title: 'A new beginning.', eyebrow: 'LET’S MAKE SOMETHING TO CELEBRATE', description: 'Start with the basics. You can add all the lovely details later.', section: 'family', action: 'Create event', mode: 'form', fields: ['Event name', 'Celebration type', 'Date', 'City or venue'] },
  { path: '/events/:eventId', title: 'Every detail, in its place.', eyebrow: 'YOUR CELEBRATION', description: 'Bring together the people, plans, and happy little details for this event.', section: 'family', action: 'Save event details', mode: 'form', fields: ['Event name', 'Celebration type', 'Date', 'Location', 'Guest count', 'Planning budget'] },
  { path: '/functions/:functionId', title: 'Plan each part of the day.', eyebrow: 'A MOMENT WITHIN YOUR CELEBRATION', description: 'Give each function its own time, place, guest list, and feeling.', section: 'family', action: 'Save function', mode: 'form', fields: ['Function name', 'Date and time', 'Venue', 'Guest count', 'Notes for the day'] },
  { path: '/guest-groups', title: 'Your people, in their own circles.', eyebrow: 'A PLACE FOR EVERY GROUP', description: 'Organise guests by family, friends, and the people who belong together.', section: 'family', action: 'Create guest group', mode: 'form', fields: ['Group name', 'Who is this group for?'] },
  { path: '/invitation-editor', title: 'Make this invitation yours.', eyebrow: 'A NOTE FROM THE HEART', description: 'Choose your words, adjust the details, and make something worth keeping.', section: 'family', action: 'Save invitation', mode: 'editor', fields: ['Names on the invitation', 'Invitation message', 'Date and time', 'Venue'] },
  { path: '/rsvp', title: 'A little reply makes a big difference.', eyebrow: 'YOUR RSVP OVERVIEW', description: 'See who is joining and send a kind reminder to the people still deciding.', section: 'family', action: 'Send a gentle reminder', mode: 'table' },
  { path: '/catering', title: 'A table made for everyone.', eyebrow: 'CATERING & MENUS', description: 'Find thoughtful menus, compare serving styles, and plan for every guest.', section: 'family', action: 'Ask about catering', mode: 'table', categories: ['All menus', 'Vegetarian', 'Regional', 'Desserts'] },
  { path: '/decoration', title: 'Set the scene for your story.', eyebrow: 'DECOR & FLOWERS', description: 'Explore colours, flowers, and thoughtful details to make the space feel like yours.', section: 'family', action: 'Save this inspiration', mode: 'table', categories: ['All styles', 'Floral', 'Traditional', 'Minimal'] },
  { path: '/event-management', title: 'A steady hand behind the scenes.', eyebrow: 'PLANNERS & COORDINATORS', description: 'Meet experienced planners who can help the day unfold just as you imagined.', section: 'family', action: 'Ask about availability', mode: 'table', categories: ['All planners', 'Full planning', 'Day-of coordination'] },
  { path: '/other-services', title: 'All those lovely finishing touches.', eyebrow: 'MORE WAYS TO MAKE IT YOURS', description: 'Find entertainment, transport, beauty, and everything else your day needs.', section: 'family', action: 'Ask for a quotation', mode: 'table', categories: ['All services', 'Music & entertainment', 'Makeup', 'Transport'] },
  { path: '/quotations', title: 'A clear view of your options.', eyebrow: 'QUOTATIONS FROM YOUR SHORTLIST', description: 'Compare thoughtful proposals and keep every conversation close at hand.', section: 'family', action: 'Request another quote', mode: 'table' },
  { path: '/quotations/:quoteId', title: 'The details behind the quote.', eyebrow: 'YOUR VENDOR PROPOSAL', description: 'Review the inclusions, pricing, and next steps before making a decision.', section: 'family', action: 'Accept this quotation', mode: 'form', fields: ['Vendor', 'Service and inclusions', 'Estimated total', 'Valid until', 'Notes'] },
  { path: '/bookings/:bookingId', title: 'A booking worth feeling good about.', eyebrow: 'YOUR BOOKING DETAILS', description: 'Keep the agreed services, payments, and contact details together.', section: 'family', action: 'Save booking notes', mode: 'form', fields: ['Booking reference', 'Vendor name', 'Event date', 'Agreed total', 'Payment due date'] },
  { path: '/payments', title: 'Every payment, accounted for.', eyebrow: 'PAYMENT HISTORY', description: 'See what has been paid, what is coming up, and where each receipt lives.', section: 'family', action: 'Record a payment', mode: 'table' },
  { path: '/payments/:paymentId', title: 'A closer look at this payment.', eyebrow: 'PAYMENT & RECEIPT', description: 'Review the amount, method, and receipt for this transaction.', section: 'family', action: 'Download receipt', mode: 'form', fields: ['Payment reference', 'Vendor', 'Amount paid', 'Payment date', 'Payment method'] },
  { path: '/members', title: 'Good plans are better together.', eyebrow: 'YOUR FAMILY WORKSPACE', description: 'Invite the people who should help plan and keep everyone in the loop.', section: 'family', action: 'Invite a family member', mode: 'table' },
  { path: '/notifications', title: 'A few notes for your day.', eyebrow: 'UPDATES FROM YOUR CELEBRATION', description: 'RSVPs, vendor replies, and reminders, all gathered in one place.', section: 'family', action: 'Mark all as read', mode: 'table' },
  { path: '/family-settings', title: 'Make this workspace feel like home.', eyebrow: 'YOUR FAMILY PREFERENCES', description: 'Keep your family details and communication preferences up to date.', section: 'family', action: 'Save family details', mode: 'form', fields: ['Family name', 'Primary contact', 'Preferred language', 'Celebration city'] },

  { path: '/vendor/profile', title: 'The first hello matters.', eyebrow: 'YOUR PUBLIC PROFILE', description: 'Help families get to know your work, your story, and what makes your service special.', section: 'vendor', action: 'Save profile', mode: 'profile', fields: ['Business name', 'Short introduction', 'Location', 'Starting price', 'Contact email'] },
  { path: '/vendor/services', title: 'Show families what you do best.', eyebrow: 'YOUR SERVICES', description: 'Describe your services clearly so the right families can find you.', section: 'vendor', action: 'Add a service', mode: 'table' },
  { path: '/vendor/packages', title: 'A package for every kind of day.', eyebrow: 'SERVICES & PACKAGES', description: 'Create clear packages with thoughtful inclusions and transparent pricing.', section: 'vendor', action: 'Create a package', mode: 'form', fields: ['Package name', 'What’s included?', 'Starting price', 'Guest or hour limit'] },
  { path: '/vendor/portfolio', title: 'Let your work speak for itself.', eyebrow: 'YOUR PORTFOLIO', description: 'Build a gallery of the real moments and details you love creating.', section: 'vendor', action: 'Add portfolio item', mode: 'table' },
  { path: '/vendor/availability', title: 'The dates you can make magical.', eyebrow: 'YOUR AVAILABILITY', description: 'Keep your calendar honest so families can plan with confidence.', section: 'vendor', action: 'Save availability', mode: 'form', fields: ['Select a date', 'Availability', 'Notes for this date'] },
  { path: '/vendor/quotation-requests', title: 'A few families are looking for you.', eyebrow: 'NEW ENQUIRIES', description: 'Review event details and send a thoughtful response to each family.', section: 'vendor', action: 'Send a reply', mode: 'table' },
  { path: '/vendor/quotations', title: 'Your proposals, all together.', eyebrow: 'QUOTATIONS YOU’VE SENT', description: 'Track proposals, revisions, and the families waiting to hear from you.', section: 'vendor', action: 'Create a quotation', mode: 'table' },
  { path: '/vendor/bookings', title: 'Dates worth looking forward to.', eyebrow: 'YOUR CONFIRMED BOOKINGS', description: 'Keep upcoming celebrations and the promises you made easy to find.', section: 'vendor', action: 'Add a booking', mode: 'table' },
  { path: '/vendor/payments', title: 'Your earnings, made clear.', eyebrow: 'PAYMENTS & PAYOUTS', description: 'Track deposits, balances, and payouts connected to your bookings.', section: 'vendor', action: 'Download statement', mode: 'table' },
  { path: '/vendor/reviews', title: 'Kind words from the families you helped.', eyebrow: 'YOUR REVIEWS', description: 'Read thoughtful feedback and respond to the people who trusted your work.', section: 'vendor', action: 'Respond to a review', mode: 'table' },
  { path: '/vendor/analytics', title: 'A little insight goes a long way.', eyebrow: 'YOUR BUSINESS AT A GLANCE', description: 'See how families find your profile and what is turning interest into enquiries.', section: 'vendor', action: 'Download report', mode: 'table' },
  { path: '/vendor/settings', title: 'Your business, your preferences.', eyebrow: 'STUDIO SETTINGS', description: 'Manage your contact details, notifications, and account preferences.', section: 'vendor', action: 'Save settings', mode: 'form', fields: ['Business email', 'Phone number', 'Payout account', 'Notification preference'] },

  { path: '/admin/users', title: 'People who make the community.', eyebrow: 'COMMUNITY DIRECTORY', description: 'Review member accounts and help keep the Utsav community welcoming.', section: 'admin', action: 'Invite a member', mode: 'table', categories: ['Everyone', 'Families', 'Vendors', 'Needs attention'] },
  { path: '/admin/families', title: 'Families planning their next big moment.', eyebrow: 'FAMILY WORKSPACES', description: 'Find family accounts and help with workspace questions.', section: 'admin', action: 'Add family workspace', mode: 'table' },
  { path: '/admin/vendors', title: 'The people behind every lovely detail.', eyebrow: 'VENDOR DIRECTORY', description: 'Review vendor profiles, verification, and marketplace activity.', section: 'admin', action: 'Add a vendor', mode: 'table', categories: ['All vendors', 'Verified', 'Needs review', 'Paused'] },
  { path: '/admin/vendor-verification', title: 'A little care builds a lot of trust.', eyebrow: 'VENDOR VERIFICATION', description: 'Review business details and portfolios before vendors meet families.', section: 'admin', action: 'Review application', mode: 'table', categories: ['Needs review', 'Verified', 'Needs changes'] },
  { path: '/admin/categories', title: 'Help families find the right kind of help.', eyebrow: 'SERVICE CATEGORIES', description: 'Keep marketplace categories useful, clear, and easy to browse.', section: 'admin', action: 'Create a category', mode: 'table' },
  { path: '/admin/venues', title: 'Places families can gather.', eyebrow: 'VENUE DIRECTORY', description: 'Review venue details, coverage, and marketplace visibility.', section: 'admin', action: 'Add a venue', mode: 'form', fields: ['Venue name', 'City', 'Guest capacity', 'Price per day', 'Amenities (comma separated)', 'Image URL'] },
  { path: '/admin/templates', title: 'Invitations worth sharing.', eyebrow: 'TEMPLATE LIBRARY', description: 'Review invitation designs and keep the collection thoughtful.', section: 'admin', action: 'Add a template', mode: 'form', fields: ['Design name', 'Category', 'Price', 'Preview image URL'], categories: ['All designs', 'Pending approval', 'Published'] },
  { path: '/admin/bookings', title: 'A clear view of every commitment.', eyebrow: 'MARKETPLACE BOOKINGS', description: 'Monitor bookings, dates, and vendor-family commitments.', section: 'admin', action: 'Export bookings', mode: 'table' },
  { path: '/admin/payments', title: 'Payments with nothing hidden.', eyebrow: 'PLATFORM TRANSACTIONS', description: 'Review transactions and resolve payment questions with care.', section: 'admin', action: 'Export transactions', mode: 'table' },
  { path: '/admin/commissions', title: 'A fair and transparent marketplace.', eyebrow: 'PLATFORM COMMISSIONS', description: 'Review commission rules and the revenue they generate.', section: 'admin', action: 'Update commission rate', mode: 'form', fields: ['Service category', 'Commission percentage', 'Effective date'] },
  { path: '/admin/reviews', title: 'Honest feedback keeps everyone better.', eyebrow: 'REVIEWS & MODERATION', description: 'Help feedback stay kind, relevant, and useful to the community.', section: 'admin', action: 'Review flagged feedback', mode: 'table' },
  { path: '/admin/reports', title: 'The bigger picture, thoughtfully told.', eyebrow: 'PLATFORM REPORTS', description: 'Understand activity across celebrations, vendors, and bookings.', section: 'admin', action: 'Export report', mode: 'table' },
  { path: '/admin/audit-logs', title: 'A careful record of changes.', eyebrow: 'ADMIN AUDIT LOG', description: 'Review important workspace actions and account changes.', section: 'admin', action: 'Export audit log', mode: 'table' },
  { path: '/admin/settings', title: 'The details behind the experience.', eyebrow: 'PLATFORM SETTINGS', description: 'Manage platform-wide preferences and admin access.', section: 'admin', action: 'Save platform settings', mode: 'form', fields: ['Platform name', 'Support email', 'Default commission', 'Maintenance notice'] },

  { path: '/rsvp-confirmation', title: 'Your reply has found its way home.', eyebrow: 'THANK YOU FOR BEING PART OF IT', description: 'The family has been sent your RSVP. We hope your day is full of lovely moments.', section: 'guest', action: 'Back to invitation', mode: 'confirmation' },
  { path: '/not-found', title: 'This page wandered off for a moment.', eyebrow: 'NOTHING TO WORRY ABOUT', description: 'The link may have changed, but your celebration plans are safe.', section: 'public', action: 'Back to your workspace', mode: 'confirmation' },
];

const titlesByPath = new Map(specs.map((spec) => [spec.path, spec]));

function findSpec(pathname: string): PageSpec {
  const exact = titlesByPath.get(pathname);
  if (exact) return exact;
  const familyDetail = specs.find((spec) => spec.path.includes(':') && new RegExp(`^${spec.path.replace(/:[^/]+/g, '[^/]+')}$`).test(pathname));
  if (familyDetail) return familyDetail;
  if (pathname.startsWith('/invite/')) return {
    path: '/invite/:token', title: 'You’re invited to something lovely.', eyebrow: 'A PERSONAL INVITATION', description: 'The details for your family celebration are waiting for you.', section: 'guest', action: 'Send your RSVP', mode: 'confirmation',
  };
  return {
    path: '/not-found', title: 'This page wandered off for a moment.', eyebrow: 'NOTHING TO WORRY ABOUT', description: 'The link may have changed, but your celebration plans are safe.', section: 'public', action: 'Back to your workspace', mode: 'confirmation',
  };
}

const itemSeeds: Record<string, CatalogItem[]> = {
  '/events/create': [
    { name: 'Aarav & Meera’s Wedding', detail: 'Wedding celebration · Jaipur', date: '18 Dec 2026', status: 'Planning' },
    { name: 'Diya’s Mehendi', detail: 'Mehendi · Jaipur', date: '16 Dec 2026', status: 'Confirmed' },
  ],
  '/events/:eventId': [
    { name: 'Aarav & Meera’s Wedding', detail: 'Jaipur, Rajasthan · 250 guests · ₹18,50,000 budget', date: '18 Dec 2026', status: 'Planning' },
    { name: 'Diya’s Mehendi', detail: 'Jaipur, Rajasthan · 120 guests · ₹4,25,000 budget', date: '16 Dec 2026', status: 'Confirmed' },
  ],
  '/functions/:functionId': [
    { name: 'Welcome dinner', detail: 'The Marigold House · 180 guests', date: '17 Dec 2026 · 7:00 pm', status: 'Confirmed' },
    { name: 'Wedding ceremony', detail: 'Courtyard lawn · 250 guests', date: '18 Dec 2026 · 10:30 am', status: 'Planning' },
  ],
  '/guest-groups': [
    { name: 'Bride’s family', detail: 'Family group · 42 guests', date: '18 Dec 2026', status: 'Confirmed' },
    { name: 'College friends', detail: 'Friends group · 18 guests', date: '18 Dec 2026', status: 'Planning' },
  ],
  '/invitation-editor': [
    { name: 'Aarav & Meera — Wedding', detail: 'Floral • English • Digital invitation', date: '18 Dec 2026', status: 'Draft' },
    { name: 'Diya — Mehendi', detail: 'Festive • Hindi • Digital invitation', date: '16 Dec 2026', status: 'Published' },
  ],
  '/rsvp': [
    { name: 'Ananya Sharma', detail: 'Bride’s family · ananya.s@email.com', date: '18 Dec 2026', status: 'Confirmed' },
    { name: 'Kavya Iyer', detail: 'Friends · kavya.iyer@email.com', date: '18 Dec 2026', status: 'Pending' },
    { name: 'Ishaan Verma', detail: 'Colleagues · ishaan.v@email.com', date: '18 Dec 2026', status: 'Declined' },
  ],
  '/catering': [
    { name: 'Royal vegetarian feast', detail: 'Saffron & Sage Catering · ₹1,200 per plate', date: 'Jaipur', status: 'Menu available' },
    { name: 'Rajasthani celebration menu', detail: 'Pink City Kitchens · ₹1,450 per plate', date: 'Jaipur', status: 'Menu available' },
  ],
  '/decoration': [
    { name: 'Marigold garden mandap', detail: 'Floral · Marigold, jasmine, fresh foliage', date: 'Ceremony', status: 'Available' },
    { name: 'Candlelit courtyard', detail: 'Minimal · Warm lights and brass accents', date: 'Reception', status: 'Available' },
  ],
  '/event-management': [
    { name: 'Aditi Mehra Events', detail: 'Full planning · Weddings and family celebrations', date: 'Jaipur', status: 'Available' },
    { name: 'The Celebration Edit', detail: 'Day-of coordination · On-site team of 5', date: 'Udaipur', status: 'Available' },
  ],
  '/other-services': [
    { name: 'Sur Sangeet Collective', detail: 'Music & entertainment · Live folk and DJ', date: 'Jaipur', status: 'Available' },
    { name: 'Rang by Rhea', detail: 'Makeup & styling · Bridal and family packages', date: 'Jaipur', status: 'Available' },
    { name: 'Royal Route Coaches', detail: 'Guest transport · 25- and 40-seat vehicles', date: 'Rajasthan', status: 'Available' },
  ],
  '/quotations': [
    { name: 'The Marigold House', detail: 'Venue package · ₹3,20,000', date: 'Valid until 20 Nov 2026', status: 'sent' },
    { name: 'House of Petals', detail: 'Mehendi decor · ₹92,000', date: 'Valid until 25 Nov 2026', status: 'draft' },
  ],
  '/quotations/:quoteId': [
    { name: 'The Marigold House', detail: 'Venue hire, furniture, and event-day staffing · ₹3,20,000', date: 'Valid until 20 Nov 2026', status: 'sent' },
  ],
  '/bookings/:bookingId': [
    { name: 'The Marigold House', detail: 'Wedding venue · Deposit paid ₹80,000 of ₹3,20,000', date: '18 Dec 2026', status: 'Confirmed' },
  ],
  '/payments': [
    { name: 'The Marigold House', detail: 'Venue booking · Deposit · ₹80,000', date: '4 Nov 2026', status: 'Paid' },
    { name: 'House of Petals', detail: 'Mehendi decor · First instalment · ₹30,000', date: '2 Nov 2026', status: 'Paid' },
    { name: 'Golden Hour Studio', detail: 'Photography · Booking deposit · ₹20,000', date: 'Due 15 Nov', status: 'Due soon' },
  ],
  '/payments/:paymentId': [
    { name: 'INV-2026-0418', detail: 'The Marigold House · Venue deposit · ₹80,000', date: '4 Nov 2026', status: 'Paid' },
  ],
  '/members': [
    { name: 'Meera Sharma', detail: 'Workspace owner · meera@email.com', date: 'Joined 2 Nov 2026', status: 'Active' },
    { name: 'Aarav Sharma', detail: 'Co-planner · aarav@email.com', date: 'Joined 3 Nov 2026', status: 'Active' },
  ],
  '/notifications': [
    { name: 'Kavya Iyer replied to your invitation', detail: 'RSVP · Aarav & Meera’s Wedding', date: 'Today, 9:42 am', status: 'New' },
    { name: 'The Marigold House sent a quotation', detail: 'Vendor update · Venue booking', date: 'Yesterday', status: 'New' },
  ],
  '/family-settings': [
    { name: 'Sharma family workspace', detail: 'Primary contact · Meera Sharma', date: 'Jaipur, Rajasthan', status: 'Saved' },
  ],
  '/vendor/profile': [
    { name: 'The Marigold House', detail: 'Wedding venue · Jaipur, Rajasthan', date: 'Updated 5 Nov 2026', status: 'Published' },
  ],
  '/vendor/services': [
    { name: 'Wedding venue rental', detail: 'Indoor and garden spaces · Up to 300 guests', date: 'From ₹2,40,000', status: 'Active' },
    { name: 'Event-day coordination', detail: 'Dedicated venue coordinator · 10 hours', date: 'From ₹18,000', status: 'Active' },
  ],
  '/vendor/packages': [
    { name: 'Garden wedding package', detail: 'Venue, seating, and event-day coordinator', date: 'From ₹2,40,000', status: 'Published' },
    { name: 'Intimate celebration', detail: 'Courtyard venue and dining for up to 100 guests', date: 'From ₹1,10,000', status: 'Draft' },
  ],
  '/vendor/portfolio': [
    { name: 'A winter wedding in Jaipur', detail: 'Garden ceremony · 240 guests · 18 photos', date: 'Added 5 Nov 2026', status: 'Published' },
    { name: 'An intimate courtyard mehendi', detail: 'Floral installation · 90 guests · 12 photos', date: 'Added 29 Oct 2026', status: 'Published' },
  ],
  '/vendor/availability': [
    { name: '18 December 2026', detail: 'Wedding celebration · Jaipur', date: 'Full day', status: 'Available' },
    { name: '20 December 2026', detail: 'Private event hold', date: 'Until 12 Nov', status: 'On hold' },
  ],
  '/vendor/quotation-requests': [
    { name: 'Meera Sharma', detail: 'Wedding venue · Jaipur · 250 guests', date: '18 Dec 2026', status: 'New request' },
    { name: 'Ritika Jain', detail: 'Venue & catering · Udaipur · 120 guests', date: '22 Dec 2026', status: 'New request' },
  ],
  '/vendor/quotations': [
    { name: 'Aarav & Meera — Wedding venue', detail: 'Venue hire and event-day staffing · ₹3,20,000', date: 'Valid until 20 Nov 2026', status: 'sent' },
    { name: 'Ritika Jain — Engagement', detail: 'Courtyard venue package · ₹1,45,000', date: 'Valid until 22 Nov 2026', status: 'draft' },
  ],
  '/vendor/bookings': [
    { name: 'Aarav & Meera’s Wedding', detail: 'Venue booking · Jaipur · 250 guests', date: '18 Dec 2026', status: 'Confirmed' },
    { name: 'Diya’s Mehendi', detail: 'Courtyard booking · Jaipur · 120 guests', date: '16 Dec 2026', status: 'Confirmed' },
  ],
  '/vendor/payments': [
    { name: 'Aarav & Meera — Deposit', detail: 'Venue booking · ₹80,000 received', date: '4 Nov 2026', status: 'Paid' },
    { name: 'Diya — Final balance', detail: 'Courtyard booking · ₹45,000 outstanding', date: 'Due 10 Dec 2026', status: 'Due soon' },
  ],
  '/vendor/reviews': [
    { name: 'Ananya & Karan', detail: '“The team made the whole evening feel effortless.”', date: '2 Nov 2026', status: '5.0 ★' },
    { name: 'Neha Sharma', detail: '“Beautiful details and such thoughtful service.”', date: '28 Oct 2026', status: '5.0 ★' },
  ],
  '/vendor/analytics': [
    { name: 'Profile visits', detail: 'Families who viewed your public profile', date: 'This month', status: '248 visits' },
    { name: 'New enquiries', detail: 'Families who requested availability or pricing', date: 'This month', status: '18 enquiries' },
    { name: 'Enquiry conversion', detail: 'Profile views that became enquiries', date: 'This month', status: '7.3%' },
  ],
  '/vendor/settings': [
    { name: 'Business contact', detail: 'hello@marigoldhouse.in · +91 98765 43210', date: 'Jaipur, Rajasthan', status: 'Verified' },
    { name: 'Payout preference', detail: 'Monthly bank transfer · Account ending 4821', date: 'Updated 1 Nov 2026', status: 'Active' },
  ],
  '/admin/users': [
    { name: 'Meera Sharma', detail: 'Family · meera@email.com', date: 'Joined 2 Nov 2026', status: 'Active' },
    { name: 'The Marigold House', detail: 'Vendor · hello@marigoldhouse.in', date: 'Joined 1 Nov 2026', status: 'Active' },
  ],
  '/admin/families': [
    { name: 'Sharma family workspace', detail: 'Jaipur · 3 members · 2 celebrations', date: 'Created 2 Nov 2026', status: 'Active' },
    { name: 'Jain family workspace', detail: 'Udaipur · 4 members · 1 celebration', date: 'Created 30 Oct 2026', status: 'Active' },
  ],
  '/admin/vendors': [
    { name: 'The Marigold House', detail: 'Wedding venue · Jaipur', date: 'Applied 1 Nov 2026', status: 'Verified' },
    { name: 'Saffron & Sage Catering', detail: 'Catering · Jaipur', date: 'Applied 5 Nov 2026', status: 'Needs review' },
  ],
  '/admin/vendor-verification': [
    { name: 'Saffron & Sage Catering', detail: 'Catering · Jaipur · Documents submitted', date: 'Submitted 5 Nov 2026', status: 'Needs review' },
    { name: 'Golden Hour Studio', detail: 'Photography · Jaipur · Portfolio review', date: 'Submitted 3 Nov 2026', status: 'Needs review' },
  ],
  '/admin/categories': [
    { name: 'Venues', detail: 'Marketplace category · 42 active vendors', date: 'Updated 4 Nov 2026', status: 'Active' },
    { name: 'Catering', detail: 'Marketplace category · 28 active vendors', date: 'Updated 2 Nov 2026', status: 'Active' },
  ],
  '/admin/venues': [
    { name: 'The Marigold House', detail: 'Jaipur · capacity 300 guests', date: '₹2,40,000 / day', status: 'Active' },
    { name: 'The Courtyard Palace', detail: 'Udaipur · capacity 220 guests', date: '₹3,10,000 / day', status: 'Active' },
  ],
  '/admin/templates': [
    { name: 'Marigold Garden', detail: 'Floral · Digital invitation', date: 'Free', status: 'Published' },
    { name: 'Jaipur Evening', detail: 'Traditional · Digital invitation', date: '₹499', status: 'Published' },
  ],
  '/admin/bookings': [
    { name: 'Aarav & Meera — The Marigold House', detail: 'Venue booking · Jaipur · 250 guests', date: '18 Dec 2026', status: 'Confirmed' },
    { name: 'Diya — Saffron & Sage Catering', detail: 'Catering · Jaipur · 120 guests', date: '16 Dec 2026', status: 'Confirmed' },
  ],
  '/admin/payments': [
    { name: 'TXN-2026-0418', detail: 'Venue deposit · ₹80,000 · The Marigold House', date: '4 Nov 2026', status: 'Paid' },
    { name: 'TXN-2026-0417', detail: 'Catering deposit · ₹42,000 · Saffron & Sage', date: '3 Nov 2026', status: 'Paid' },
  ],
  '/admin/commissions': [
    { name: 'Wedding venues', detail: 'Commission rate · 8%', date: 'Effective 1 Nov 2026', status: 'Active' },
    { name: 'Catering', detail: 'Commission rate · 6%', date: 'Effective 1 Nov 2026', status: 'Active' },
  ],
  '/admin/reviews': [
    { name: 'Review flagged for moderation', detail: 'The Marigold House · Reported as irrelevant', date: '5 Nov 2026', status: 'Needs review' },
    { name: 'New vendor feedback', detail: 'Saffron & Sage Catering · 4.8 stars', date: '3 Nov 2026', status: 'Published' },
  ],
  '/admin/reports': [
    { name: 'Celebration activity', detail: 'New workspaces, events, and guest responses', date: 'November 2026', status: 'Ready' },
    { name: 'Marketplace performance', detail: 'Vendor enquiries, bookings, and conversion', date: 'November 2026', status: 'Ready' },
  ],
  '/admin/audit-logs': [
    { name: 'Vendor verification updated', detail: 'Admin account · The Marigold House marked verified', date: 'Today, 9:42 am', status: 'Recorded' },
    { name: 'Invitation template published', detail: 'Admin account · Marigold Garden', date: 'Yesterday', status: 'Recorded' },
  ],
  '/admin/settings': [
    { name: 'Platform identity', detail: 'Utsav · support@utsav.example', date: 'Updated 1 Nov 2026', status: 'Active' },
    { name: 'Default commission', detail: '8% for venue bookings', date: 'Effective 1 Nov 2026', status: 'Active' },
  ],
};

function defaultItems(spec: PageSpec): CatalogItem[] {
  if (itemSeeds[spec.path]) return itemSeeds[spec.path];
  if (spec.section === 'vendor') {
    return vendors.slice(0, 4).map((vendor, index) => ({
      name: vendor.name,
      detail: `${vendor.category} · ${vendor.price}`,
      date: `${index + 2} Nov 2026`,
      status: index === 0 ? 'Confirmed' : 'Needs attention',
    }));
  }
  return [];
}

function actionStatus(status: string) {
  if (status === 'Pending' || status === 'Needs review' || status === 'New request') return 'Reviewed';
  if (status === 'Planning') return 'Confirmed';
  if (status === 'Due soon') return 'Paid';
  if (status === 'Needs attention') return 'Updated';
  return 'Completed';
}

function isCatalogItems(value: unknown): value is CatalogItem[] {
  return Array.isArray(value) && value.every((item) =>
    typeof item === 'object' && item !== null &&
    typeof item.name === 'string' &&
    typeof item.detail === 'string' &&
    typeof item.date === 'string' &&
    typeof item.status === 'string',
  );
}

const previousFallbackItems: CatalogItem[] = [
  { name: 'Aarav & Meera’s Wedding', detail: 'Jaipur, Rajasthan · 250 guests', date: '18 Dec 2026', status: 'Planning' },
  { name: 'Diya’s Mehendi', detail: 'Jaipur, Rajasthan · 120 guests', date: '16 Dec 2026', status: 'Confirmed' },
  { name: 'Family Engagement', detail: 'Udaipur, Rajasthan · 80 guests', date: '8 Feb 2027', status: 'Planning' },
];

function isPreviousDemoData(pathname: string, items: CatalogItem[]): boolean {
  let previousItems: CatalogItem[] | undefined;
  if (pathname === '/rsvp') {
    previousItems = guests.map((guest) => ({ name: guest.name, detail: `${guest.group} · ${guest.email}`, date: '18 Dec 2026', status: guest.status }));
  } else if (pathname === '/payments') {
    previousItems = [
      { name: 'The Marigold House', detail: 'Venue booking · Deposit', date: '4 Nov 2026', status: 'Paid' },
      { name: 'House of Petals', detail: 'Mehendi decor · First instalment', date: '2 Nov 2026', status: 'Paid' },
      { name: 'Golden Hour Studio', detail: 'Photography · Booking deposit', date: 'Due 15 Nov', status: 'Due soon' },
    ];
  } else if (pathname === '/vendor/quotation-requests') {
    previousItems = [
      { name: 'Meera Sharma', detail: 'Wedding venue · 250 guests', date: '18 Dec 2026', status: 'New request' },
      { name: 'Ritika Jain', detail: 'Venue & catering · 120 guests', date: '22 Dec 2026', status: 'New request' },
      { name: 'Kabir Mehta', detail: 'Sangeet · 180 guests', date: '3 Jan 2027', status: 'Replied' },
    ];
  } else if (pathname === '/vendor/reviews') {
    previousItems = [
      { name: 'Ananya & Karan', detail: '“The team made the whole evening feel effortless.”', date: '2 Nov 2026', status: '5.0 ★' },
      { name: 'Neha Sharma', detail: '“Beautiful details and such thoughtful service.”', date: '28 Oct 2026', status: '5.0 ★' },
      { name: 'Rohan & Diya', detail: '“We felt looked after from the very first call.”', date: '21 Oct 2026', status: '4.9 ★' },
    ];
  } else if (pathname.startsWith('/vendor/')) {
    previousItems = vendors.slice(0, 4).map((vendor, index) => ({
      name: vendor.name,
      detail: `${vendor.category} · ${vendor.price}`,
      date: `${index + 2} Nov 2026`,
      status: index === 0 ? 'Confirmed' : 'Needs attention',
    }));
  } else if (pathname.startsWith('/admin/')) {
    previousItems = [
      { name: 'The Marigold House', detail: 'Wedding venue · Jaipur', date: 'Today, 9:42 am', status: 'Verified' },
      { name: 'Saffron & Sage Catering', detail: 'Catering · Jaipur', date: 'Yesterday', status: 'Needs review' },
      { name: 'House of Petals', detail: 'Decor & flowers · Jaipur', date: '5 Nov 2026', status: 'Active' },
    ];
  } else {
    previousItems = previousFallbackItems;
  }
  return JSON.stringify(items) === JSON.stringify(previousItems);
}

function getCatalogInitialItems(pathname: string, defaults: CatalogItem[]): CatalogItem[] {
  if (typeof window === 'undefined') return defaults;
  try {
    const saved = window.localStorage.getItem(`utsav-catalog:${pathname}`);
    if (!saved) return defaults;
    const parsed: unknown = JSON.parse(saved);
    if (!isCatalogItems(parsed)) return defaults;
    return isPreviousDemoData(pathname, parsed) ? defaults : parsed;
  } catch (cause) {
    console.error(`Unable to migrate catalog data for "${pathname}".`, cause);
    return defaults;
  }
}

export function CatalogWorkspacePage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const spec = findSpec(pathname);
  const initialItems = useMemo(() => getCatalogInitialItems(pathname, defaultItems(spec)), [pathname]);
  const liveDataPaths = [
    '/catering',
    '/quotations',
    '/payments',
    '/vendor/quotation-requests',
    '/vendor/quotations',
    '/admin/users',
    '/admin/vendors',
    '/admin/vendor-verification',
    '/admin/templates',
    '/admin/venues',
    '/rsvp',
  ];
  const usesRemoteData = isAuthenticated && liveDataPaths.includes(pathname);
  const hasUnsupportedAuthenticatedWorkflow = isAuthenticated &&
    spec.section !== 'public' && spec.section !== 'auth' && spec.section !== 'guest' &&
    !liveDataPaths.includes(pathname);
  const [savedItems, setSavedItems, storageError] = usePersistentState(
    `utsav-catalog:v2:${pathname}`,
    initialItems,
    isCatalogItems,
  );
  const [remoteItems, setRemoteItems] = useState<CatalogItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState('');
  const items = usesRemoteData ? remoteItems : hasUnsupportedAuthenticatedWorkflow ? [] : savedItems;
  const setItems = usesRemoteData ? setRemoteItems : setSavedItems;
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(spec.categories?.[0] ?? 'Everything');
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    setQuery('');
    setActiveCategory(spec.categories?.[0] ?? 'Everything');
    setModalOpen(false);
    setSelectedQuotation(null);
    setNotice('');
  }, [pathname]);

  useEffect(() => {
    if (!usesRemoteData) return;
    let active = true;
    setRemoteItems([]);
    setRemoteLoading(true);
    setRemoteError('');
    const fetchItems = async (): Promise<CatalogItem[]> => {
      if (pathname === '/quotations' || pathname === '/vendor/quotation-requests' || pathname === '/vendor/quotations') {
        const quotations = await quotationsApi.list();
        return quotations.map((item) => ({
          entityId: item.id,
          name: item.title,
          detail: pathname === '/vendor/quotation-requests'
            ? `${item.eventName ?? `Event ${item.eventId}`} · ${item.guestCount ?? 0} guests`
            : item.vendorName ?? `Vendor · ${item.vendorId}`,
          date: pathname === '/vendor/quotation-requests'
            ? item.eventDate ?? 'Date not set'
            : item.validUntil ?? 'No expiry set',
          status: pathname === '/vendor/quotation-requests' && item.status === 'draft'
            ? 'New request'
            : item.status,
          quotation: item,
        }));
      }
      if (pathname === '/payments') {
        const payments = await paymentsApi.list();
        return payments.map((item) => ({
          entityId: item.id,
          name: item.invoiceNumber,
          detail: `${item.currency} ${item.amount.toLocaleString('en-IN')}`,
          date: item.paidAt ? formatDate(item.paidAt.slice(0, 10)) : '—',
          status: item.status,
        }));
      }
      if (pathname === '/admin/users') {
        const users = await adminApi.listUsers();
        return users.map((item) => ({
          entityId: item.id,
          name: item.name,
          detail: `${item.role} · ${item.email}`,
          date: '—',
          status: item.status,
        }));
      }
      if (pathname === '/admin/vendors' || pathname === '/admin/vendor-verification') {
        const vendors = await adminApi.listVendors();
        return vendors.map((item) => ({
          entityId: item.id,
          name: item.name,
          detail: `${item.category} · ${item.city}`,
          date: '—',
          status: item.verificationStatus === 'pending'
            ? 'Needs review'
            : item.verificationStatus === 'verified' ? 'Verified' : 'Rejected',
        }));
      }
      if (pathname === '/admin/templates') {
        const templates = await invitationsApi.listTemplates();
        return templates.map((item) => ({
          entityId: item.id,
          name: item.name,
          detail: item.category,
          date: item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'Free',
          status: 'Published',
        }));
      }
      if (pathname === '/admin/venues') {
        const venues = await venuesApi.list();
        return venues.map((item) => ({
          entityId: item.id,
          name: item.name,
          detail: `${item.city} · capacity ${item.capacity}`,
          date: `₹${item.pricePerDay.toLocaleString('en-IN')} / day`,
          status: 'Active',
        }));
      }
      if (pathname === '/catering') {
        const caterers = await cateringApi.listCaterers();
        const menus = await Promise.all(caterers.map(async (vendor) => {
          const vendorMenus = await cateringApi.listMenus(vendor.id);
          return vendorMenus.map((menu) => ({
            entityId: menu.id,
            name: menu.name,
            detail: `${vendor.name} · ₹${menu.pricePerPlate.toLocaleString('en-IN')} per plate`,
            date: vendor.city,
            status: menu.description || 'Menu available',
          }));
        }));
        return menus.flat();
      }
      if (pathname === '/rsvp') {
        const events = await eventsApi.list();
        if (!events[0]) return [];
        const guests = await guestsApi.list(events[0].id);
        return guests.map((guest) => ({
          entityId: guest.id,
          name: guest.name,
          detail: `${guest.group ?? 'Guest'} · ${guest.email ?? guest.phone ?? 'No contact provided'}`,
          date: events[0].name,
          status: guest.rsvpStatus,
        }));
      }
      return [];
    };
    fetchItems()
      .then((result) => {
        if (active) setRemoteItems(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setRemoteItems([]);
          setRemoteError(cause instanceof Error ? cause.message : 'Unable to load this section.');
        }
      })
      .finally(() => {
        if (active) setRemoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pathname, usesRemoteData]);

  const visibleItems = useMemo(() => items.filter((item) =>
    `${item.name} ${item.detail} ${item.status}`.toLowerCase().includes(query.toLowerCase()) &&
    (activeCategory === 'Everything' || activeCategory === 'All' || activeCategory === 'Everyone' || activeCategory.toLowerCase().startsWith('all ') ||
      activeCategory === 'All designs' || activeCategory === 'All menus' || activeCategory === 'All styles' ||
      activeCategory === 'All planners' || activeCategory === 'All services' ||
      (activeCategory === 'Needs attention' ? item.status === 'Needs attention' || item.status === 'Needs review' : item.status.toLowerCase().includes(activeCategory.toLowerCase()))),
  ), [activeCategory, items, query]);

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = [...formData.values()].map(String);
    const label = values.find(Boolean) ?? 'New item';
    if (pathname === '/invitation-editor') {
      const invitationId = searchParams.get('invitation');
      if (!invitationId) {
        setRemoteError('Choose an invitation design and event before opening the editor.');
        return;
      }
      setSubmitting(true);
      setRemoteError('');
      try {
        const invitation = await invitationsApi.update(invitationId, {
          title: values[0],
          status: 'published',
          design: {
            names: values[0],
            message: values[1] ?? '',
            date: values[2] ?? '',
            venue: values[3] ?? '',
          },
        });
        setModalOpen(false);
        setNotice(invitation.shareToken
          ? `Invitation published. Share ${window.location.origin}/invite/${invitation.shareToken}`
          : 'Invitation saved.');
      } catch (cause) {
        setRemoteError(cause instanceof Error ? cause.message : 'Unable to save your invitation.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (pathname === '/admin/venues') {
      setSubmitting(true);
      setRemoteError('');
      try {
        const venue = await adminApi.createVenue({
          name: values[0].trim(),
          city: values[1].trim(),
          capacity: Number(values[2]),
          pricePerDay: Number(values[3]),
          amenities: (values[4] ?? '').split(',').map((item) => item.trim()).filter(Boolean),
          imageUrl: values[5]?.trim() || undefined,
        });
        setRemoteItems((current) => [{
          entityId: venue.id,
          name: venue.name,
          detail: `${venue.city} · capacity ${venue.capacity}`,
          date: `₹${venue.pricePerDay.toLocaleString('en-IN')} / day`,
          status: 'Active',
        }, ...current]);
        setModalOpen(false);
        setNotice(`${venue.name} was added to the venue directory.`);
      } catch (cause) {
        setRemoteError(cause instanceof Error ? cause.message : 'Unable to add this venue.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (pathname === '/admin/templates') {
      setSubmitting(true);
      setRemoteError('');
      try {
        const template = await adminApi.createInvitationTemplate({
          name: values[0].trim(),
          category: values[1].trim(),
          price: Number(values[2] || 0),
          previewUrl: values[3]?.trim() || undefined,
        });
        setRemoteItems((current) => [{
          entityId: template.id,
          name: template.name,
          detail: template.category,
          date: template.price ? `₹${template.price.toLocaleString('en-IN')}` : 'Free',
          status: 'Published',
        }, ...current]);
        setModalOpen(false);
        setNotice(`${template.name} was added to the invitation collection.`);
      } catch (cause) {
        setRemoteError(cause instanceof Error ? cause.message : 'Unable to add this invitation template.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (isAuthenticated) {
      setRemoteError(`${spec.action} is not connected to a backend workflow yet. No changes were saved.`);
      return;
    }
    setItems((current) => [{ name: label, detail: values.slice(1).filter(Boolean).join(' · ') || 'Added to your workspace', date: formatDate(new Date().toISOString().slice(0, 10)), status: 'Planning' }, ...current]);
    setModalOpen(false);
    setNotice('Saved. Your new details are right here.');
  };

  const saveAction = async (item: CatalogItem) => {
    if (spec.section === 'public') {
      navigate('/register');
      return;
    }
    if (spec.section === 'vendor' && (pathname === '/vendor/quotation-requests' || pathname === '/vendor/quotations')) {
      if (!item.quotation) {
        setRemoteError('This quotation request is missing its server record. Refresh and try again.');
        return;
      }
      setSelectedQuotation(item.quotation);
      return;
    }
    if (pathname === '/quotations' && item.entityId && item.status === 'sent') {
      try {
        const updated = await quotationsApi.updateStatus(item.entityId, 'accepted');
        setItems((current) => current.map((entry) => entry.entityId === item.entityId ? { ...entry, status: updated.status } : entry));
        setNotice(`Accepted ${item.name}.`);
      } catch (cause) {
        setRemoteError(cause instanceof Error ? cause.message : 'Unable to update this quotation.');
      }
      return;
    }
    if (pathname === '/admin/vendor-verification' && item.entityId && item.status === 'Needs review') {
      try {
        const updated = await adminApi.updateVendorVerification(item.entityId, 'verified');
        setItems((current) => current.map((entry) => entry.entityId === item.entityId ? { ...entry, status: updated.verificationStatus === 'verified' ? 'Verified' : 'Needs review' } : entry));
        setNotice(`Verified ${item.name}.`);
      } catch (cause) {
        setRemoteError(cause instanceof Error ? cause.message : 'Unable to update vendor verification.');
      }
      return;
    }
    if (pathname === '/payments') {
      setRemoteError('Checkout is not enabled until a payment provider is configured.');
      return;
    }
    if (hasUnsupportedAuthenticatedWorkflow) {
      setRemoteError(`This action for ${item.name} is not connected to a backend workflow yet.`);
      return;
    }
    setItems((current) => current.map((entry) => entry === item ? { ...entry, status: actionStatus(entry.status) } : entry));
    setNotice(`Updated “${item.name}”.`);
  };

  const sendVendorReply = async (
    quotation: Quotation,
    input: {
      title: string;
      items: Array<{ description: string; quantity: number; unitPrice: number }>;
      validUntil?: string;
    },
  ) => {
    setSubmitting(true);
    setRemoteError('');
    try {
      const updated = await quotationsApi.sendVendorReply(quotation.id, input);
      setRemoteItems((current) => current.map((entry) => entry.entityId === updated.id
        ? {
          ...entry,
          quotation: updated,
          name: updated.title,
          date: updated.validUntil ?? 'No expiry set',
          status: updated.status,
          detail: `${updated.vendorName ?? 'Your proposal'} · ₹${(updated.total ?? 0).toLocaleString('en-IN')}`,
        }
        : entry));
      setSelectedQuotation(null);
      setNotice(`Your priced quotation for ${updated.title} was sent.`);
    } catch (cause) {
      setRemoteError(cause instanceof Error ? cause.message : 'Unable to send this quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (spec.section === 'public') return spec.mode === 'confirmation' ? <ConfirmationPage spec={spec} /> : <PublicPage spec={spec} />;
  if (spec.section === 'auth') return <AuthPage spec={spec} />;
  if (spec.section === 'guest') return <ConfirmationPage spec={spec} />;

  const stats = spec.stats ?? [
    { label: spec.eyebrow, value: String(items.length).padStart(2, '0'), foot: 'Records in this section' },
    {
      label: 'NEEDS FOLLOW-UP',
      value: String(items.filter((item) => ['Pending', 'Needs review', 'New request', 'Due soon', 'Draft'].includes(item.status)).length).padStart(2, '0'),
      foot: spec.action,
    },
    {
      label: 'ACTIVE OR CONFIRMED',
      value: String(items.filter((item) => ['Active', 'Confirmed', 'Published', 'Verified', 'Paid'].includes(item.status)).length).padStart(2, '0'),
      foot: 'Ready or completed items',
    },
  ];

  return (
    <div className="catalog-page screen-stack">
      <section className={`catalog-intro catalog-intro--${spec.section}`}>
        <div><span className="eyebrow">{spec.eyebrow}</span><h2>{spec.title}</h2><p>{spec.description}</p></div>
        <button className="button button--primary" onClick={() => spec.mode === 'form' || spec.mode === 'editor' ? setModalOpen(true) : pathname === '/vendor/quotations' || pathname === '/vendor/quotation-requests' ? setNotice('Choose a request below to prepare a priced quotation.') : setNotice(spec.section === 'admin' ? 'Your report is ready to review.' : 'You’re all caught up.')}><Icon name="plus" size={16} />{spec.action}</button>
      </section>

      <section className="catalog-stat-grid">
        {stats.map((stat, index) => <article className="catalog-stat" key={stat.label}><span className={`stat-icon ${['stat-icon--rose', 'stat-icon--sage', 'stat-icon--gold'][index % 3]}`}><Icon name={index === 0 ? 'grid' : index === 1 ? 'sparkle' : 'calendar'} size={17} /></span><span className="stat-label">{stat.label}</span><strong>{stat.value}</strong><small>{stat.foot}</small></article>)}
      </section>

      {spec.mode === 'editor' && <section className="content-card editor-preview-card"><div className="editor-preview"><span>TOGETHER WITH THEIR FAMILIES</span><i>✿</i><strong>Aarav<br /><em>&</em> Meera</strong><small>INVITE YOU TO CELEBRATE</small><b>18 · 12 · 26</b></div><div><span className="eyebrow">YOUR INVITATION, YOUR WORDS</span><h3>Start with a little hello.</h3><p>Choose your favourite wording, adjust the details, and send a note from the heart.</p><button className="button button--primary" onClick={() => setModalOpen(true)}>Personalise this invitation →</button></div></section>}

      <section className="content-card catalog-list-card">
        {storageError && <p className="form-error" role="alert">{storageError}</p>}
        {hasUnsupportedAuthenticatedWorkflow && <p className="form-error" role="alert">This section does not have a connected backend workflow yet. Demo data is hidden while you are signed in.</p>}
        {remoteError && <p className="form-error" role="alert">{remoteError}</p>}
        {remoteLoading && <p role="status">Loading live data…</p>}
        <div className="list-toolbar"><div><h2>{spec.title.replace(/[.!?]+$/, '')}</h2><p className="section-description">{spec.description}</p></div>{(spec.mode === 'form' || spec.mode === 'editor') && <button className="button button--outline" onClick={() => setModalOpen(true)}><Icon name="plus" size={15} />{spec.action}</button>}</div>
        <div className="catalog-tools"><div className="inline-search"><Icon name="search" size={16} /><input placeholder={`Search ${spec.title.toLowerCase()}...`} value={query} onChange={(event) => setQuery(event.target.value)} /></div>{spec.categories && <div className="filter-tabs">{spec.categories.map((category) => <button className={activeCategory === category ? 'filter-tab filter-tab--active' : 'filter-tab'} key={category} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>}</div>
        <div className="catalog-table-wrap"><div className="catalog-row catalog-row--header"><span>NAME</span><span>DETAILS</span><span>DATE</span><span>STATUS</span><span /></div>
          {visibleItems.map((item, index) => <article className="catalog-row" key={`${item.name}-${index}`}><div className="catalog-name"><span className={`catalog-avatar catalog-avatar--${index % 4}`}>{item.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}</span><strong>{item.name}</strong></div><span className="catalog-detail">{item.detail}</span><span className="catalog-date">{item.date}</span><span className={`catalog-status catalog-status--${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span><button className="button button--outline catalog-row-action" onClick={() => saveAction(item)}>{item.status === 'New request' ? 'Reply' : item.status === 'Needs review' ? 'Review' : item.status === 'Pending' ? 'Follow up' : 'View'} <span>↗</span></button></article>)}
          {!visibleItems.length && <div className="empty-state"><span>✿</span><strong>Nothing to show just yet.</strong><p>Try a different search or category. New details will find their way here.</p></div>}
        </div>
        <div className="catalog-footer"><span>Showing {visibleItems.length} of {items.length} items</span><span>Good things are coming together.</span></div>
      </section>

      <div className="tip-banner"><span>✦</span><p><strong>{spec.action}</strong> {spec.description}</p></div>
      {notice && <div className="catalog-toast" role="status"><span>✓</span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
      {modalOpen && <CatalogModal spec={spec} onClose={() => setModalOpen(false)} onSubmit={submitForm} submitting={submitting} />}
      {selectedQuotation && <VendorQuotationReplyModal
        quotation={selectedQuotation}
        saving={submitting}
        onClose={() => setSelectedQuotation(null)}
        onSubmit={(input) => sendVendorReply(selectedQuotation, input)}
      />}
    </div>
  );
}

function VendorQuotationReplyModal({
  quotation,
  saving,
  onClose,
  onSubmit,
}: {
  quotation: Quotation;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    validUntil?: string;
  }) => Promise<void>;
}) {
  const [error, setError] = useState('');
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="vendor-quotation-title">
        <div className="modal-top"><span className="modal-kicker"><Icon name="sparkle" size={16} /> A clear proposal, thoughtfully shared</span><button className="plain-icon" aria-label="Close" onClick={onClose} disabled={saving}><Icon name="close" /></button></div>
        <h2 id="vendor-quotation-title">Prepare your quotation.</h2>
        <p className="modal-description">Add at least one priced line item before sending this proposal.</p>
        <form className="event-form" onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError('');
          try {
            await onSubmit({
              title: String(form.get('title') ?? '').trim(),
              validUntil: String(form.get('validUntil') ?? '') || undefined,
              items: [{
                description: String(form.get('description') ?? '').trim(),
                quantity: Number(form.get('quantity')),
                unitPrice: Number(form.get('unitPrice')),
              }],
            });
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to send this quotation.');
          }
        }}>
          <label>Proposal title<input name="title" required minLength={2} defaultValue={quotation.title} /></label>
          <label>Service or inclusion<input name="description" required maxLength={255} defaultValue={quotation.items[0]?.description ?? ''} /></label>
          <label>Quantity<input name="quantity" required type="number" min="0.01" step="0.01" defaultValue={quotation.items[0]?.quantity ?? 1} /></label>
          <label>Price per unit (₹)<input name="unitPrice" required type="number" min="0" step="0.01" defaultValue={quotation.items[0]?.unitPrice ?? ''} /></label>
          <label>Valid until<input name="validUntil" type="date" defaultValue={quotation.validUntil ?? ''} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Sending…' : 'Send quotation'} <span>→</span></button></div>
        </form>
      </section>
    </div>
  );
}

function CatalogModal({ spec, onClose, onSubmit, submitting }: { spec: PageSpec; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>; submitting: boolean }) {
  const fields = spec.fields ?? ['Name', 'Description', 'Date', 'Notes'];
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title"><div className="modal-top"><span className="modal-kicker"><Icon name="sparkle" size={16} /> A thoughtful next step</span><button className="plain-icon" aria-label="Close" onClick={onClose} disabled={submitting}><Icon name="close" /></button></div><h2 id="catalog-modal-title">{spec.action}.</h2><p className="modal-description">{spec.description}</p><form className="event-form" onSubmit={onSubmit}>{fields.map((field, index) => { const normalized = field.toLowerCase(); const required = index === 0 || spec.path === '/admin/venues' && index < 4 || spec.path === '/admin/templates' && index < 2; return <label key={field}>{field}{normalized.includes('date') ? <input type="date" name={field} required={required} /> : normalized.includes('message') || normalized.includes('notes') || normalized.includes('introduction') || normalized.includes('included') ? <textarea name={field} rows={3} placeholder={`Add ${field.toLowerCase()}...`} /> : normalized.includes('type') || normalized.includes('role') || normalized.includes('availability') || normalized.includes('language') ? <select name={field}><option value="">Choose one</option><option>Wedding</option><option>Family</option><option>Friends</option><option>Available</option><option>English</option><option>Other</option></select> : normalized.includes('capacity') || normalized.includes('price') ? <input name={field} type="number" min={normalized.includes('capacity') ? '1' : '0'} step="0.01" required={required} placeholder={`Enter ${field.toLowerCase()}`} /> : <input name={field} type={normalized.includes('url') ? 'url' : 'text'} placeholder={`Enter ${field.toLowerCase()}`} required={required} />}</label>; })}<div className="modal-actions"><button type="button" className="button button--quiet" onClick={onClose} disabled={submitting}>Maybe later</button><button type="submit" className="button button--primary" disabled={submitting}>{submitting ? 'Saving…' : spec.action} <span>→</span></button></div></form></section></div>;
}

function PublicPage({ spec }: { spec: PageSpec }) {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const landingCardsByPath: Record<string, { icon: string; title: string; body: string }[]> = {
    '/home': [
      { icon: '✿', title: 'Bring your people close', body: 'Keep guest groups, invitations, and replies together as your plans take shape.' },
      { icon: '⌂', title: 'Find trusted local vendors', body: 'Compare venues and services that suit your celebration and your budget.' },
      { icon: '✦', title: 'Keep every detail in reach', body: 'Track bookings, payments, and the next step from one shared workspace.' },
    ],
    '/about': [
      { icon: '♡', title: 'Made for family planning', body: 'Give everyone helping with the celebration a place to share ideas and updates.' },
      { icon: '✿', title: 'Built around meaningful moments', body: 'Plan weddings, milestone gatherings, and all the moments worth bringing people together.' },
      { icon: '✦', title: 'A community that cares', body: 'Connect families with local professionals who understand the details behind the day.' },
    ],
    '/services': [
      { icon: '⌂', title: 'Venues and vendors', body: 'Explore spaces, catering, decor, and trusted professionals for your occasion.' },
      { icon: '✉', title: 'Invitations and guests', body: 'Share personal invitations, organise guest groups, and follow every RSVP.' },
      { icon: '₹', title: 'Budgets and bookings', body: 'Compare quotations and keep payments and vendor commitments organised.' },
    ],
    '/how-it-works': [
      { icon: '01', title: 'Create your celebration', body: 'Add the date, location, guest count, and budget to start your workspace.' },
      { icon: '02', title: 'Plan together', body: 'Invite family, build your guest list, and collect ideas in one place.' },
      { icon: '03', title: 'Make it happen', body: 'Choose vendors, confirm bookings, and keep everyone up to date.' },
    ],
    '/explore/venues': [
      { icon: '⌂', title: 'Choose the right setting', body: 'Browse celebration spaces by location, capacity, and atmosphere.' },
      { icon: '₹', title: 'Compare venue details', body: 'Review pricing, amenities, and practical details before you enquire.' },
      { icon: '✉', title: 'Ask about your date', body: 'Keep venue conversations close to the event you are planning.' },
    ],
    '/explore/invitations': [
      { icon: '✿', title: 'Find a style you love', body: 'Explore floral, traditional, and contemporary designs for your celebration.' },
      { icon: '✎', title: 'Make it personal', body: 'Add your names, event details, and a message that sounds like you.' },
      { icon: '✉', title: 'Share with your guests', body: 'Send your invitation and keep responses connected to your guest list.' },
    ],
    '/contact': [
      { icon: '✉', title: 'Tell us what you need', body: 'Share a question about planning, vendors, or your Utsav account.' },
      { icon: '♡', title: 'Get help from our team', body: 'We will review your message and follow up with useful next steps.' },
      { icon: '✦', title: 'Keep planning with confidence', body: 'We are here to make the details feel a little easier to manage.' },
    ],
  };
  const landingCards = landingCardsByPath[spec.path] ?? landingCardsByPath['/home'];
  if (spec.path === '/contact' && sent) return <PublicShell><section className="public-thanks"><span>✿</span><p className="eyebrow">YOUR NOTE IS ON ITS WAY</p><h1>Thank you for saying hello.</h1><p>Our celebration team will be in touch soon. We can’t wait to help.</p><button className="button button--primary" onClick={() => setSent(false)}>Send another note</button></section></PublicShell>;
  return <PublicShell><main className="public-page">
    <section className="public-hero"><div className="public-hero-copy"><span className="eyebrow">{spec.eyebrow}</span><h1>{spec.title}</h1><p>{spec.description}</p>{spec.path === '/contact' ? <form className="public-contact-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><input aria-label="Your name" placeholder="Your name" required value={contactName} onChange={(event) => setContactName(event.target.value)} /><input aria-label="Your email address" placeholder="Your email address" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><textarea aria-label="What can we help with?" placeholder="What can we help with?" required rows={3} value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} /><button className="button button--primary">{spec.action} →</button></form> : <div className="public-hero-actions"><button className="button button--primary" onClick={() => navigate('/register')}>{spec.action} →</button><button className="button button--quiet" onClick={() => navigate('/how-it-works')}>See how it works</button></div>}<div className="public-social-proof"><span className="mini-avatars"><i>AS</i><i>RM</i><i>AK</i></span><span><strong>Made for moments that matter</strong><small>Thoughtful planning for families, together.</small></span></div></div><div className="public-hero-art"><div className="public-art-sun" /><div className="public-art-arch"><i>✿</i><span>make room<br />for joy</span><b>✦</b></div><span className="public-art-flower public-art-flower--one">✿</span><span className="public-art-flower public-art-flower--two">✳</span><span className="public-art-caption">your day, your way</span></div></section>
    <section className="public-value-section"><div className="public-section-heading"><span className="eyebrow">THE GOOD THINGS, ALL TOGETHER</span><h2>A little less juggling.<br />A lot more looking forward to it.</h2></div><div className="public-feature-grid">{landingCards.map((card) => <article className="public-feature" key={card.title}><span>{card.icon}</span><h3>{card.title}</h3><p>{card.body}</p><button onClick={() => navigate('/register')}>Make it yours →</button></article>)}</div></section>
    <section className="public-bottom-cta"><div><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>There’s something lovely ahead.</h2><p>Make a little space for it. We’ll help with the rest.</p></div><button className="button button--light" onClick={() => navigate('/register')}>Start your free workspace →</button></section>
  </main><PublicFooter /></PublicShell>;
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return <div className="public-shell"><header className="public-header"><Link to="/home" className="brand"><span className="brand-mark">u</span><span className="brand-word">utsav<span>.</span></span></Link><nav><Link to="/services">What we do</Link><Link to="/explore/venues">Find a venue</Link><Link to="/explore/invitations">Invitations</Link><Link to="/about">Our story</Link></nav><div><button className="public-login" onClick={() => navigate('/login')}>Sign in</button><button className="button button--primary" onClick={() => navigate('/register')}>Get started</button></div></header>{children}</div>;
}

function PublicFooter() {
  return <footer className="public-footer"><span className="brand-word">utsav<span>.</span></span><span>Thoughtful planning for moments that matter.</span><span>© 2026 Utsav</span></footer>;
}

function AuthPage({ spec }: { spec: PageSpec }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registerRole, setRegisterRole] = useState<'family' | 'vendor' | 'planner'>('family');
  const [notice, setNotice] = useState(
    typeof location.state === 'object' && location.state !== null && 'notice' in location.state
      ? String(location.state.notice)
      : '',
  );
  const fieldLabel = (field: string) => field.toLowerCase().includes('password') ? 'password' : field.toLowerCase().includes('email') ? 'email' : 'text';
  const registrationFields = registerRole === 'family'
    ? [
      { name: 'name', label: 'Your name', required: true, type: 'text' },
      { name: 'email', label: 'Email address', required: true, type: 'email' },
      { name: 'phone', label: 'Phone number', required: false, type: 'tel' },
      { name: 'password', label: 'Create a password', required: true, type: 'password' },
      { name: 'confirmPassword', label: 'Confirm password', required: true, type: 'password' },
      { name: 'workspaceName', label: 'Family or workspace name', required: true, type: 'text' },
    ]
    : registerRole === 'vendor'
      ? [
        { name: 'name', label: 'Your name', required: true, type: 'text' },
        { name: 'email', label: 'Email address', required: true, type: 'email' },
        { name: 'phone', label: 'Phone number', required: false, type: 'tel' },
        { name: 'password', label: 'Create a password', required: true, type: 'password' },
        { name: 'confirmPassword', label: 'Confirm password', required: true, type: 'password' },
        { name: 'businessName', label: 'Business name', required: true, type: 'text' },
        { name: 'category', label: 'Service category', required: true, type: 'text' },
        { name: 'city', label: 'City', required: true, type: 'text' },
        { name: 'address', label: 'Business address', required: true, type: 'text' },
        { name: 'description', label: 'Business description (optional)', required: false, type: 'text' },
      ]
      : [
        { name: 'name', label: 'Your name', required: true, type: 'text' },
        { name: 'email', label: 'Email address', required: true, type: 'email' },
        { name: 'phone', label: 'Phone number', required: false, type: 'tel' },
        { name: 'password', label: 'Create a password', required: true, type: 'password' },
        { name: 'confirmPassword', label: 'Confirm password', required: true, type: 'password' },
        { name: 'companyName', label: 'Planning business name (optional)', required: false, type: 'text' },
        { name: 'yearsExperience', label: 'Years of experience', required: false, type: 'number' },
      ];
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email') ?? searchParams.get('email') ?? '').trim();
    try {
      if (spec.path === '/login') {
        const session = await authApi.login({ email, password: String(values.get('password') ?? '') });
        setSession(session);
        if ((session.memberships?.length ?? 0) > 1) {
          navigate('/choose-workspace', { replace: true });
          return;
        }
        const from = location.state && typeof location.state === 'object' && 'from' in location.state
          ? location.state.from
          : null;
        const destination = from && typeof from === 'object' && 'pathname' in from &&
          typeof from.pathname === 'string' && from.pathname.startsWith('/')
          ? `${from.pathname}${'search' in from && typeof from.search === 'string' ? from.search : ''}${'hash' in from && typeof from.hash === 'string' ? from.hash : ''}`
          : '/';
        navigate(destination, { replace: true });
        return;
      }
      if (spec.path === '/register') {
        const password = String(values.get('password') ?? '');
        if (password !== String(values.get('confirmPassword') ?? '')) {
          setError('The passwords do not match.');
          return;
        }
        const base = {
          name: String(values.get('name') ?? '').trim(),
          email,
          phone: String(values.get('phone') ?? '').trim(),
          password,
        };
        if (registerRole === 'family') {
          await authApi.register({
            ...base,
            role: 'family',
            workspaceName: String(values.get('workspaceName') ?? '').trim(),
          });
        } else if (registerRole === 'vendor') {
          await authApi.register({
            ...base,
            role: 'vendor',
            businessName: String(values.get('businessName') ?? '').trim(),
            category: String(values.get('category') ?? '').trim(),
            city: String(values.get('city') ?? '').trim(),
            address: String(values.get('address') ?? '').trim(),
            description: String(values.get('description') ?? '').trim(),
          });
        } else {
          await authApi.register({
            ...base,
            role: 'planner',
            companyName: String(values.get('companyName') ?? '').trim(),
            yearsExperience: values.get('yearsExperience')
              ? Number(values.get('yearsExperience'))
              : undefined,
          });
        }
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }
      if (spec.path === '/verify-otp') {
        if (!email) {
          setError('Return to registration and provide the email address used for your account.');
          return;
        }
        const session = await authApi.verifyOtp(email, String(values.get('code') ?? ''));
        setSession(session);
        navigate((session.memberships?.length ?? 0) > 1 ? '/choose-workspace' : '/', { replace: true });
        return;
      }
      if (spec.path === '/forgot-password') {
        await authApi.requestPasswordReset(email);
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        return;
      }
      if (spec.path === '/reset-password') {
        const password = String(values.get('password') ?? '');
        if (password !== String(values.get('confirmPassword') ?? '')) {
          setError('The passwords do not match.');
          return;
        }
        await authApi.resetPassword(email, String(values.get('code') ?? ''), password);
        navigate('/login', { replace: true, state: { notice: 'Your password has been updated. You can sign in now.' } });
        return;
      }
      setError('This account flow is not connected yet. No changes were made.');
    } catch (cause) {
      if (axios.isAxiosError<{ message?: string; detail?: string }>(cause)) {
        setError(
          cause.response?.data?.detail ??
          cause.response?.data?.message ??
          (cause.response
            ? 'The request could not be completed. Please try again.'
            : 'Utsav services are currently unreachable. Your account was not changed. Please try again later.'),
        );
      } else {
        setError(cause instanceof Error ? cause.message : 'The request could not be completed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };
  return <main className="auth-page">
    <aside className="auth-art">
      <Link to="/home" className="brand"><span className="brand-mark">u</span><span className="brand-word">utsav<span>.</span></span></Link>
      <div className="auth-art-copy"><span className="eyebrow">A LITTLE SPACE FOR A LOT OF LOVE</span><h1>Big days are<br />better together.</h1><p>Bring your favourite people, thoughtful details, and happy plans together.</p><div className="auth-art-arch"><span>made for<br />your moment</span><i>✿</i></div></div>
      <span className="auth-art-footer">THOUGHTFULLY MADE FOR YOUR CELEBRATIONS</span>
    </aside>
    <section className="auth-panel">
      <div className="auth-panel-top"><span>Already have a workspace?</span><button type="button" onClick={() => navigate(spec.path === '/login' ? '/register' : '/login')}>{spec.path === '/login' ? 'Create account' : 'Sign in'} →</button></div>
      <div className="auth-form-wrap">
        <>
          <span className="eyebrow">{spec.eyebrow}</span>
          <h2>{spec.path === '/register'
            ? registerRole === 'vendor' ? 'Create your vendor workspace.'
              : registerRole === 'planner' ? 'Create your planner workspace.'
                : 'Let’s make room for a celebration.'
            : spec.title}</h2>
          <p>{spec.path === '/register'
            ? registerRole === 'vendor' ? 'Share your business details so families can discover your services.'
              : registerRole === 'planner' ? 'Set up your professional workspace and start coordinating celebrations.'
                : spec.description
            : spec.description}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {spec.path === '/register' && (
              <label>Account type
                <select value={registerRole} onChange={(event) => setRegisterRole(event.target.value as typeof registerRole)}>
                  <option value="family">Family / Event Organizer</option>
                  <option value="vendor">Vendor / Service Provider</option>
                  <option value="planner">Wedding Planner</option>
                </select>
              </label>
            )}
            {spec.path === '/register'
              ? registrationFields.map((field) => (
                <label key={field.name}>{field.label}
                  <input
                    name={field.name}
                    required={field.required}
                    type={field.type}
                    autoComplete={field.name.includes('Password') || field.name === 'password' ? 'new-password' : field.name === 'email' ? 'email' : undefined}
                    placeholder={field.type === 'password' ? 'At least 8 characters' : `Enter ${field.label.toLowerCase()}`}
                    minLength={field.type === 'password' ? 8 : undefined}
                    min={field.type === 'number' ? 0 : undefined}
                    max={field.type === 'number' ? 80 : undefined}
                  />
                </label>
              ))
              : (spec.fields ?? []).map((field) => {
              const normalized = field.toLowerCase();
              const name = normalized.includes('email') ? 'email'
                : normalized.includes('password') && normalized.includes('confirm') ? 'confirmPassword'
                  : normalized.includes('password') ? 'password'
                    : normalized.includes('name') ? 'name'
                      : normalized.includes('phone') ? 'phone'
                        : normalized.includes('code') ? 'code' : 'value';
              return <label key={field}>{field}<input name={name} required type={fieldLabel(field)} autoComplete={name === 'password' ? 'current-password' : name === 'email' ? 'email' : undefined} placeholder={normalized.includes('password') ? 'At least 8 characters' : normalized.includes('email') ? 'you@example.com' : `Enter ${normalized}`} minLength={normalized.includes('password') ? 8 : undefined} /></label>;
            })}
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            {spec.path === '/login' && <Link className="forgot-link" to="/forgot-password">Forgot your password?</Link>}
            <button type="submit" className="button button--primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : `${spec.action} →`}</button>
          </form>
          <div className="auth-switch">{spec.path === '/login' ? <>New to Utsav? <Link to="/register">Create a free account</Link></> : <>Already have an account? <Link to="/login">Sign in</Link></>}</div>
          <small className="auth-terms">By continuing, you agree to our Terms of Service and Privacy Policy.</small>
        </>
      </div>
    </section>
  </main>;
}

function ConfirmationPage({ spec }: { spec: PageSpec }) {
  const navigate = useNavigate();
  return <main className="guest-portal"><div className="guest-portal-brand"><span className="brand-mark">u</span><span className="brand-word">utsav<span>.</span></span></div><section className="guest-thank-you"><span>✿</span><p className="eyebrow">{spec.eyebrow}</p><h1>{spec.title}</h1><p>{spec.description}</p><div className="guest-thank-you-signature">With love,<br /><strong>Your Utsav family</strong></div><button className="button button--primary" onClick={() => navigate('/')}>{spec.action} →</button></section><footer className="guest-portal-footer">MADE WITH LOVE, SHARED WITH UTSAV <span>✦</span></footer></main>;
}
