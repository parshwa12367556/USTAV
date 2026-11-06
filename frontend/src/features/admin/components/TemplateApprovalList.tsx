import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
export type PendingTemplate = { id: string; name: string; vendor: string; status: string };
export function TemplateApprovalList({ templates, onApprove, onReject }: { templates: PendingTemplate[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return <ul className="approval-list">{templates.map((template) => <li key={template.id}>
    <div><strong>{template.name}</strong><span>{template.vendor}</span><StatusBadge status={template.status} /></div>
    <Button onClick={() => onApprove(template.id)}>Approve</Button><Button variant="quiet" onClick={() => onReject(template.id)}>Decline</Button>
  </li>)}</ul>;
}
