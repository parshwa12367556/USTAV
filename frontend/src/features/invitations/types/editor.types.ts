export type InvitationElement = {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color?: string;
  fontSize?: number;
};

export type InvitationDesign = {
  id: string;
  templateId: string;
  title: string;
  elements: InvitationElement[];
};
