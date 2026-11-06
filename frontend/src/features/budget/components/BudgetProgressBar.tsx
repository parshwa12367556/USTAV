export function BudgetProgressBar({ spent, allocated, label = 'Budget used' }: { spent: number; allocated: number; label?: string }) {
  const percentage = allocated > 0 ? Math.min(100, Math.max(0, spent / allocated * 100)) : 0;
  return <div className="budget-progress"><div><span>{label}</span><span>{Math.round(percentage)}%</span></div><progress value={percentage} max={100} aria-label={label} /></div>;
}
