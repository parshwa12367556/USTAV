import { useState, type FormEvent } from 'react';
import type { QuotationLineItem } from '../../../types/quotation.types';
export function CreateQuoteForm({ vendorId, eventId, onSubmit }: { vendorId: string; eventId: string; onSubmit: (quote: { vendorId: string; eventId: string; title: string; items: QuotationLineItem[] }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const unitPrice = Number(price);
    if (!title.trim() || !description.trim() || !Number.isFinite(unitPrice) || unitPrice < 0) return;
    onSubmit({ vendorId, eventId, title: title.trim(), items: [{ id: `line-${Date.now()}`, description: description.trim(), quantity: 1, unitPrice }] });
  };
  return <form onSubmit={submit}><label>Quote title<input required value={title} onChange={(event) => setTitle(event.currentTarget.value)} /></label><label>Service details<input required value={description} onChange={(event) => setDescription(event.currentTarget.value)} /></label><label>Price<input type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.currentTarget.value)} /></label><button type="submit">Send quote</button></form>;
}
