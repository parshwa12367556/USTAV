
import { delay } from "./mock-data";
import { mockVenues } from "./mock-data";
import type { Venue } from "@/types";

export const venueService = {
  async list(filters?: any): Promise<Venue[]> {
    await delay(600);
    let list = [...mockVenues];
    if (filters?.city) list = list.filter((v) => v.city.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters?.type) list = list.filter((v) => v.type === filters.type);
    return list;
  },
  async get(id: string): Promise<Venue | null> {
    await delay(400);
    return mockVenues.find((v) => v.id === id) || null;
  },
  async requestQuotation(data: any): Promise<any> {
    await delay(800);
    return { id: "qr_new", status: "open", ...data, createdAt: new Date().toISOString() };
  },
};

