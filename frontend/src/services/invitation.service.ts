
import { delay } from "./mock-data";
import { mockInvitationTemplates, mockInvitations } from "./mock-data";
import type { InvitationTemplate, Invitation } from "@/types";

export const invitationService = {
  async listTemplates(filters?: { category?: string; freeOnly?: boolean }): Promise<InvitationTemplate[]> {
    await delay(500);
    let list = [...mockInvitationTemplates];
    if (filters?.category) list = list.filter((t) => t.category === filters.category);
    if (filters?.freeOnly) list = list.filter((t) => t.isFree);
    return list;
  },
  async getTemplate(id: string): Promise<InvitationTemplate | null> {
    await delay(400);
    return mockInvitationTemplates.find((t) => t.id === id) || null;
  },
  async listInvitations(): Promise<Invitation[]> {
    await delay(500);
    return [...mockInvitations];
  },
  async getInvitation(id: string): Promise<Invitation | null> {
    await delay(400);
    return mockInvitations.find((i) => i.id === id) || null;
  },
  async save(config: any): Promise<Invitation> {
    await delay(700);
    return { id: "inv_new", familyId: "fam_001", eventId: "evt_001", name: "New Invitation", templateId: "tpl_001", config, status: "draft", recipientCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Invitation;
  },
  async publish(id: string): Promise<Invitation> {
    await delay(600);
    return { ...mockInvitations[0], id, status: "published" } as Invitation;
  },
};

