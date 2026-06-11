'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRole } from '@/context/RoleContext'
import Image from 'next/image'
import {
  BookOpen,
  PencilLine,
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

function SidebarInner() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role, setRole } = useRole()
  const [isOpen, setIsOpen] = useState(false)
  const [showRoleSelector, setShowRoleSelector] = useState(false)

  const roles = ['Mangaka', 'Assistant', 'Tantou Editor', 'Editorial Board', 'Editor-in-Chief', 'Admin'] as const

  const menuItems = {
    Mangaka: [
      { label: 'Dashboard', href: '/dashboard/mangaka', icon: LayoutDashboard },
      { label: 'My Proposals', href: '/dashboard/series', icon: PencilLine },
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
      { label: 'Dashboard', href: '/dashboard/tantou-editor?tab=dashboard', icon: LayoutDashboard },
      { label: 'Series', href: '/dashboard/tantou-editor?tab=series', icon: BookOpen },
      { label: 'Proposal Review', href: '/dashboard/tantou-editor?tab=proposals', icon: ClipboardList },
      { label: 'Manuscripts', href: '/dashboard/tantou-editor?tab=manuscripts', icon: Layers },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    'Editorial Board': [
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'Review Proposals', href: '/dashboard/reviews', icon: PencilLine },
      { label: 'Reader Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Create Account', href: '/signup', icon: UserPlus },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    'Editor-in-Chief': [
      { label: 'Dashboard', href: '/dashboard/editor-in-chief', icon: LayoutDashboard },
      { label: 'Manga List', href: '/dashboard/manga-list', icon: BookOpen },
      { label: 'Review Proposals', href: '/dashboard/reviews', icon: PencilLine },
      { label: 'Ranking', href: '/dashboard/ranking', icon: Trophy },
    ],
    Admin: [
      { label: 'Account Management', href: '/dashboard/admin', icon: Users },
    ],
  }

  const currentLinks = menuItems[role] || []

  const handleRoleChange = (newRole: typeof roles[number]) => {
    setRole(newRole)
    setShowRoleSelector(false)

    // Redirect to the landing page of the new role
    switch (newRole) {
      case 'Admin':
        router.push('/dashboard/admin')
        break
      case 'Mangaka':
        router.push('/dashboard/mangaka')
        break
      case 'Assistant':
        router.push('/dashboard/assistant')
        break
      case 'Tantou Editor':
        router.push('/dashboard/tantou-editor')
        break
      case 'Editorial Board':
        router.push('/dashboard/manga-list')
        break
      case 'Editor-in-Chief':
        router.push('/dashboard/editor-in-chief')
        break
      default:
        router.push('/dashboard')
        break
    }
  }

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
              let isActive = pathname === item.href

              if (item.href.includes('?tab=')) {
                const urlObj = new URL(item.href, 'http://localhost')
                const tabParam = urlObj.searchParams.get('tab')
                const activeTab = searchParams.get('tab') || 'dashboard'
                isActive = pathname === urlObj.pathname && activeTab === tabParam
              }
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

import { Suspense } from 'react'

export function Sidebar() {
  return (
    <Suspense fallback={<div className="w-64 bg-card border-r border-border h-screen flex flex-col p-5"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-3/4"></div><div className="h-4 bg-muted rounded w-1/2"></div></div></div>}>
      <SidebarInner />
    </Suspense>
  )
}
