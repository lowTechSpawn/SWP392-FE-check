"use client"

import { SignupForm } from "@/components/signup-form"
import { RoleProvider } from '@/context/RoleContext'
import { Sidebar } from '@/components/common/sidebar'

export default function SignupPage() {
  return (
    <RoleProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Right Main Page Content */}
        <main className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 overflow-y-auto bg-muted/30">
            <div className="w-full max-w-lg">
              <SignupForm />
            </div>
          </div>
        </main>
      </div>
    </RoleProvider>
  )
}
