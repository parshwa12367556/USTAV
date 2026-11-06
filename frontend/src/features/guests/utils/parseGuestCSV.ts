import { parseCsv } from '../../../utils/csvParser';
import type { RSVPStatus } from '../../../types/guest.types';

export type ImportedGuest = {
  name: string;
  email?: string;
  phone?: string;
  group?: string;
  rsvpStatus: RSVPStatus;
};

export function parseGuestCsv(input: string): ImportedGuest[] {
  const [headerRow, ...rows] = parseCsv(input);
  if (!headerRow) return [];
  const headers = headerRow.map((value) => value.toLowerCase().replace(/[\s_-]/g, ''));
  const column = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0);
  const nameIndex = column('name', 'guestname');
  if (nameIndex === undefined) throw new Error('CSV must contain a Name column.');

  return rows.map((row, index) => {
    const name = row[nameIndex]?.trim();
    if (!name) throw new Error(`Guest name is missing on row ${index + 2}.`);
    const email = column('email');
    const phone = column('phone', 'mobile');
    const group = column('group', 'family', 'category');
    return {
      name,
      ...(email !== undefined && row[email] ? { email: row[email] } : {}),
      ...(phone !== undefined && row[phone] ? { phone: row[phone] } : {}),
      ...(group !== undefined && row[group] ? { group: row[group] } : {}),
      rsvpStatus: 'pending' as const,
    };
  });
}
