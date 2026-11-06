import type { InputHTMLAttributes } from 'react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string };
export function Checkbox({ label, id, className = '', ...props }: CheckboxProps) {
  const input = <input {...props} id={id} type="checkbox" className={`checkbox ${className}`} />;
  return label ? <label className="checkbox-field">{input}<span>{label}</span></label> : input;
}
