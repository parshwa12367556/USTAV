import type { Invitation } from '../../../types/invitation.types';
import { StatusBadge } from '../../../components/common/StatusBadge';
export function InvitationList({ invitations, onOpen }: { invitations: Invitation[]; onOpen?: (item: Invitation) => void }) {
  return <ul className="invitation-list">{invitations.map((item) => <li key={item.id}>
    <button type="button" onClick={() => onOpen?.(item)}><strong>{item.title}</strong><StatusBadge status={item.status} /></button>
  </li>)}</ul>;
}
