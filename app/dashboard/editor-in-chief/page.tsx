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
  CalendarDays,
  ArrowUpRight,
  User,
  Check,
  X,
  Volume2,
} from 'lucide-react'
import { proposalService } from '@/services/proposalService'
import type { Proposal, ProposalStatus } from '@/types/proposal'

const { getProposals, updateProposalStatus } = proposalService
import { useRole } from '@/context/RoleContext'
import { Progress } from '@/components/ui/progress'
import { notificationStore } from '@/store/notificationStore'
import { toast } from 'sonner'
import { seriesService } from '@/services/seriesService'

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
  const [mounted, setMounted] = useState(false)
  const [proposalVotes, setProposalVotes] = useState<Record<string, { approve: number; reject: number }>>({})

  const loadProposals = useCallback(async () => {
    const list = await getProposals()
    setProposals(list)

    const pendingList = list.filter(
      (p) => p.status === 'Pending Review' || p.status === 'Under Review'
    )

    const votesMap: Record<string, { approve: number; reject: number }> = {}
    await Promise.all(
      pendingList.map(async (proposal) => {
        try {
          const decisions = await seriesService.getBoardDecisions(proposal.id)
          if (decisions && decisions.length > 0) {
            const sorted = [...decisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            const latest = sorted[0]
            const votes = await seriesService.getBoardVotes(latest.boardDecisionId)
            if (votes) {
              const approve = votes.filter((v: any) => v.voteValue).length
              const reject = votes.filter((v: any) => !v.voteValue).length
              votesMap[proposal.id] = { approve, reject }
              return
            }
          }
        } catch (err) {
          console.error(`Failed to fetch votes for ${proposal.id}:`, err)
        }
        votesMap[proposal.id] = { approve: 0, reject: 0 }
      })
    )
    setProposalVotes(votesMap)
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
      <div className="relative overflow-hidden border-red-500/10 rounded-2xl p-8">
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
            <div className="bg-card/60 backdrop-blur-md border border-border p-4 rounded-xl text-center shrink-0">
              <p className="text-2xl font-black text-foreground">{pendingOverrideProposals.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Pending Override</p>
            </div>
            <div className="bg-card/60 backdrop-blur-md border border-border p-4 rounded-xl text-center shrink-0">
              <p className="text-2xl font-black text-emerald-500">{activeSeries.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Active Series</p>
            </div>
          </div>
        </div>
      </div>



      {/* Main Content */}
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
              const votes = proposalVotes[proposal.id] || { approve: 0, reject: 0 }
              const approveVotes = votes.approve
              const rejectVotes = votes.reject
              const totalVotes = approveVotes + rejectVotes
              const quorumProgress = Math.min((totalVotes / 3) * 100, 100)

              return (
                <div
                  key={proposal.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-red-500/25 transition-all flex flex-col md:flex-row"
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
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground border">
                            {proposal.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-semibold">
                          <span className="text-primary">{proposal.genre}</span>
                          <span>•</span>
                          <span>{proposal.publicationType}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            Submitted: {formatDateShort(proposal.submittedAt || proposal.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Quorum Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Board Vote Quorum</span>
                          <span className="text-foreground">{totalVotes}/3 Votes Cast</span>
                        </div>
                        <Progress value={quorumProgress} className="h-1.5 bg-muted" />
                      </div>

                      {/* Vote breakdown */}
                      <div className="flex gap-4 text-xs font-bold">
                        <div className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                          Approve: {approveVotes}
                        </div>
                        <div className="text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                          Reject: {rejectVotes}
                        </div>
                      </div>
                    </div>

                    {/* Veto Action buttons */}
                    <div className="flex flex-col justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6 space-y-3">
                      <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest text-center">Veto Override Direct Action</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVetoDecision(proposal.id, 'Approved')}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Direct Approve
                        </button>
                        <button
                          onClick={() => handleVetoDecision(proposal.id, 'Rejected')}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Direct Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-16 text-center space-y-3">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <h3 className="font-bold text-lg text-foreground">No pending proposals</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              All proposals are processed and finalized. No override decisions are required.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
