import { Modal } from '../../../components/ui/Modal';
import type { EventFunction } from '../../../types/function.types';
export function AssignFunctionsModal({ open, guestName, functions, selectedIds, onChange, onClose }: { open: boolean; guestName: string; functions: EventFunction[]; selectedIds: string[]; onChange: (ids: string[]) => void; onClose: () => void }) {
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  return <Modal open={open} title={`Assign functions to ${guestName}`} onClose={onClose}>
    <fieldset>{functions.map((item) => <label key={item.id}><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} />{item.name}</label>)}</fieldset>
    <button type="button" onClick={onClose}>Done</button>
  </Modal>;
}
