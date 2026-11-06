
import { delay } from "./mock-data";
import { mockFamily } from "./mock-data";
import type { FamilyWorkspace } from "@/types";

export const familyService = {
  async getMyFamily(): Promise<FamilyWorkspace> {
    await delay(500);
    return { ...mockFamily };
  },
  async updateFamily(data: Partial<FamilyWorkspace>): Promise<FamilyWorkspace> {
    await delay(600);
    return { ...mockFamily, ...data };
  },
  async addMember(data: { name: string; mobile: string; email?: string; role: string }): Promise<any> {
    await delay(600);
    return { id: "m_new", ...data, isPrimary: false, joinedAt: new Date().toISOString() };
  },
};

