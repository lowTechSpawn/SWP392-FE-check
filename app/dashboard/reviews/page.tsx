'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  PencilLine,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  BookOpen,
  Filter,
  CalendarDays,
  Check,
  X,
  Play,
  ArrowLeft,
  User,
} from 'lucide-react'
import {
  getProposals,
  updateProposalStatus,
  type Proposal,
  type ProposalStatus,
} from '@/lib/proposals-store'
import { useRole } from '@/context/RoleContext'
import { notificationStore } from '@/store/notificationStore'

// Status badge configurations for Editorial Board view
const STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  Draft: {
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: Clock,
  },
  'Pending Review': {
    label: 'Pending Review',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Clock,
  },
  'Under Review': {
    label: 'Under Review',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: Eye,
  },
  Approved: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: CheckCircle2,
  },
  Rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: XCircle,
  },
  Active: {
    label: 'Approved & Active',
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    icon: CheckCircle2,
  },
}

const ALL_FILTERS: (ProposalStatus | 'All')[] = [
  'All',
  'Pending Review',
  'Under Review',
  'Approved',
  'Rejected',
  'Active',
]

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ReviewProposalsPage() {
  const { role } = useRole()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [filter, setFilter] = useState<ProposalStatus | 'All'>('All')
  const [mounted, setMounted] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadProposals = useCallback(async () => {
    const list = await getProposals()
    setProposals(list)
  }, [])

  useEffect(() => {
    loadProposals()
    setMounted(true)
  }, [loadProposals])

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    const proposal = proposals.find(p => p.id === id)
    const success = await updateProposalStatus(id, newStatus)
    if (success) {
      showNotification(`Proposal status updated to "${newStatus}"!`)
      
      if (proposal) {
        if (newStatus === 'Under Review') {
          notificationStore.addNotification(
            'Proposal Under Review',
            `Your proposal "${proposal.title}" is now being reviewed by the Editorial Board.`,
            'Mangaka',
            'info'
          )
        } else if (newStatus === 'Approved') {
          notificationStore.addNotification(
            'Proposal Approved & Activated',
            `Congratulations! Your proposal "${proposal.title}" has been approved. Tantou Editor Nakamura Takeshi is confirmed.`,
            'Mangaka',
            'success'
          )
          notificationStore.addNotification(
            'Proposal Approved',
            `Proposal "${proposal.title}" has been approved and activated by the Editorial Board.`,
            'Editor-in-Chief',
            'success'
          )
        } else if (newStatus === 'Rejected') {
          notificationStore.addNotification(
            'Proposal Rejected',
            `Your proposal "${proposal.title}" was rejected by the Editorial Board.`,
            'Mangaka',
            'error'
          )
        }
      }
      
      await loadProposals()
    } else {
      showNotification(`Failed to update proposal status.`, 'error')
    }
  }

  if (!mounted) return null

  // Editorial Board or Editor-in-Chief check
  if (role !== 'Editorial Board' && role !== 'Editor-in-Chief') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Only members of the <strong>Editorial Board</strong> or the <strong>Editor-in-Chief</strong> can review series proposals.
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
          💡 <strong>Tip:</strong> Use the role switcher in the bottom left of the sidebar to change your active role to <strong>Editorial Board</strong> or <strong>Editor-in-Chief</strong>.
        </p>
        <Link
          href="/dashboard/mangaka"
          className="mt-2 text-sm font-semibold text-primary hover:underline"
        >
          Return to Mangaka Dashboard
        </Link>
      </div>
    )
  }

  // Filter proposals
  const filtered = filter === 'All' ? proposals : proposals.filter((p) => p.status === filter)

  const counts = {
    total: proposals.length,
    pending: proposals.filter((p) => p.status === 'Pending Review').length,
    underReview: proposals.filter((p) => p.status === 'Under Review').length,
    approved: proposals.filter((p) => p.status === 'Approved').length,
    rejected: proposals.filter((p) => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <PencilLine className="w-7 h-7 text-primary" />
            Review Series Proposals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Evaluate, track, and vote on series proposals submitted by Mangaka.
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm border shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-slate-900 dark:text-slate-100 border-emerald-500/30'
              : 'bg-destructive/10 text-slate-900 dark:text-slate-100 border-destructive/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          )}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Submitted', value: counts.total, icon: BookOpen, color: 'text-foreground', bg: 'bg-primary/8' },
          { label: 'Pending Review', value: counts.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/8' },
          { label: 'Under Review', value: counts.underReview, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-500/8' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/8' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between space-y-3"
          >
            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {ALL_FILTERS.map((f) => {
          const count = f === 'All' ? proposals.length : proposals.filter((p) => p.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {f} <span className="opacity-70 ml-1">({count})</span>
            </button>
          )}
        )}
      </div>

      {/* Proposals Grid / List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((proposal) => {
            const config = STATUS_CONFIG[proposal.status] || STATUS_CONFIG['Pending Review']
            const StatusIcon = config.icon

            return (
              <div
                key={proposal.id}
                className="bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all flex flex-col"
              >
                {/* Visual Header */}
                <div
                  className={`h-1.5 w-full ${
                    proposal.status === 'Approved'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : proposal.status === 'Rejected'
                      ? 'bg-gradient-to-r from-red-400 to-rose-500'
                      : proposal.status === 'Under Review'
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      : 'bg-gradient-to-r from-amber-400 to-orange-500'
                  }`}
                />

                <div className="p-6 flex flex-col flex-1 gap-4">
                  {/* Proposal Header Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-lg text-foreground tracking-tight break-words">
                        {proposal.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {proposal.id}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> Mangaka ID: {proposal.mangakaId}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${config.className}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                  </div>

                  {/* Badges / Meta */}
                  <div className="flex flex-wrap gap-2">
                    {proposal.genre.split(', ').map((g) => (
                      <span
                        key={g}
                        className="bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-0.5 rounded-lg"
                      >
                        {g}
                      </span>
                    ))}
                    <span className="bg-primary/5 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-lg border border-primary/10">
                      {proposal.publicationType}
                    </span>
                    {proposal.sampleFileUrl ? (
                      <a
                        href={proposal.sampleFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary/5 text-primary text-xs font-bold px-2.5 py-0.5 rounded-lg border border-primary/10 hover:underline"
                      >
                        View Sample File
                      </a>
                    ) : (
                      <span className="bg-amber-500/5 text-amber-600 text-xs font-semibold px-2.5 py-0.5 rounded-lg border border-amber-500/10">
                        No File
                      </span>
                    )}
                  </div>

                  {/* Synopsis section */}
                  <div className="space-y-1.5 bg-muted/30 p-4 rounded-2xl border border-border/40">
                    <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                      Synopsis
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-normal break-words">
                      {proposal.synopsis}
                    </p>
                  </div>

                  {/* Submission date & Actions footer */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border/60 mt-auto">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-muted-foreground/60" />
                      Submitted: {formatDateShort(proposal.submittedAt ?? proposal.createdAt)}
                    </span>

                    {/* Action buttons (only for pending or under-review) */}
                    {(proposal.status === 'Pending Review' || proposal.status === 'Under Review') && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {proposal.status === 'Pending Review' && (
                          <button
                            onClick={() => handleStatusChange(proposal.id, 'Under Review')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Review
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(proposal.id, 'Approved')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(proposal.id, 'Rejected')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-4">
          <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <div>
            <h3 className="font-bold text-lg text-foreground">
              No proposals found
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are no proposals matching the status filter "{filter}".
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
