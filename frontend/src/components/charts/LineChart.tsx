export function LineChart({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => `${values.length < 2 ? 50 : index * 100 / (values.length - 1)},${100 - value / max * 90}`).join(' ');
  return <svg className="line-chart" role="img" aria-label={label} viewBox="0 0 100 100" preserveAspectRatio="none">
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
  </svg>;
}
