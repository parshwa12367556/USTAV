
import { delay } from "./mock-data";
import { mockNotifications } from "./mock-data";
import type { Notification } from "@/types";

export const notificationService = {
  async list(userId: string): Promise<Notification[]> {
    await delay(500);
    return [...mockNotifications];
  },
  async unreadCount(userId: string): Promise<number> {
    await delay(400);
    return mockNotifications.filter((n) => !n.read).length;
  },
  async markRead(id: string): Promise<{ success: boolean }> {
    await delay(400);
    return { success: true };
  },
  async markAllRead(userId: string): Promise<{ success: boolean }> {
    await delay(400);
    return { success: true };
  },
};

