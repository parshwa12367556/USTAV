export function BarChart({ values, label }: { values: { label: string; value: number; color?: string }[]; label: string }) {
  const max = Math.max(1, ...values.map((item) => item.value));
  return <div className="bar-chart" role="img" aria-label={label}>
    {values.map((item) => <div className="bar-chart__item" key={item.label}>
      <span>{item.label}</span><div><i style={{ display: 'block', width: `${Math.max(0, item.value / max) * 100}%`, background: item.color ?? 'var(--rose, #944b56)' }} /></div><strong>{item.value}</strong>
    </div>)}
  </div>;
}
