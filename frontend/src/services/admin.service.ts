
import { delay } from "./mock-data";
import { mockAdminStats } from "./mock-data";
import type { DashboardStats } from "@/types";

export const adminService = {
  async getStats(): Promise<DashboardStats> {
    await delay(600);
    return { ...mockAdminStats };
  },
  async listUsers(): Promise<any[]> {
    await delay(600);
    return [];
  },
  async listFamilies(): Promise<any[]> {
    await delay(600);
    return [];
  },
  async listVendors(): Promise<any[]> {
    await delay(600);
    return [];
  },
  async verifyVendor(id: string, approved: boolean, message?: string): Promise<{ success: boolean }> {
    await delay(700);
    return { success: true };
  },
  async listBookings(): Promise<any[]> {
    await delay(600);
    return [];
  },
  async listPayments(): Promise<any[]> {
    await delay(600);
    return [];
  },
};

