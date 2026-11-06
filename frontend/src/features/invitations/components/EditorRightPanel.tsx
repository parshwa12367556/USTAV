import type { InvitationElement } from '../types/editor.types';
export function EditorRightPanel({ element, onChange, onDelete }: { element?: InvitationElement; onChange: (element: InvitationElement) => void; onDelete: (id: string) => void }) {
  if (!element) return <aside className="editor-right-panel"><p>Select an item to edit its details.</p></aside>;
  return <aside className="editor-right-panel"><h2>Edit item</h2>
    <label>Text<input value={element.content} onChange={(event) => onChange({ ...element, content: event.currentTarget.value })} /></label>
    <label>Color<input type="color" value={element.color ?? '#302925'} onChange={(event) => onChange({ ...element, color: event.currentTarget.value })} /></label>
    <button type="button" onClick={() => onDelete(element.id)}>Delete item</button>
  </aside>;
}
