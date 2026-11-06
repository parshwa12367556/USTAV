import { formatCurrency } from '../../utils/formatCurrency';

export function PriceDisplay({ amount, className = '' }: { amount: number; className?: string }) {
  return <span className={`price-display ${className}`}>{formatCurrency(amount)}</span>;
}
