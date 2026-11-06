export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
