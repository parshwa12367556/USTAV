type RadioOption = { label: string; value: string; disabled?: boolean };
export function RadioGroup({ name, value, options, onChange, ariaLabel }: { name: string; value: string; options: RadioOption[]; onChange: (value: string) => void; ariaLabel?: string }) {
  return <div className="radio-group" role="radiogroup" aria-label={ariaLabel}>
    {options.map((option) => <label key={option.value}>
      <input type="radio" name={name} value={option.value} checked={value === option.value} disabled={option.disabled} onChange={() => onChange(option.value)} />
      <span>{option.label}</span>
    </label>)}
  </div>;
}
