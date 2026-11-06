
import { delay } from "./mock-data";
import { mockEvents } from "./mock-data";
import type { Event, CreateEventInput, CreateFunctionInput, EventFunction } from "@/types";

export const eventService = {
  async list(): Promise<Event[]> {
    await delay(500);
    return [...mockEvents];
  },
  async get(id: string): Promise<Event | null> {
    await delay(400);
    return mockEvents.find((e) => e.id === id) || null;
  },
  async create(input: CreateEventInput): Promise<Event> {
    await delay(700);
    const ev: Event = {
      id: "evt_new", familyId: "fam_001", ...input, status: "planning",
      totalBudget: input.totalBudget || 0, functions: [], coverImage: undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    return ev;
  },
  async update(id: string, data: Partial<Event>): Promise<Event> {
    await delay(600);
    return { id, ...data } as Event;
  },
  async remove(id: string): Promise<{ success: boolean }> {
    await delay(600);
    return { success: true };
  },
  async createFunction(input: CreateFunctionInput): Promise<EventFunction> {
    await delay(700);
    return { id: "fn_new", ...input, status: "planned", createdAt: new Date().toISOString() } as EventFunction;
  },
};

