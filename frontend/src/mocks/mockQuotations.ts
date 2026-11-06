import type { Quotation } from '../types/quotation.types';

export const mockQuotations: Quotation[] = [
  {
    id: 'quote-1',
    eventId: 'event-1',
    vendorId: 'vendor-1',
    title: 'Photography package',
    status: 'sent',
    items: [{ id: 'item-1', description: 'Full-day photography', quantity: 1, unitPrice: 65000 }],
  },
];
