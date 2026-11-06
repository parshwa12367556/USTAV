import type { InvitationTemplate } from '../../../types/invitation.types';
import { PriceDisplay } from '../../../components/common/PriceDisplay';
export function TemplateCard({ template, onChoose }: { template: InvitationTemplate; onChoose?: (template: InvitationTemplate) => void }) {
  return <article className="template-card">{template.previewUrl && <img src={template.previewUrl} alt={`${template.name} invitation preview`} loading="lazy" />}
    <h3>{template.name}</h3><span>{template.category}</span><PriceDisplay amount={template.price} />
    {onChoose && <button type="button" onClick={() => onChoose(template)}>Use template</button>}
  </article>;
}
