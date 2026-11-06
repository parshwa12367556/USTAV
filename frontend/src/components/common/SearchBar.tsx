import type { InputHTMLAttributes } from 'react';

type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { onSearch?: (value: string) => void };
export function SearchBar({ onSearch, onChange, ...props }: SearchBarProps) {
  return <input {...props} type="search" className={`search-bar ${props.className ?? ''}`} onChange={(event) => {
    onChange?.(event);
    onSearch?.(event.currentTarget.value);
  }} />;
}
