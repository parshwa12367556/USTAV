import { useEffect, useRef } from 'react';
export function OTPInput({ value, onChange, length = 6, disabled = false, label = 'Verification code' }: { value: string; onChange: (value: string) => void; length?: number; disabled?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!disabled) ref.current?.focus(); }, [disabled]);
  return <label className="otp-input"><span>{label}</span>
    <input ref={ref} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={length} value={value} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value.replace(/\D/g, '').slice(0, length))} aria-label={label} />
  </label>;
}
