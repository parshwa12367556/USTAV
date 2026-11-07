import { apiClient } from '../../../services/api/apiClient';

export type BudgetCategory = {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color?: string;
};

export type EventBudget = {
  eventId: string;
  budget: number;
  spent: number;
  categories: BudgetCategory[];
};

export type CreateBudgetCategoryInput = {
  name: string;
  allocated: number;
  color?: string;
};

export type CreateExpenseInput = {
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  paid: boolean;
};

export const budgetApi = {
  async getForEvent(eventId: string): Promise<EventBudget> {
    const response = await apiClient.get<EventBudget>(
      `/budget/events/${encodeURIComponent(eventId)}/budget`,
    );
    return response.data;
  },
  async createCategory(eventId: string, input: CreateBudgetCategoryInput): Promise<BudgetCategory> {
    const response = await apiClient.post<BudgetCategory>(
      `/budget/events/${encodeURIComponent(eventId)}/budget/categories`,
      input,
    );
    return response.data;
  },
  async createExpense(eventId: string, input: CreateExpenseInput): Promise<void> {
    await apiClient.post(
      `/budget/events/${encodeURIComponent(eventId)}/expenses`,
      input,
    );
  },
};
