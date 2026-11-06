import type { InvitationElement } from '../types/editor.types';
export function EditorCanvas({ elements, selectedId, onSelect }: { elements: InvitationElement[]; selectedId?: string; onSelect: (id: string) => void }) {
  return <div className="invitation-editor-canvas" role="region" aria-label="Invitation preview">
    {elements.map((element) => <button key={element.id} type="button" aria-pressed={selectedId === element.id} onClick={() => onSelect(element.id)} style={{ position: 'absolute', left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, height: `${element.height}%`, color: element.color, fontSize: element.fontSize }}>
      {element.type === 'image' ? <img src={element.content} alt="" /> : element.content}
    </button>)}
  </div>;
}
