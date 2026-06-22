export const roles = {
  MANGAKA: 'Mangaka',
  ASSISTANT: 'Assistant',
  TANTOU_EDITOR: 'TantouEditor',
  EDITORIAL_BOARD: 'EditorialBoard',
  EDITOR_IN_CHIEF: 'EditorInChief',
  ADMIN: 'Admin',
} as const;

export type Role = typeof roles[keyof typeof roles];
