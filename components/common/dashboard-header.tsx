'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  LogOut,
  ChevronDown,
  User
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { useNotifications } from '@/hooks/useNotifications'
import { useRole } from '@/context/RoleContext'
import { cn } from '@/lib/utils'

// Helper to format date relatively or short format
function formatRelativeTime(isoString: string) {
  const date = new Date(isoString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'vừa xong'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
}

export function DashboardHeader() {
  const { role } = useRole()
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; avatarUrl?: string } | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load from localStorage first
    const saved = localStorage.getItem('user-info')
    if (saved) {
      try {
        setUserInfo(JSON.parse(saved))
      } catch { }
    }

    // Fetch updated info from backend
    authService.getCurrentUser().then((user) => {
      if (user) {
        setUserInfo({
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl
        })
      }
    }).catch((err) => {
      console.warn("Failed to fetch current user profile on mount", err)
    })
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    markRead(id)
  }

  // Get icons matching notification types
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />
    }
  }

  // Role badges colors
  const roleBadges: Record<string, string> = {
    Mangaka: 'bg-primary/10 text-primary border-primary/20',
    Assistant: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    TantouEditor: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    EditorialBoard: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    EditorInChief: 'bg-red-500/10 text-red-600 border-red-500/20',
    Admin: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  }

  const handleLogout = async () => {
    await authService.logout()
    router.push('/login')
  }

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 sm:px-8 lg:px-10 sticky top-0 z-40">
      {/* Left section: Welcome context */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-extrabold tracking-tight text-muted-foreground capitalize">
          Bảng điều khiển
        </span>
        <span className="text-muted-foreground/30 text-xs">/</span>
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
          roleBadges[role] || 'bg-muted text-muted-foreground'
        )}>
          {role}
        </span>
      </div>

      {/* Right section: Notifications Bell & User Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all relative border border-transparent focus:outline-none",
              isOpen && "bg-muted text-foreground border-border/40"
            )}
            aria-label="Mở thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-card animate-in zoom-in duration-100">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Popup */}
          {isOpen && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl p-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-foreground">Thông báo & Cảnh báo</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={markAllRead}
                      className="p-1.5 text-[10px] font-bold text-primary hover:bg-primary/5 rounded-md transition-colors flex items-center gap-1"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                    </button>
                    <button
                      onClick={clearAll}
                      className="p-1.5 text-[10px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md transition-colors flex items-center gap-1"
                      title="Xóa tất cả"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa sạch
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border/65">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={(e) => !n.read && handleMarkAsRead(n.id, e)}
                      className={cn(
                        "p-4 flex gap-3 hover:bg-muted/40 cursor-pointer transition-colors relative group",
                        !n.read && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      {/* Icon indicator */}
                      <div className="mt-0.5 shrink-0">
                        {getIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1 pr-4">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight")}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-muted-foreground/80 flex items-center gap-0.5 shrink-0">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {n.message}
                        </p>
                      </div>

                      {/* Unread circle badge */}
                      {!n.read && (
                        <span className="absolute top-1/2 right-3.5 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/65 flex items-center justify-center mx-auto text-muted-foreground/40">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Tất cả đã hoàn tất!</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Không có thông báo mới cho {role} vào lúc này.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative flex items-center" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all relative border border-transparent focus:outline-none"
            aria-label="Menu hồ sơ người dùng"
          >
            {userInfo?.avatarUrl ? (
              <img
                src={userInfo.avatarUrl}
                alt={userInfo.name}
                className="w-8 h-8 rounded-md object-cover border border-border/60"
              />
            ) : (
              <div className="bg-primary/10 text-primary w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0">
                {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", isProfileOpen && "rotate-180")} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User info details */}
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-bold text-foreground truncate">{userInfo?.name || 'Đang tải...'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{userInfo?.email || ''}</p>
                <div className="mt-1.5">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider block text-center w-full",
                    roleBadges[role] || 'bg-muted text-muted-foreground'
                  )}>
                    {role}
                  </span>
                </div>
              </div>

              {/* Actions list */}
              <div className="pt-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    router.push('/dashboard/profile')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
