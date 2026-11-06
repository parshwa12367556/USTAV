import { Button } from '../../../components/ui/Button';
export type VerificationRequest = { id: string; businessName: string; ownerName: string; submittedAt: string; documents: string[] };
export function VendorVerificationPanel({ requests, onReview }: { requests: VerificationRequest[]; onReview: (id: string, approved: boolean) => void }) {
  return <div className="verification-list">{requests.map((request) => <article key={request.id}>
    <h3>{request.businessName}</h3><p>{request.ownerName} · Submitted {request.submittedAt}</p>
    <ul>{request.documents.map((document) => <li key={document}>{document}</li>)}</ul>
    <Button onClick={() => onReview(request.id, true)}>Verify</Button>
    <Button variant="danger" onClick={() => onReview(request.id, false)}>Decline</Button>
  </article>)}</div>;
}
