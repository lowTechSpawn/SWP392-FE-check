'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  PencilLine,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  BookOpen,
  Star,
  CalendarDays,
  ShieldCheck,
  MailWarning,
  Trash2,
  ArrowUpRight,
  User,
  Check,
  X,
  Volume2,
  Sparkles,
} from 'lucide-react'
import {
  getProposals,
  updateProposalStatus,
  type Proposal,
  type ProposalStatus,
} from '@/lib/proposals-store'
import { useRole } from '@/context/RoleContext'
import { Progress } from '@/components/ui/progress'
import { notificationStore } from '@/store/notificationStore'
import { toast } from 'sonner'

// Config for mock series metrics (popularity, rating, chapters)
const INITIAL_METRICS: Record<string, { rating: number; popularity: number; chapterCount: number }> = {
  PR01: { rating: 4.8, popularity: 82, chapterCount: 15 },
  PR02: { rating: 4.3, popularity: 24, chapterCount: 3 }, // Under 4.7 triggers bottom percentile warning
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function EditorInChiefDashboard() {
  const { role } = useRole()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [activeTab, setActiveTab] = useState<'override' | 'supervision'>('override')
  const [mounted, setMounted] = useState(false)
  const [warnings, setWarnings] = useState<Record<string, boolean>>({})

  const loadProposals = useCallback(async () => {
    const list = await getProposals()
    setProposals(list)
  }, [])

  useEffect(() => {
    loadProposals()
    setMounted(true)
  }, [loadProposals])

  // Chief Override function
  const handleVetoDecision = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    const proposal = proposals.find(p => p.id === id)
    if (!proposal) return

    const success = await updateProposalStatus(id, newStatus)
    if (success) {
      if (newStatus === 'Approved') {
        toast.success(`Veto Approved: "${proposal.title}" is now Active. Tantou Editor automatically assigned!`)
        // Dispatch notifications
        notificationStore.addNotification(
          'Proposal Approved by Chief Override',
          `Congratulations! The Editor-in-Chief has directly approved and activated your proposal "${proposal.title}".`,
          'Mangaka',
          'success'
        )
        notificationStore.addNotification(
          'Proposal Veto Approved',
          `Editor-in-Chief has vetoed and approved proposal "${proposal.title}".`,
          'EditorialBoard',
          'success'
        )
      } else {
        toast.error(`Veto Rejected: "${proposal.title}" has been archived.`)
        // Dispatch notifications
        notificationStore.addNotification(
          'Proposal Rejected by Chief Override',
          `Your proposal "${proposal.title}" was vetoed and rejected by the Editor-in-Chief.`,
          'Mangaka',
          'error'
        )
        notificationStore.addNotification(
          'Proposal Veto Rejected',
          `Editor-in-Chief has vetoed and rejected proposal "${proposal.title}".`,
          'EditorialBoard',
          'error'
        )
      }
      await loadProposals()
    } else {
      toast.error('Failed to execute override decision.')
    }
  }

  // Performance Supervision Actions
  const handleIssueWarning = (id: string, title: string) => {
    setWarnings(prev => ({ ...prev, [id]: true }))
    toast.warning(`Official performance warning issued to Mangaka for "${title}"! (BR-03)`)
    
    // Dispatch notifications
    notificationStore.addNotification(
      'Serialization Performance Warning',
      `Your active series "${title}" has received an official performance warning because its reader rating is currently in the bottom 20%.`,
      'Mangaka',
      'warning'
    )
  }

  const handleDirectDeactivate = async (id: string, title: string) => {
    const success = await updateProposalStatus(id, 'Rejected')
    if (success) {
      toast.error(`Series "${title}" has been deactivated and serialization cancelled.`)
      
      // Dispatch notifications
      notificationStore.addNotification(
        'Serialization Terminated',
        `Serialization has been terminated and cancelled for your series "${title}" by the Editor-in-Chief due to performance standards.`,
        'Mangaka',
        'error'
      )
      notificationStore.addNotification(
        'Serialization Terminated',
        `Serialization for "${title}" has been cancelled by the Editor-in-Chief.`,
        'EditorialBoard',
        'error'
      )
      
      await loadProposals()
    } else {
      toast.error('Failed to deactivate series.')
    }
  }

  if (!mounted) return null

  // Editor-in-Chief Access Guard
  if (role !== 'EditorInChief') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Only the <strong>Editor-in-Chief</strong> is authorized to view this control panel.
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
          💡 <strong>Tip:</strong> Use the role switcher in the bottom left of the sidebar to change your active role to <strong>Editor-in-Chief</strong>.
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

  // Filter lists
  const pendingOverrideProposals = proposals.filter(
    (p) => p.status === 'Pending Review' || p.status === 'Under Review'
  )

  const activeSeries = proposals.filter((p) => p.status === 'Approved')

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-950/20 via-primary/5 to-transparent border border-red-500/10 rounded-3xl p-8 shadow-inner">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5" /> Chief Executive Control
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Editor-in-Chief Workspace
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Supervise active serializations, override board voting (Veto Finalization), and execute direct actions on proposals.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-card/60 backdrop-blur-md border border-border p-4 rounded-2xl text-center shrink-0">
              <p className="text-2xl font-black text-foreground">{pendingOverrideProposals.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Pending Override</p>
            </div>
            <div className="bg-card/60 backdrop-blur-md border border-border p-4 rounded-2xl text-center shrink-0">
              <p className="text-2xl font-black text-emerald-500">{activeSeries.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Active Series</p>
            </div>
          </div>
        </div>
      </div>



      {/* Tabs Menu */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('override')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'override'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PencilLine className="w-4 h-4" />
          Veto Override Panel ({pendingOverrideProposals.length})
        </button>
        <button
          onClick={() => setActiveTab('supervision')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'supervision'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="w-4 h-4" />
          Active Series Supervision ({activeSeries.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {activeTab === 'override' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Direct Finalization & Veto Override</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bypass the regular Editorial Board vote quorum requirements. Approve or Reject proposals directly.
                </p>
              </div>
            </div>

            {pendingOverrideProposals.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {pendingOverrideProposals.map((proposal) => {
                  // Mock votes for UI visualization
                  const approveVotes = proposal.id === 'PR02' ? 2 : 1
                  const rejectVotes = proposal.id === 'PR02' ? 0 : 1
                  const totalVotes = approveVotes + rejectVotes
                  const quorumProgress = (totalVotes / 3) * 100

                  return (
                    <div
                      key={proposal.id}
                      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-red-500/25 transition-all flex flex-col md:flex-row"
                    >
                      {/* Left color bar */}
                      <div className="w-full md:w-2 bg-gradient-to-b from-amber-500 to-red-500" />

                      <div className="p-6 flex-1 flex flex-col md:flex-row justify-between gap-6">
                        {/* Info details */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-lg text-foreground tracking-tight">
                                {proposal.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-semibold">
                              <span className="text-primary">{proposal.genre}</span>
                              <span>•</span>
                              <span>{proposal.publicationType}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> Mangaka ID: {proposal.mangakaId}
                              </span>
                            </div>
                          </div>

                          <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-1">
                            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Synopsis</p>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                              {proposal.synopsis}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="w-4 h-4 text-muted-foreground/60" />
                            <span>Submitted: {formatDateShort(proposal.submittedAt ?? proposal.createdAt)}</span>
                          </div>
                        </div>

                        {/* Voting Status & Direct Override Actions */}
                        <div className="w-full md:w-80 flex flex-col justify-between p-4 bg-muted/20 border border-border/50 rounded-2xl shrink-0 space-y-4">
                          {/* Board voting status */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-foreground">Board Quorum Status</span>
                              <span className="text-muted-foreground">{totalVotes}/3 votes</span>
                            </div>
                            <Progress value={quorumProgress} className="h-2 bg-muted border border-border/30" />
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {approveVotes} Approve
                              </span>
                              <span className="text-red-500 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> {rejectVotes} Reject
                              </span>
                            </div>
                          </div>

                          {/* Chief override button panel */}
                          <div className="space-y-2 pt-2 border-t border-border/50">
                            <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest text-center">Veto Override Direct Action</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleVetoDecision(proposal.id, 'Approved')}
                                className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                              >
                                <Check className="w-3.5 h-3.5" /> Direct Approve
                              </button>
                              <button
                                onClick={() => handleVetoDecision(proposal.id, 'Rejected')}
                                className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
                              >
                                <X className="w-3.5 h-3.5" /> Direct Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-3">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h3 className="font-bold text-lg text-foreground">No pending proposals</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  All proposals are processed and finalized. No override decisions are required.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'supervision' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Active Serialization Supervision</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluate reader popularity and rating metrics. Automatically flags the lowest-performing series.
              </p>
            </div>

            {activeSeries.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {activeSeries.map((series) => {
                  const metrics = INITIAL_METRICS[series.id] || { rating: 4.2, popularity: 19, chapterCount: 1 }
                  const isBottomPercentile = metrics.rating < 4.7
                  const warningSent = warnings[series.id]

                  return (
                    <div
                      key={series.id}
                      className={`bg-card border rounded-2xl p-6 transition-all space-y-4 flex flex-col justify-between ${
                        isBottomPercentile
                          ? 'border-amber-500/30 hover:border-amber-500/50 bg-gradient-to-br from-card via-card to-amber-500/5'
                          : 'border-border hover:border-primary/25'
                      }`}
                    >
                      {/* Title & warning banner */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                              {series.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              by Mangaka ID: <span className="font-semibold text-foreground">{series.mangakaId}</span>
                            </p>
                          </div>
                          
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">
                            Active
                          </span>
                        </div>

                        {isBottomPercentile && (
                          <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-500 rounded-lg font-bold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>BR-03 Alert: Bottom 20% Performance Percentile</span>
                          </div>
                        )}
                      </div>

                      {/* Performance indicators */}
                      <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-xl border border-border/40 text-center">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Rating</p>
                          <p className="text-base font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {metrics.rating.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Popularity</p>
                          <p className="text-base font-extrabold text-foreground mt-0.5">{metrics.popularity}%</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Chapters</p>
                          <p className="text-base font-extrabold text-foreground mt-0.5">{metrics.chapterCount}</p>
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/40 mt-auto">
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          Type: {series.publicationType}
                        </span>

                        {isBottomPercentile ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleIssueWarning(series.id, series.title)}
                              disabled={warningSent}
                              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                warningSent
                                  ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-600'
                              }`}
                            >
                              <MailWarning className="w-3.5 h-3.5" />
                              {warningSent ? 'Warning Issued' : 'Issue Warning'}
                            </button>
                            <button
                              onClick={() => handleDirectDeactivate(series.id, series.title)}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Direct Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Normal standing
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h3 className="font-bold text-lg text-foreground">No active series</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  There are no active serializations currently registered. Approve a proposal to begin one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
