export function EditorTopToolbar({ title, onTitleChange, onSave, onPreview, saving = false }: { title: string; onTitleChange: (value: string) => void; onSave: () => void; onPreview: () => void; saving?: boolean }) {
  return <header className="editor-toolbar"><label>Invitation title<input value={title} onChange={(event) => onTitleChange(event.currentTarget.value)} /></label>
    <button type="button" onClick={onPreview}>Preview</button><button type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save design'}</button>
  </header>;
}
