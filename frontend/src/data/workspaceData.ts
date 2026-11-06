import type { EventRecord, GuestRecord } from '../types/workspace.types';

export const initialEvents: EventRecord[] = [
  {
    id: 'evt-1',
    name: 'Aarav & Meera’s Wedding',
    type: 'Wedding celebration',
    date: '2026-12-18',
    location: 'Jaipur, Rajasthan',
    guests: 250,
    budget: 1850000,
    spent: 845000,
    status: 'Planning',
    initials: 'AM',
    accent: 'rose',
  },
  {
    id: 'evt-2',
    name: 'Diya’s Mehendi',
    type: 'Mehendi',
    date: '2026-12-16',
    location: 'Jaipur, Rajasthan',
    guests: 120,
    budget: 425000,
    spent: 186000,
    status: 'Confirmed',
    initials: 'D',
    accent: 'saffron',
  },
  {
    id: 'evt-3',
    name: 'Family Engagement',
    type: 'Engagement',
    date: '2027-02-08',
    location: 'Udaipur, Rajasthan',
    guests: 80,
    budget: 320000,
    spent: 0,
    status: 'Planning',
    initials: 'FE',
    accent: 'sage',
  },
];

export const guests: GuestRecord[] = [
  { name: 'Ananya Sharma', group: 'Bride’s family', email: 'ananya.s@email.com', status: 'Confirmed' },
  { name: 'Rohan Mehta', group: 'Groom’s family', email: 'rohan.m@email.com', status: 'Confirmed' },
  { name: 'Kavya Iyer', group: 'Friends', email: 'kavya.iyer@email.com', status: 'Pending' },
  { name: 'Arjun Kapoor', group: 'Friends', email: 'arjun.k@email.com', status: 'Confirmed' },
  { name: 'Priya Nair', group: 'Bride’s family', email: 'priya.n@email.com', status: 'Pending' },
  { name: 'Ishaan Verma', group: 'Colleagues', email: 'ishaan.v@email.com', status: 'Declined' },
];

export const vendors = [
  { name: 'The Marigold House', category: 'Wedding venues', location: 'Jaipur, Rajasthan', rating: '4.9', price: '₹2,40,000', icon: '✳', tone: 'rose' },
  { name: 'Saffron & Sage Catering', category: 'Catering', location: 'Jaipur, Rajasthan', rating: '4.8', price: '₹1,200 / plate', icon: '❋', tone: 'saffron' },
  { name: 'House of Petals', category: 'Decor & flowers', location: 'Jaipur, Rajasthan', rating: '5.0', price: 'From ₹85,000', icon: '✿', tone: 'sage' },
  { name: 'Golden Hour Studio', category: 'Photography', location: 'Jaipur, Rajasthan', rating: '4.9', price: 'From ₹65,000', icon: '◉', tone: 'lavender' },
  { name: 'The Courtyard Palace', category: 'Wedding venues', location: 'Udaipur, Rajasthan', rating: '4.9', price: '₹3,10,000', icon: '⌂', tone: 'saffron' },
  { name: 'Rang by Rhea', category: 'Makeup & styling', location: 'Jaipur, Rajasthan', rating: '4.7', price: 'From ₹28,000', icon: '✦', tone: 'rose' },
];

export const initialTasks = [
  { id: 'venue', title: 'Book your wedding venue', detail: 'Compare 3 shortlisted spaces', due: 'Due this week', done: true },
  { id: 'guest-list', title: 'Finalise your guest list', detail: '184 of 250 guests added', due: 'Due 12 Nov', done: false },
  { id: 'photographer', title: 'Choose a photographer', detail: 'You have 4 new recommendations', due: 'Due 15 Nov', done: false },
  { id: 'invitations', title: 'Send save-the-dates', detail: 'Design your first invitation', due: 'Due 20 Nov', done: false },
];

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
