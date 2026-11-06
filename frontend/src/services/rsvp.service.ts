
import { delay } from "./mock-data";
import { mockRsvpStats } from "./mock-data";
import type { RsvpStats } from "@/types";

export const rsvpService = {
  async stats(eventId: string): Promise<RsvpStats> {
    await delay(500);
    return { ...mockRsvpStats };
  },
  async list(eventId: string): Promise<any[]> {
    await delay(500);
    return [];
  },
  async submit(data: { invitationId: string; functionId: string; status: string; attendingCount: number; adultCount: number; childCount: number; dietaryPreferences?: string }): Promise<any> {
    await delay(800);
    return { id: "rsvp_new", ...data, respondedAt: new Date().toISOString() };
  },
  async reminders(guestIds: string[]): Promise<{ sent: number }> {
    await delay(800);
    return { sent: guestIds.length };
  },
};

