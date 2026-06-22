/**
 * Client-side user store backed by localStorage.
 * Powers the Admin Account Creation, Role Assignment, and Editor gán workflow (BR-01).
 */

import { type Role } from './roles'
import { type User } from '@/types/user'


const STORAGE_USERS_KEY = 'mangaflow_users'

export const SEED_USERS: User[] = []

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
  const isUsernameExists = users.some(u => (u.username || '').toLowerCase() === (data.username || '').toLowerCase())
  if (isUsernameExists && data.username) {
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
