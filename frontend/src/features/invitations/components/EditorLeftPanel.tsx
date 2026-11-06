import type { InvitationTemplate } from '../../../types/invitation.types';
export function EditorLeftPanel({ templates, onChoose }: { templates: InvitationTemplate[]; onChoose: (template: InvitationTemplate) => void }) {
  return <aside className="editor-left-panel"><h2>Templates</h2>{templates.map((template) => <button type="button" key={template.id} onClick={() => onChoose(template)}>
    {template.previewUrl && <img src={template.previewUrl} alt="" loading="lazy" />}<span>{template.name}</span>
  </button>)}</aside>;
}
