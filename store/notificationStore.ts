import { toast } from "sonner"

export interface AppNotification {
  id: string
  title: string
  message: string
  role: 'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board' | 'Editor-in-Chief' | 'All'
  read: boolean
  createdAt: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const STORAGE_KEY = 'mangaflow_notifications'

const SEED_NOTIFICATIONS: AppNotification[] = []

type Listener = (notifications: AppNotification[]) => void
const listeners = new Set<Listener>()

let currentNotifications: AppNotification[] = []

function loadNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return SEED_NOTIFICATIONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS))
      return SEED_NOTIFICATIONS
    }
    const parsed = JSON.parse(raw) as AppNotification[]
    return parsed.filter(n => !n.id.startsWith('n') || n.id.startsWith('NT'))
  } catch {
    return SEED_NOTIFICATIONS
  }
}

function saveNotifications(notifications: AppNotification[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  listeners.forEach(listener => listener(notifications))
}

// Initialize on first load
if (typeof window !== 'undefined') {
  currentNotifications = loadNotifications()
} else {
  currentNotifications = SEED_NOTIFICATIONS
}

export const notificationStore = {
  getNotifications(): AppNotification[] {
    if (typeof window !== 'undefined' && currentNotifications.length === 0) {
      currentNotifications = loadNotifications()
    }
    return currentNotifications
  },

  addNotification(
    title: string,
    message: string,
    role: AppNotification['role'],
    type: AppNotification['type'] = 'info'
  ) {
    const notifications = this.getNotifications()
    const newNotification: AppNotification = {
      id: `NT${String(notifications.length + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      title,
      message,
      role,
      read: false,
      createdAt: new Date().toISOString(),
      type,
    }
    
    const updated = [newNotification, ...notifications]
    currentNotifications = updated
    saveNotifications(updated)

    // Trigger Sonner toast on client side if it targets the current active role or is for 'All'
    if (typeof window !== 'undefined') {
      const activeRole = localStorage.getItem('user-role')
      if (role === 'All' || role === activeRole) {
        const toastFn = toast[type] || toast
        toastFn(title, {
          description: message,
          duration: 5000,
        })
      }
    }
    
    return newNotification
  },

  markRead(id: string) {
    const notifications = this.getNotifications()
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    currentNotifications = updated
    saveNotifications(updated)
  },

  markAllRead(role: string) {
    const notifications = this.getNotifications()
    const updated = notifications.map(n => (n.role === role || n.role === 'All') ? { ...n, read: true } : n)
    currentNotifications = updated
    saveNotifications(updated)
  },

  clearAll(role: string) {
    const notifications = this.getNotifications()
    const updated = notifications.filter(n => n.role !== role && n.role !== 'All')
    currentNotifications = updated
    saveNotifications(updated)
  },

  subscribe(listener: Listener) {
    listeners.add(listener)
    listener(this.getNotifications())
    return () => {
      listeners.delete(listener)
    }
  }
}
