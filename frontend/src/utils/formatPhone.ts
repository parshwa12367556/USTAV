export function formatPhone(value: string, countryCode = '+91'): string {
  const digits = value.replace(/\D/g, '');
  const national = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
  if (national.length === 10) return `${countryCode} ${national.slice(0, 5)} ${national.slice(5)}`;
  return value.trim();
}
