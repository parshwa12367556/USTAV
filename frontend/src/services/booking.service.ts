
import { delay } from "./mock-data";
import { mockBookings } from "./mock-data";
import type { Booking } from "@/types";

export const bookingService = {
  async list(familyId: string): Promise<Booking[]> {
    await delay(600);
    return mockBookings.filter((b) => b.familyId === familyId);
  },
  async get(id: string): Promise<Booking | null> {
    await delay(400);
    return mockBookings.find((b) => b.id === id) || null;
  },
  async createRequest(data: any): Promise<Booking> {
    await delay(800);
    return { id: "bk_new", bookingReference: "UTS-" + Date.now(), familyId: "fam_001", status: "request_submitted", paymentStatus: "pending", ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Booking;
  },
  async updateStatus(id: string, status: string): Promise<Booking> {
    await delay(700);
    return { id, status } as Booking;
  },
};

