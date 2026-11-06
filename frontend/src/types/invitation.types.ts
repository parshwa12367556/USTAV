export type InvitationStatus = 'draft' | 'sent' | 'published';

export type InvitationTemplate = {
  id: string;
  name: string;
  category: string;
  previewUrl?: string;
  price: number;
};

export type Invitation = {
  id: string;
  eventId: string;
  templateId: string;
  title: string;
  status: InvitationStatus;
  shareUrl?: string;
};
