import { useState, type FormEvent } from 'react';
import type { RSVPResponse } from '../../../types/rsvp.types';
export function GuestRSVPForm({ guestId, invitationToken, onSubmit }: { guestId: string; invitationToken: string; onSubmit: (response: RSVPResponse) => void }) {
  const [status, setStatus] = useState<RSVPResponse['status']>('attending');
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ guestId, invitationToken, status, plusOnes: status === 'attending' ? plusOnes : 0, dietaryNotes: dietaryNotes.trim() || undefined, functionIds: [] }); };
  return <form className="rsvp-form" onSubmit={submit}>
    <fieldset><legend>Will you be joining us?</legend><label><input type="radio" name="rsvp" checked={status === 'attending'} onChange={() => setStatus('attending')} />Joyfully accepts</label><label><input type="radio" name="rsvp" checked={status === 'declined'} onChange={() => setStatus('declined')} />Regretfully declines</label></fieldset>
    {status === 'attending' && <><label>Additional guests<input type="number" min="0" max="10" value={plusOnes} onChange={(event) => setPlusOnes(Number(event.currentTarget.value))} /></label><label>Dietary requirements<textarea value={dietaryNotes} onChange={(event) => setDietaryNotes(event.currentTarget.value)} /></label></>}
    <button type="submit">Send RSVP</button>
  </form>;
}
