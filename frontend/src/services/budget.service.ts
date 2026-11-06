
import { delay } from "./mock-data";
import { mockBudgetItems, mockBudgetSummary } from "./mock-data";
import type { BudgetItem, BudgetSummary } from "@/types";

export const budgetService = {
  async list(familyId: string): Promise<BudgetItem[]> {
    await delay(600);
    return mockBudgetItems.filter((b) => b.familyId === familyId);
  },
  async summary(familyId: string): Promise<BudgetSummary> {
    await delay(500);
    return { ...mockBudgetSummary };
  },
  async create(input: any): Promise<BudgetItem> {
    await delay(700);
    return { id: "bd_new", familyId: "fam_001", ...input, createdAt: new Date().toISOString() } as BudgetItem;
  },
  async update(id: string, data: any): Promise<BudgetItem> {
    await delay(600);
    return { id, ...data } as BudgetItem;
  },
  async remove(id: string): Promise<{ success: boolean }> {
    await delay(600);
    return { success: true };
  },
};

