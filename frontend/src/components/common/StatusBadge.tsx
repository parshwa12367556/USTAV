import { Badge } from '../ui/Badge';

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = /paid|confirmed|completed|accepted|active|attending/.test(normalized)
    ? 'success'
    : /declined|failed|cancelled|suspended/.test(normalized)
      ? 'danger'
      : /pending|requested|draft/.test(normalized) ? 'warning' : 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}
