
import { delay } from "./mock-data";
import { mockGuests } from "./mock-data";
import type { Guest, CreateGuestInput } from "@/types";

export const guestService = {
  async list(familyId: string): Promise<Guest[]> {
    await delay(500);
    return mockGuests.filter((g) => g.familyId === familyId);
  },
  async get(id: string): Promise<Guest | null> {
    await delay(400);
    return mockGuests.find((g) => g.id === id) || null;
  },
  async create(input: CreateGuestInput): Promise<Guest> {
    await delay(700);
    return { id: "g_new", ...input, rsvpStatus: "pending", attendingCount: input.attendingCount || 1, createdAt: new Date().toISOString() } as Guest;
  },
  async update(id: string, data: Partial<Guest>): Promise<Guest> {
    await delay(600);
    return { id, ...data } as Guest;
  },
  async remove(id: string): Promise<{ success: boolean }> {
    await delay(600);
    return { success: true };
  },
  async importCsv(file: File): Promise<{ imported: number; duplicates: number; errors: string[] }> {
    await delay(1200);
    return { imported: 0, duplicates: 0, errors: [] };
  },
};

