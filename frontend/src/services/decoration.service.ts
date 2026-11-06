
import { delay } from "./mock-data";
import { mockDecorators } from "./mock-data";
import type { Decorator } from "@/types";

export const decorationService = {
  async list(filters?: any): Promise<Decorator[]> {
    await delay(600);
    return [...mockDecorators];
  },
  async get(id: string): Promise<Decorator | null> {
    await delay(400);
    return mockDecorators.find((d) => d.id === id) || null;
  },
  async requestQuotation(data: any): Promise<any> {
    await delay(800);
    return { id: "qr_new", status: "open", ...data, createdAt: new Date().toISOString() };
  },
};

