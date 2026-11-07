import { Modal } from '../../../components/ui/Modal';
import type { EventFunction } from '../../../types/function.types';
export function AssignFunctionsModal({ open, guestName, functions, selectedIds, saving, error, onChange, onClose, onSave }: { open: boolean; guestName: string; functions: EventFunction[]; selectedIds: string[]; saving: boolean; error?: string; onChange: (ids: string[]) => void; onClose: () => void; onSave: () => void }) {
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  return <Modal
    open={open}
    title={`Assign functions to ${guestName}`}
    onClose={saving ? () => undefined : onClose}
    footer={<><button type="button" onClick={onClose} disabled={saving}>Cancel</button><button type="button" onClick={onSave} disabled={saving || !selectedIds.length}>{saving ? 'Saving…' : 'Save functions'}</button></>}
  >
    <p>Select the parts of the celebration this guest should be invited to.</p>
    <fieldset disabled={saving}>{functions.map((item) => <label key={item.id}><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggle(item.id)} />{item.name}</label>)}</fieldset>
    {!selectedIds.length && <p role="alert">Select at least one function for this invitation.</p>}
    {error && <p role="alert">{error}</p>}
  </Modal>;
}
