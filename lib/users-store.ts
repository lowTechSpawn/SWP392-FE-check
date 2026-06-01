/**
 * Client-side user store backed by localStorage.
 * Powers the Admin Account Creation, Role Assignment, and Editor gán workflow (BR-01).
 */

import { type Role } from './roles'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: Role
  status: 'Active' | 'Inactive'
  avatarUrl: string
  editorId?: string // for Mangaka, points to a Tantou Editor user id
}

const STORAGE_USERS_KEY = 'mangaflow_users'

export const SEED_USERS: User[] = [
  {
    id: 'U01',
    username: 'tanaka_mangaka',
    name: 'Tanaka Yuki',
    email: 'tanaka@mangaflow.com',
    role: 'Mangaka',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    editorId: 'U06'
  },
  {
    id: 'U02',
    username: 'oda_mangaka',
    name: 'Oda Kenji',
    email: 'oda@mangaflow.com',
    role: 'Mangaka',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    editorId: 'U07'
  },
  {
    id: 'U03',
    username: 'sato_assistant',
    name: 'Sato Takashi',
    email: 'sato@mangaflow.com',
    role: 'Assistant',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
  },
  {
    id: 'U04',
    username: 'suzuki_assistant',
    name: 'Suzuki Mei',
    email: 'suzuki@mangaflow.com',
    role: 'Assistant',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
  },
  {
    id: 'U05',
    username: 'watanabe_assistant',
    name: 'Watanabe Ren',
    email: 'watanabe@mangaflow.com',
    role: 'Assistant',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100'
  },
  {
    id: 'U06',
    username: 'nakamura_editor',
    name: 'Nakamura Takeshi',
    email: 'nakamura@mangaflow.com',
    role: 'Tantou Editor',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
  },
  {
    id: 'U07',
    username: 'aoi_editor',
    name: 'Watanabe Aoi',
    email: 'aoi@mangaflow.com',
    role: 'Tantou Editor',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100'
  },
  {
    id: 'U08',
    username: 'takahashi_board',
    name: 'Takahashi Hiroshi',
    email: 'takahashi@mangaflow.com',
    role: 'Editorial Board',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
  },
  {
    id: 'U09',
    username: 'matsumoto_board',
    name: 'Matsumoto Ken',
    email: 'matsumoto@mangaflow.com',
    role: 'Editorial Board',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100'
  },
  {
    id: 'U10',
    username: 'admin_system',
    name: 'Admin System',
    email: 'admin@mangaflow.com',
    role: 'Admin',
    status: 'Active',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100'
  }
]

export function loadUsers(): User[] {
  if (typeof window === 'undefined') return SEED_USERS
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(SEED_USERS))
      return SEED_USERS
    }
    return JSON.parse(raw) as User[]
  } catch {
    return SEED_USERS
  }
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))
}

// ---------- Public API ----------

export function getUsers(): User[] {
  return loadUsers()
}

export function getUserById(id: string): User | undefined {
  return loadUsers().find(u => u.id === id)
}

export function getUsersByRole(role: Role): User[] {
  return loadUsers().filter(u => u.role === role)
}

/**
 * BR-01: Admin creates a new account.
 * Username and Email must be unique.
 */
export function createUser(data: Omit<User, 'id' | 'status' | 'avatarUrl'>): User {
  const users = loadUsers()

  // Validate uniqueness
  const isUsernameExists = users.some(u => u.username.toLowerCase() === data.username.toLowerCase())
  if (isUsernameExists) {
    throw new Error(`Username "${data.username}" đã tồn tại trên hệ thống.`)
  }

  const isEmailExists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase())
  if (isEmailExists) {
    throw new Error(`Email "${data.email}" đã tồn tại trên hệ thống.`)
  }

  // Generate simple next ID
  const numericIds = users
    .map(u => parseInt(u.id.substring(1)))
    .filter(val => !isNaN(val))
  const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 11
  const nextId = `U${String(nextNum).padStart(2, '0')}`

  // Assign standard random avatar corresponding to gender/index
  const avatarIndex = nextNum % 50
  const avatarUrl = `https://xsgames.co/randomusers/assets/avatars/${nextNum % 2 === 0 ? 'male' : 'female'}/${avatarIndex}.jpg`

  const newUser: User = {
    ...data,
    id: nextId,
    status: 'Active',
    avatarUrl
  }

  users.push(newUser)
  saveUsers(users)
  return newUser
}

export function updateUserStatus(id: string, status: 'Active' | 'Inactive'): boolean {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return false

  users[idx].status = status
  saveUsers(users)
  return true
}

export function assignEditorToMangaka(mangakaId: string, editorId: string): boolean {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === mangakaId)
  if (idx === -1) return false

  if (users[idx].role !== 'Mangaka') {
    throw new Error('Chỉ có thể gán Editor cho tài khoản có vai trò Mangaka.')
  }

  // Validate editorId exists and is an Editor
  if (editorId) {
    const editor = users.find(u => u.id === editorId)
    if (!editor || editor.role !== 'Tantou Editor') {
      throw new Error('Tài khoản editor được gán không hợp lệ hoặc không phải là Tantou Editor.')
    }
  }

  users[idx].editorId = editorId || undefined
  saveUsers(users)
  return true
}
