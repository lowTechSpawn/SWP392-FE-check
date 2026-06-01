export const roles = {
  MANGAKA: 'Mangaka',
  ASSISTANT: 'Assistant',
  TANTOU_EDITOR: 'Tantou Editor',
  EDITORIAL_BOARD: 'Editorial Board',
  EDITOR_IN_CHIEF: 'Editor-in-Chief',
  ADMIN: 'Admin',
} as const

export type Role = (typeof roles)[keyof typeof roles]

export const roleLabels: Record<Role, string> = {
  [roles.MANGAKA]: 'Mangaka',
  [roles.ASSISTANT]: 'Assistant',
  [roles.TANTOU_EDITOR]: 'Tantou Editor',
  [roles.EDITORIAL_BOARD]: 'Editorial Board',
  [roles.EDITOR_IN_CHIEF]: 'Editor-in-Chief',
  [roles.ADMIN]: 'Admin',
}
