import type { InvitationTemplate } from '../../../types/invitation.types';
import { TemplateCard } from './TemplateCard';
export function TemplateGrid({ templates, onChoose }: { templates: InvitationTemplate[]; onChoose?: (template: InvitationTemplate) => void }) {
  return <div className="template-grid">{templates.map((template) => <TemplateCard key={template.id} template={template} onChoose={onChoose} />)}</div>;
}
