import type { SelectHTMLAttributes } from 'react';

export type SelectOption = { label: string; value: string; disabled?: boolean };
type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { options: SelectOption[]; placeholder?: string };
export function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  return <select {...props} className={`select ${className}`}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
  </select>;
}
