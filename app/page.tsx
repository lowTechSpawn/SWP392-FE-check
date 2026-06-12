'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  CheckCircle, 
  BarChart3, 
  Layers, 
  PencilLine, 
  ClipboardList, 
  ShieldAlert,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'mangaka' | 'assistant' | 'editor' | 'board'>('mangaka')

  const rolesDetails = {
    mangaka: {
      title: 'Mangaka (Creator)',
      subtitle: 'Bring your stories to life',
      desc: 'Submit new series proposals, upload chapter manuscripts, and coordinate directly with your assigned Tantou Editor.',
      features: [
        'Pitch new series with genre, cycle, and synopsis',
        'Submit new manuscript drafts (PDF/ZIP)',
        'Track version history and editor feedback cycles',
        'Collaborate with assistants on tasks'
      ],
      color: 'from-purple-500 to-indigo-600',
      badge: 'Creator Portal'
    },
    assistant: {
      title: 'Assistant (Artist)',
      subtitle: 'Focus on the artwork details',
      desc: 'Pick up page-specific drawing, inking, or background tasks assigned by editors. Submit your progress in real-time.',
      features: [
        'View page-by-page task assignments',
        'Upload completed artwork page-by-page',
        'Track deadlines and priorities',
        'Receive feedback and revision notes'
      ],
      color: 'from-blue-500 to-cyan-600',
      badge: 'Artist Hub'
    },
    editor: {
      title: 'Tantou Editor',
      subtitle: 'Guide series to success',
      desc: 'Manage series schedules, review manuscripts, assign work to assistants, and recommend manuscripts for final publishing.',
      features: [
        'Assign page tasks to specific assistants',
        'Review and request manuscript revisions',
        'Recommend manuscripts for publication',
        'Maintain serialization timelines'
      ],
      color: 'from-amber-500 to-orange-600',
      badge: 'Editorial Desk'
    },
    board: {
      title: 'Editorial Board',
      subtitle: 'Make executive decisions',
      desc: 'Analyze reader vote rankings, evaluate serialization health, and make final decisions on publications and series continuity.',
      features: [
        'Access reader voting analytics & scores',
        'Review bottom-percentile series for risk',
        'Approve or decline new series proposals',
        'Make final publication decisions'
      ],
      color: 'from-emerald-500 to-teal-600',
      badge: 'Executive Suite'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="MangaFlow Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              MangaFlow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#roles" className="hover:text-primary transition-colors">Roles & Workflow</a>
            <Link href="/dashboard/forms-demo" className="hover:text-primary transition-colors">
              Forms Demo
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/95 shadow-md shadow-primary/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 bg-gradient-to-b from-background to-muted/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-border animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Manga & Comic Publishing Workspace
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Streamline Your Manga <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-primary/80 bg-clip-text text-transparent">
                Editorial Workflow
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-normal">
              A collaborative workspace connecting Mangakas, Assistants, and Editors. Manage series proposals, page-by-page tasks, manuscript drafts, and reader voting analytics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                href="/login" 
                className="group flex items-center justify-center gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-primary/10 transition-all"
              >
                Start Collaborating
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/dashboard/forms-demo" 
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-card border border-border text-foreground hover:text-primary hover:border-primary/30 font-semibold px-6 py-3.5 rounded-xl hover:bg-accent/30 shadow-sm transition-all"
              >
                Try Interactive Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Built for Professional Publishing
            </h2>
            <p className="text-muted-foreground">
              A cohesive environment matching the fast-paced nature of weekly and monthly serialization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group" suppressHydrationWarning>
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PencilLine className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Series Proposals</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Creators pitch new concepts, specify publication formats, upload draft artwork, and track approval processes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group" suppressHydrationWarning>
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Task Delegation</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Editors assign drawing, cleaning, or coloring tasks page-by-page to assistants, tracking deadlines and progress status.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group" suppressHydrationWarning>
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Manuscript Control</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Seamless versioning and review chains. Editors give constructive feedback, and Mangakas submit updated drafts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/30 hover:bg-accent/10 transition-all group" suppressHydrationWarning>
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Reader Analytics</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Track reader voting outcomes and scores per chapter. Auto-evaluate performance percentiles to identify risk factors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Roles Showcase */}
      <section id="roles" className="py-24 bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Four Roles, One Unified Pipeline
            </h2>
            <p className="text-muted-foreground">
              Select a role below to explore their dedicated features and views in the MangaFlow ecosystem.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-muted rounded-xl max-w-xl mx-auto mb-12">
            {(['mangaka', 'assistant', 'editor', 'board'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeRole === role 
                    ? 'bg-card text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                {role === 'mangaka' && 'Mangaka'}
                {role === 'assistant' && 'Assistant'}
                {role === 'editor' && 'Tantou Editor'}
                {role === 'board' && 'Editorial Board'}
              </button>
            ))}
          </div>

          {/* Tab Showcase Card */}
          <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden max-w-4xl mx-auto transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 sm:p-12 space-y-6 flex flex-col justify-center">
                <span className={`inline-flex self-start bg-gradient-to-r ${rolesDetails[activeRole].color} text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider`}>
                  {rolesDetails[activeRole].badge}
                </span>
                
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {rolesDetails[activeRole].title}
                  </h3>
                  <p className="text-primary font-medium text-sm">
                    {rolesDetails[activeRole].subtitle}
                  </p>
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm">
                  {rolesDetails[activeRole].desc}
                </p>

                <div className="pt-2">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Enter Role Dashboard <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Showcase list with gradient background */}
              <div className={`bg-gradient-to-br ${rolesDetails[activeRole].color} p-8 sm:p-12 text-white flex flex-col justify-center space-y-6`}>
                <h4 className="font-bold text-lg border-b border-white/20 pb-3">
                  Key Capabilities
                </h4>
                <ul className="space-y-4">
                  {rolesDetails[activeRole].features.map((feat, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="bg-white/20 rounded-full p-1 mt-0.5 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium leading-normal">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-background border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/10 opacity-60" />
        <div className="max-w-4xl mx-auto px-6 text-center relative space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Ready to Streamline Your Publications?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Sign in now to access the workspace, organize series proposals, track manuscripts, and coordinate work across teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link 
              href="/login" 
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-3.5 rounded-xl shadow-sm shadow-primary/10 transition-all w-full sm:w-auto"
            >
              Sign In to Workspace
            </Link>
            <Link 
              href="/dashboard/forms-demo" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-8 py-3.5 rounded-xl transition-all w-full sm:w-auto"
            >
              Interactive Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-muted text-muted-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="MangaFlow Logo"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-bold text-foreground tracking-tight">MangaFlow</span>
          </div>

          <p className="text-xs text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} MangaFlow. All rights reserved. Created for professional manga publishing teams.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/dashboard/forms-demo" className="hover:text-foreground transition-colors">
              Forms Validation Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
