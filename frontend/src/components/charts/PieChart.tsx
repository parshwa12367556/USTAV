export function PieChart({ values, label }: { values: { label: string; value: number; color: string }[]; label: string }) {
  const total = values.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  let cursor = 0;
  const segments = values.map((item) => {
    const start = cursor;
    cursor += total ? Math.max(0, item.value) / total * 100 : 0;
    return `${item.color} ${start}% ${cursor}%`;
  });
  return <div className="pie-chart" role="img" aria-label={label} style={{ background: `conic-gradient(${segments.join(', ') || '#eee 0 100%'})` }}>
    {values.map((item) => <span key={item.label}>{item.label}: {item.value}</span>)}
  </div>;
}
