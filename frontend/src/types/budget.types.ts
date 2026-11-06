export type BudgetCategory = {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color?: string;
};

export type Expense = {
  id: string;
  eventId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  paid: boolean;
};
