import { Modal } from '../../../components/ui/Modal';
import type { Quotation } from '../../../types/quotation.types';
import { formatCurrency } from '../../../utils/formatCurrency';
export function QuoteComparisonModal({ open, quotes, onClose }: { open: boolean; quotes: Quotation[]; onClose: () => void }) {
  return <Modal open={open} title="Compare quotations" onClose={onClose}><div className="quote-comparison">
    {quotes.map((quote) => <article key={quote.id}><h3>{quote.title}</h3><ul>{quote.items.map((item) => <li key={item.id}>{item.description} × {item.quantity}<strong>{formatCurrency(item.quantity * item.unitPrice)}</strong></li>)}</ul><strong>{formatCurrency(quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))}</strong></article>)}
  </div></Modal>;
}
