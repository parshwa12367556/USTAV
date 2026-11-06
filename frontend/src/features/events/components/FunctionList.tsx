import type { EventFunction } from '../../../types/function.types';
import { formatDate } from '../../../utils/formatDate';
export function FunctionList({ functions, onRemove }: { functions: EventFunction[]; onRemove?: (id: string) => void }) {
  return <ul className="function-list">{functions.map((item) => <li key={item.id}><strong>{item.name}</strong><time dateTime={item.date}>{formatDate(item.date)}</time>{onRemove && <button type="button" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)}>Remove</button>}</li>)}</ul>;
}
