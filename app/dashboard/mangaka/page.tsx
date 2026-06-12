'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PencilLine,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileEdit,
  AlertTriangle,
  Layers,
  ClipboardList,
  Sparkles,
  TrendingUp,
  CalendarDays,
  Eye,
} from 'lucide-react'
import {
  getProposalsByMangaka,
  hasPendingProposal,
  type Proposal,
  type ProposalStatus,
} from '@/lib/proposals-store'

const DEFAULT_MANGAKA_ID = 'U01'

const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string; icon: React.ElementType }> = {
  Draft: { label: 'Draft', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: FileEdit },
  'Pending Review': { label: 'Pending Review', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  'Under Review': { label: 'Under Review', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Eye },
  Approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  Rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  Active: { label: 'Approved & Active', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: CheckCircle2 },
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MangakaDashboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [mounted, setMounted] = useState(false)
  const [mangakaName, setMangakaName] = useState('Mangaka')
  const [mangakaId, setMangakaId] = useState(DEFAULT_MANGAKA_ID)
  const [isBlocked, setIsBlocked] = useState(false)
  const [assignedEditor, setAssignedEditor] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    let currentId = DEFAULT_MANGAKA_ID
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.name) {
          setMangakaName(parsed.name)
        }
        if (parsed?.id) {
          setMangakaId(parsed.id)
          currentId = parsed.id
        }
        if (parsed?.assignedEditorName) {
          setAssignedEditor({
            name: parsed.assignedEditorName,
            email: parsed.assignedEditorEmail || ''
          })
        }
      } catch {}
    }
    
    getProposalsByMangaka(currentId).then((list) => {
      setProposals(list)
      hasPendingProposal(currentId).then((blocked) => {
        setIsBlocked(blocked)
        setMounted(true)
      })
    })
  }, [])

  if (!mounted) return null

  const recent = [...proposals].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3)

  const counts = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'Draft').length,
    pending: proposals.filter(p => p.status === 'Pending Review' || p.status === 'Under Review').length,
    approved: proposals.filter(p => p.status === 'Approved').length,
    rejected: proposals.filter(p => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">

      {/* Welcome header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> Mangaka Portal
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Welcome back, {mangakaName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your series proposals and track their review status.
            </p>
            {assignedEditor && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-xl text-xs font-medium text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Assigned Editor: <strong className="text-foreground">{assignedEditor.name}</strong> {assignedEditor.email ? `(${assignedEditor.email})` : ''}</span>
              </div>
            )}
          </div>

          {isBlocked ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs font-semibold text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
              Proposal in review — new submission blocked
            </div>
          ) : (
            <Link
              href="/dashboard/series/new"
              className="inline-flex items-center gap-2 shrink-0 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl shadow-sm shadow-primary/15 hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Proposal
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Proposals', value: counts.total, icon: PencilLine, color: 'text-foreground', bg: 'bg-primary/8' },
          { label: 'In Review', value: counts.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/8' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/8' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Proposals */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm">Recent Proposals</h2>
            </div>
            <Link
              href="/dashboard/series"
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <PencilLine className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No proposals yet</p>
                <Link
                  href="/dashboard/series/new"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Create your first proposal
                </Link>
              </div>
            ) : (
              recent.map((p) => {
                const config = STATUS_CONFIG[p.status]
                const StatusIcon = config.icon
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    {/* Left accent */}
                    <div className={`w-1 h-10 rounded-full shrink-0 ${p.status === 'Approved' ? 'bg-emerald-500' :
                      p.status === 'Rejected' ? 'bg-red-500' :
                        p.status === 'Under Review' ? 'bg-blue-500' :
                          p.status === 'Pending Review' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CalendarDays className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateShort(p.submittedAt ?? p.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${config.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
