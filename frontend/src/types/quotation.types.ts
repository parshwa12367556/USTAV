export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined';

export type QuotationLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Quotation = {
  id: string;
  eventId: string;
  vendorId: string;
  title: string;
  status: QuotationStatus;
  items: QuotationLineItem[];
  validUntil?: string;
  vendorName?: string;
  eventName?: string;
  eventDate?: string;
  guestCount?: number;
  total?: number;
};
