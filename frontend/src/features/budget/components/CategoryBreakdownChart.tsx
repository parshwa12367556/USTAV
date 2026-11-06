import { PieChart } from '../../../components/charts/PieChart';
import type { BudgetCategory } from '../../../types/budget.types';
export function CategoryBreakdownChart({ categories }: { categories: BudgetCategory[] }) {
  const colors = ['#944b56', '#bd8f4e', '#667968', '#74628f', '#527b8b'];
  return <PieChart label="Budget allocation by category" values={categories.map((category, index) => ({ label: category.name, value: category.allocated, color: category.color ?? colors[index % colors.length] }))} />;
}
