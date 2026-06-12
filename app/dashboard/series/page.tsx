'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  PencilLine,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Eye,
  Trash2,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Filter,
  CalendarDays,
} from 'lucide-react'
import {
  getProposalsByMangaka,
  deleteDraft,
  hasPendingProposal,
  type Proposal,
  type ProposalStatus,
} from '@/lib/proposals-store'
import { useRole } from '@/context/RoleContext'

// Fake current mangaka — will be replaced with real auth
const MOCK_MANGAKA_ID = 'U01'

// Status badge config
const STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  Draft: {
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    icon: FileEdit,
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

const ALL_STATUSES: (ProposalStatus | 'All')[] = [
  'All',
  'Draft',
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

function ProposalCard({
  proposal,
  onDelete,
}: {
  proposal: Proposal
  onDelete: (id: string) => void
}) {
  const config = STATUS_CONFIG[proposal.status]
  const StatusIcon = config.icon
  const isDraft = proposal.status === 'Draft'

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/25 hover:shadow-md transition-all group flex flex-col">
      {/* Coloured top accent bar */}
      <div
        className={`h-1 w-full ${proposal.status === 'Approved'
          ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
          : proposal.status === 'Rejected'
            ? 'bg-gradient-to-r from-red-400 to-rose-500'
            : proposal.status === 'Under Review'
              ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
              : proposal.status === 'Pending Review'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-slate-400 to-slate-500'
          }`}
      />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
              {proposal.title}
            </h3>
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${config.className}`}
          >
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-2">
          {proposal.genre.split(', ').slice(0, 3).map((g) => (
            <span
              key={g}
              className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md"
            >
              {g}
            </span>
          ))}
          {proposal.genre.split(', ').length > 3 && (
            <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md">
              +{proposal.genre.split(', ').length - 3}
            </span>
          )}
        </div>

        {/* Synopsis preview */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1 break-words">
          {proposal.synopsis}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>
              {proposal.submittedAt
                ? `Submitted ${formatDateShort(proposal.submittedAt)}`
                : `Created ${formatDateShort(proposal.createdAt)}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold">
              {proposal.publicationType}
            </span>
            <span className="text-muted-foreground/30">•</span>
            {proposal.sampleFileUrl ? (
              <a
                href={proposal.sampleFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline font-bold"
              >
                Sample File
              </a>
            ) : (
              <span className="text-[10px] text-muted-foreground font-semibold">
                No File
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isDraft && (
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(proposal.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-border rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Draft
            </button>
            <Link
              href={`/dashboard/series/new?edit=${proposal.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/15 rounded-xl transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5" /> Edit Draft
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyProposalsPage() {
  const { role } = useRole()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'All'>('All')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [mangakaId, setMangakaId] = useState('U01')

  const [isBlocked, setIsBlocked] = useState(false)

  const reload = useCallback(async (currentId: string) => {
    const list = await getProposalsByMangaka(currentId)
    setProposals(list)
    const blocked = await hasPendingProposal(currentId)
    setIsBlocked(blocked)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    let currentId = 'U01'
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.id) {
          currentId = parsed.id
          setMangakaId(parsed.id)
        }
      } catch { }
    }
    reload(currentId)
  }, [reload])

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteDraft(deleteConfirmId)
      setDeleteConfirmId(null)
      await reload(mangakaId)
    }
  }

  const filtered =
    statusFilter === 'All' ? proposals : proposals.filter((p) => p.status === statusFilter)

  const counts = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === 'Draft').length,
    pending: proposals.filter(
      (p) => p.status === 'Pending Review' || p.status === 'Under Review',
    ).length,
    approved: proposals.filter((p) => p.status === 'Approved').length,
    rejected: proposals.filter((p) => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <PencilLine className="w-7 h-7 text-primary" />
            My Proposals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your series proposals and track their Editorial Board review status.
          </p>
        </div>

        {/* New Proposal button */}
        <div className="shrink-0">
          {isBlocked ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs font-semibold text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Proposal in review — blocked (BR-19)</span>
            </div>
          ) : (
            <Link
              href="/dashboard/series/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm shadow-primary/10 hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Proposal
            </Link>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, icon: BookOpen, color: 'text-foreground' },
          { label: 'In Review', value: counts.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
          >
            <div className={`${color} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BR-19 warning banner */}
      {isBlocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-600">You have an active proposal in review (BR-19)</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              You may only submit a new proposal once the current one (status: Pending Review or Under
              Review) has been resolved by the Editorial Board.
            </p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {ALL_STATUSES.map((s) => {
          const count = s === 'All' ? proposals.length : proposals.filter((p) => p.status === s).length
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              {s} <span className="opacity-70 ml-1">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Proposal Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-4">
          <PencilLine className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {statusFilter === 'All' ? 'No proposals yet' : `No ${statusFilter} proposals`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === 'All'
                ? "You haven't submitted any series proposals. Start pitching your story!"
                : `No proposals with status "${statusFilter}".`}
            </p>
          </div>
          {statusFilter === 'All' && !isBlocked && (
            <Link
              href="/dashboard/series/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Your First Proposal
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-base">Delete Draft?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This draft proposal will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm font-bold bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
