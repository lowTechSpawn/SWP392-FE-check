'use client'

import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2.5 self-center font-bold text-2xl tracking-tight">
          <Image
            src="/logo.png"
            alt="MangaFlow Logo"
            width={150}
            height={150}
            className="object-contain"
          />
          MangaFlow
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
