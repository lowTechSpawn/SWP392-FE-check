'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Role = 'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board' | 'Editor-in-Chief' | 'Admin'

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('Mangaka')

  useEffect(() => {
    const saved = localStorage.getItem('user-role') as Role
    if (saved && ['Mangaka', 'Assistant', 'Tantou Editor', 'Editorial Board', 'Editor-in-Chief', 'Admin'].includes(saved)) {
      setRoleState(saved)
    }
  }, [])

  const setRole = (newRole: Role) => {
    setRoleState(newRole)
    localStorage.setItem('user-role', newRole)
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
