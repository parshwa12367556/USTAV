import type { QuotationLineItem } from '../../../types/quotation.types';
import { formatCurrency } from '../../../utils/formatCurrency';
export function QuoteLineItems({ items }: { items: QuotationLineItem[] }) {
  return <table className="quote-line-items"><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>
    {items.map((item) => <tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{formatCurrency(item.unitPrice)}</td><td>{formatCurrency(item.quantity * item.unitPrice)}</td></tr>)}
  </tbody></table>;
}
