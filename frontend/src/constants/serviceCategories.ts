export const serviceCategories = [
  'Venues',
  'Catering',
  'Photography',
  'Decoration',
  'Event planning',
  'Music & entertainment',
  'Makeup & styling',
  'Transport',
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];
