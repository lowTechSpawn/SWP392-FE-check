'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRole } from '@/context/RoleContext'

export default function DashboardRedirectPage() {
  const router = useRouter()
  const { role } = useRole()

  useEffect(() => {
    // Read directly from localStorage synchronously to avoid race condition with RoleProvider's mount state transition
    const activeRole = (typeof window !== 'undefined' ? localStorage.getItem('user-role') : null) || role

    switch (activeRole) {
      case 'Admin':
        router.replace('/dashboard/admin')
        break
      case 'Mangaka':
        router.replace('/dashboard/mangaka')
        break
      case 'Assistant':
        router.replace('/dashboard/assistant')
        break
      case 'Tantou Editor':
        router.replace('/dashboard/tantou-editor')
        break
      case 'Editorial Board':
        router.replace('/dashboard/manga-list')
        break
      case 'Editor-in-Chief':
        router.replace('/dashboard/editor-in-chief')
        break
      default:
        router.replace('/dashboard/manga-list')
        break
    }
  }, [role, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-sm text-muted-foreground animate-pulse">Redirecting to your dashboard...</p>
    </div>
  )
}


