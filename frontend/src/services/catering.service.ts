
import { delay } from "./mock-data";
import { mockCaterers } from "./mock-data";
import type { Caterer } from "@/types";

export const cateringService = {
  async list(filters?: any): Promise<Caterer[]> {
    await delay(600);
    return [...mockCaterers];
  },
  async get(id: string): Promise<Caterer | null> {
    await delay(400);
    return mockCaterers.find((c) => c.id === id) || null;
  },
  async estimateQuote(lines: any[]): Promise<{ subtotal: number; tax: number; discount: number; total: number }> {
    await delay(600);
    const subtotal = lines.reduce((s, l) => s + (l.amount || 0), 0);
    const tax = Math.round(subtotal * 0.18);
    const discount = 0;
    return { subtotal, tax, discount, total: subtotal + tax - discount };
  },
  async requestQuotation(data: any): Promise<any> {
    await delay(800);
    return { id: "qr_new", status: "open", ...data, createdAt: new Date().toISOString() };
  },
};

