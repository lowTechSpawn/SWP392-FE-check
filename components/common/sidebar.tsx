'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRole } from '@/context/RoleContext'
import Image from 'next/image'
import {
  BookOpen,
  PenTool,
  Layers,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  FileSpreadsheet,
  UserPlus,
  LayoutDashboard,
  Trophy,
  Users
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, setRole } = useRole()
  const [isOpen, setIsOpen] = useState(false)
  const [showRoleSelector, setShowRoleSelector] = useState(false)

  const roles = ['Mangaka', 'Assistant', 'Tantou Editor', 'Editorial Board', 'Editor-in-Chief', 'Admin'] as const

  const menuItems = {
    Mangaka: [
      { label: 'Dashboard', href: '/dashboard/mangaka', icon: LayoutDashboard },
      { label: 'My Proposals', href: '/dashboard/series', icon: PenTool },
      { label: 'New Proposal', href: '/dashboard/series/new', icon: UserPlus },
      { label: 'Manuscripts', href: '/dashboard/manuscripts', icon: Layers },
      { label: 'Chapter&Tasks', href: '/dashboard/chapters', icon: ClipboardList },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    Assistant: [
      { label: 'Dashboard', href: '/dashboard/assistant', icon: LayoutDashboard },
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'My Tasks', href: '/dashboard/chapters', icon: ClipboardList },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    'Tantou Editor': [
      { label: 'Dashboard', href: '/dashboard/tantou-editor', icon: LayoutDashboard },
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'Assign Tasks', href: '/dashboard/chapters', icon: ClipboardList },
      { label: 'Review Drafts', href: '/dashboard/manuscripts', icon: Layers },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    'Editorial Board': [
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'Review Proposals', href: '/dashboard/reviews', icon: PenTool },
      { label: 'Reader Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Create Account', href: '/signup', icon: UserPlus },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    'Editor-in-Chief': [
      { label: 'Dashboard', href: '/dashboard/editor-in-chief', icon: LayoutDashboard },
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'Review Proposals', href: '/dashboard/reviews', icon: PenTool },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    Admin: [
      { label: 'Account Management', href: '/dashboard/admin', icon: Users },
    ],
  }

  const currentLinks = menuItems[role] || []

  const handleLogout = () => {
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between bg-card text-foreground p-5 border-r border-border">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <Image
            src="/logo.svg"
            alt="MangaFlow Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            MangaFlow
          </span>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 mb-2">
            Main Features
          </p>
          <nav className="space-y-1">
            {currentLinks.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all group ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Profile and Role Switcher */}
      <div className="space-y-4 pt-4 border-t border-border">
        {/* Interactive Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="w-full flex items-center justify-between p-2.5 bg-muted rounded-xl hover:bg-muted/80 border border-border/50 text-left text-xs transition-all focus:outline-none"
          >
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Active Role</span>
              <p className="font-bold text-foreground leading-tight">{role}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showRoleSelector ? 'rotate-180' : ''}`} />
          </button>

          {showRoleSelector && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-1.5 bg-card border border-border rounded-xl shadow-xl p-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r)
                    setShowRoleSelector(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted transition-colors ${role === r ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-1.5 bg-muted/40 border border-border/30 rounded-xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
              U
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Demo User</p>
              <p className="text-[10px] text-muted-foreground truncate">demo@mangaflow.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="MangaFlow Logo"
            width={28}
            height={28}
            className="object-contain"
          />
          <span className="font-extrabold text-sm tracking-tight text-foreground">
            MangaFlow
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer content */}
          <aside className="relative w-64 h-full flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (Permanent left) */}
      <aside className="hidden lg:flex lg:w-64 lg:h-screen lg:flex-col lg:sticky lg:top-0 lg:z-30 shrink-0">
        <SidebarContent />
      </aside>
    </>
  )
}
