import type { BudgetCategory } from '../../../types/budget.types';
import { formatCurrency } from '../../../utils/formatCurrency';
export function BudgetOverview({ categories }: { categories: BudgetCategory[] }) {
  const allocated = categories.reduce((sum, item) => sum + item.allocated, 0);
  const spent = categories.reduce((sum, item) => sum + item.spent, 0);
  return <section className="budget-overview"><div><span>Total budget</span><strong>{formatCurrency(allocated)}</strong></div><div><span>Spent</span><strong>{formatCurrency(spent)}</strong></div><div><span>Remaining</span><strong>{formatCurrency(Math.max(0, allocated - spent))}</strong></div></section>;
}
