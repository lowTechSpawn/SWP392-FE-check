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
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/1.jpg',
    editorId: 'U06'
  },
  {
    id: 'U02',
    username: 'oda_mangaka',
    name: 'Oda Kenji',
    email: 'oda@mangaflow.com',
    role: 'Mangaka',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/2.jpg',
    editorId: 'U07'
  },
  {
    id: 'U03',
    username: 'suzuki_assistant',
    name: 'Suzuki Mei',
    email: 'suzuki@mangaflow.com',
    role: 'Assistant',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/3.jpg'
  },
  {
    id: 'U04',
    username: 'yamada_assistant',
    name: 'Yamada Riku',
    email: 'yamada@mangaflow.com',
    role: 'Assistant',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/4.jpg'
  },
  {
    id: 'U05',
    username: 'sato_assistant',
    name: 'Sato Takashi',
    email: 'sato@mangaflow.com',
    role: 'Assistant',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/5.jpg'
  },
  {
    id: 'U06',
    username: 'nakamura_editor',
    name: 'Nakamura Takeshi',
    email: 'nakamura@mangaflow.com',
    role: 'TantouEditor',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/6.jpg'
  },
  {
    id: 'U07',
    username: 'watanabe_editor',
    name: 'Watanabe Aoi',
    email: 'watanabe@mangaflow.com',
    role: 'TantouEditor',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/7.jpg'
  },
  {
    id: 'U08',
    username: 'takahashi_board',
    name: 'Takahashi Ken',
    email: 'takahashi@mangaflow.com',
    role: 'EditorialBoard',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/8.jpg'
  },
  {
    id: 'U09',
    username: 'matsumoto_board',
    name: 'Matsumoto Ren',
    email: 'matsumoto@mangaflow.com',
    role: 'EditorialBoard',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/9.jpg'
  },
  {
    id: 'U10',
    username: 'admin_system',
    name: 'System Admin',
    email: 'admin@mangaflow.com',
    role: 'Admin',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/10.jpg'
  },
  {
    id: 'U11',
    username: 'temp_admin',
    name: 'Temporary Admin',
    email: 'tempadmin@gmail.com',
    role: 'Admin',
    status: 'Active',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/male/11.jpg'
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
    const parsed = JSON.parse(raw) as User[]
    if (parsed.length === 0 && SEED_USERS.length > 0) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(SEED_USERS))
      return SEED_USERS
    }
    // Dynamically merge missing SEED_USERS into parsed
    let hasChanges = false
    SEED_USERS.forEach(su => {
      const exists = parsed.some(u => u.email.toLowerCase() === su.email.toLowerCase() || u.id === su.id)
      if (!exists) {
        parsed.push(su)
        hasChanges = true
      }
    })
    if (hasChanges) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(parsed))
    }
    return parsed
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
    if (!editor || editor.role !== 'TantouEditor') {
      throw new Error('Tài khoản editor được gán không hợp lệ hoặc không phải là TantouEditor.')
    }
  }

  users[idx].editorId = editorId || undefined
  saveUsers(users)
  return true
}
