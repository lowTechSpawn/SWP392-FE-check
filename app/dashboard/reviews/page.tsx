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
  Download,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  FileArchive,
  FileText,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Timer,
  Crown,
  MessageSquare,
  Users,
} from 'lucide-react'
import {
  getProposals,
  updateProposalStatus,
  type Proposal,
  type ProposalStatus,
} from '@/lib/proposals-store'
import { useRole } from '@/context/RoleContext'
import { notificationStore } from '@/store/notificationStore'
import { seriesService } from '@/services/seriesService'
import { API_BASE_URL } from '@/lib/constants'
import { toast } from 'sonner'

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

  // Detailed view and lightbox states
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [detailedProposal, setDetailedProposal] = useState<any | null>(null)
  const [detailedProposalLoading, setDetailedProposalLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState(0)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReasonText, setRejectReasonText] = useState('')

  // Board Decision and Voting States
  const [boardDecision, setBoardDecision] = useState<any | null>(null)
  const [votesList, setVotesList] = useState<any[]>([])
  const [votingLoading, setVotingLoading] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [newDeadline, setNewDeadline] = useState('')
  const [extendReason, setExtendReason] = useState('')
  const [overrideChoice, setOverrideChoice] = useState<'Approved' | 'Rejected' | ''>('')
  const [overrideReason, setOverrideReason] = useState('')
  const [customApproveComment, setCustomApproveComment] = useState('')
  const [showApproveCommentModal, setShowApproveCommentModal] = useState(false)

  const loadProposals = useCallback(async () => {
    const list = await getProposals()
    setProposals(list)
  }, [])

  useEffect(() => {
    loadProposals()
    setMounted(true)
  }, [loadProposals])

  const loadVotingData = useCallback(async (seriesId: string) => {
    try {
      const decisions = await seriesService.getBoardDecisions(seriesId)
      if (decisions && decisions.length > 0) {
        // Sort by CreatedAt descending to get the latest decision
        const sorted = [...decisions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const latest = sorted[0]
        setBoardDecision(latest)

        const votes = await seriesService.getBoardVotes(latest.boardDecisionId)
        setVotesList(votes || [])
      } else {
        setBoardDecision(null)
        setVotesList([])
      }
    } catch (err) {
      console.error('Failed to load board decision or votes:', err)
      setBoardDecision(null)
      setVotesList([])
    }
  }, [])

  // Reset file explorer/reject states when proposal changes
  useEffect(() => {
    setShowRejectInput(false)
    setRejectReasonText('')
    setCustomApproveComment('')
    setShowApproveCommentModal(false)
  }, [selectedProposalId])

  // Fetch detailed proposal and board decision details when selectedProposalId changes
  useEffect(() => {
    if (!selectedProposalId) {
      setDetailedProposal(null)
      setBoardDecision(null)
      setVotesList([])
      return
    }
    let active = true
    const fetchDetail = async () => {
      setDetailedProposalLoading(true)
      try {
        const detail = await seriesService.getSeriesById(selectedProposalId)
        if (active) {
          setDetailedProposal(detail)
        }
      } catch (err) {
        console.error('Failed to fetch detailed proposal:', err)
      } finally {
        if (active) setDetailedProposalLoading(false)
      }
    }
    fetchDetail()
    loadVotingData(selectedProposalId)

    return () => {
      active = false
    }
  }, [selectedProposalId, loadVotingData])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false)
      } else if (e.key === 'ArrowLeft') {
        setLightboxActiveIndex((prev) => {
          const previewPages = detailedProposal?.proposalPages && detailedProposal.proposalPages.length > 0
            ? detailedProposal.proposalPages
            : (detailedProposal?.sampleFileUrl || '').split(',').filter(Boolean);
          if (previewPages.length === 0) return prev;
          return prev > 0 ? prev - 1 : previewPages.length - 1;
        });
      } else if (e.key === 'ArrowRight') {
        setLightboxActiveIndex((prev) => {
          const previewPages = detailedProposal?.proposalPages && detailedProposal.proposalPages.length > 0
            ? detailedProposal.proposalPages
            : (detailedProposal?.sampleFileUrl || '').split(',').filter(Boolean);
          if (previewPages.length === 0) return prev;
          return prev < previewPages.length - 1 ? prev + 1 : 0;
        });
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxOpen, detailedProposal])

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  const handleStatusChange = async (id: string, newStatus: ProposalStatus, rejectReason?: string) => {
    const proposal = proposals.find(p => p.id === id)
    const success = await updateProposalStatus(id, newStatus, rejectReason)
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
            'EditorInChief',
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

  const handleCastVote = async (voteValue: boolean, comment: string) => {
    if (!boardDecision) return
    setVotingLoading(true)
    try {
      await seriesService.castBoardVote(boardDecision.boardDecisionId, voteValue, comment)
      showNotification(`Successfully voted ${voteValue ? 'Approve' : 'Reject'}!`, 'success')
      await loadVotingData(selectedProposalId!)
      await loadProposals()
    } catch (e: any) {
      showNotification(e.message || 'Failed to submit vote.', 'error')
    } finally {
      setVotingLoading(false)
    }
  }

  const handleExtendDeadline = async () => {
    if (!boardDecision || !newDeadline || !extendReason.trim()) return
    setVotingLoading(true)
    try {
      await seriesService.extendBoardDeadline(boardDecision.boardDecisionId, newDeadline, extendReason.trim())
      showNotification('Deadline extended successfully.', 'success')
      setShowExtendModal(false)
      setNewDeadline('')
      setExtendReason('')
      await loadVotingData(selectedProposalId!)
      await loadProposals()
    } catch (e: any) {
      showNotification(e.message || 'Failed to extend deadline.', 'error')
    } finally {
      setVotingLoading(false)
    }
  }

  const handleOverrideFinalize = async () => {
    if (!boardDecision || !overrideChoice || !overrideReason.trim()) return
    setVotingLoading(true)
    try {
      await seriesService.overrideBoardDecision(boardDecision.boardDecisionId, overrideChoice, overrideReason.trim())
      showNotification(`Decision override finalize to "${overrideChoice}" recorded.`, 'success')
      setShowOverrideModal(false)
      setOverrideChoice('')
      setOverrideReason('')
      await loadVotingData(selectedProposalId!)
      await loadProposals()
    } catch (e: any) {
      showNotification(e.message || 'Failed to override decision.', 'error')
    } finally {
      setVotingLoading(false)
    }
  }

  if (!mounted) return null

  // Editorial Board or Editor-in-Chief check (BR-03 / 04: Permission Gate & Guards)
  if (role !== 'EditorialBoard' && role !== 'EditorInChief') {
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

  // Detailed Proposal Review View
  if (selectedProposalId) {
    const baseProposal = proposals.find((p) => p.id === selectedProposalId)

    // Fallback if not found
    if (!baseProposal) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedProposalId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-muted rounded-xl text-xs font-bold text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back to List
          </button>
          <p className="text-sm text-muted-foreground">Proposal not found.</p>
        </div>
      )
    }

    const proposal: any = detailedProposal && detailedProposal.id === selectedProposalId
      ? detailedProposal
      : baseProposal

    const deadlineDate = proposal.submittedAt ? new Date(proposal.submittedAt) : new Date(proposal.createdAt || Date.now())
    deadlineDate.setDate(deadlineDate.getDate() + 7)
    const deadlineStr = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const isOverdue = (proposal.status === 'Pending Review' || proposal.status === 'Under Review') && new Date() > deadlineDate

    const getStatusBadgeClass = (status: string) => {
      const s = status.toLowerCase()
      if (s === 'approved' || s === 'active') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      if (s === 'rejected') return 'bg-red-500/10 text-red-600 border-red-500/20'
      if (s === 'under review' || s === 'underreview' || s === 'boardvoting') return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    }



    const previewPages = proposal.proposalPages && proposal.proposalPages.length > 0
      ? proposal.proposalPages
      : (proposal.sampleFileUrl || '')
        .split(',')
        .filter(Boolean)
        .map((id: string, idx: number) => ({
          pageNo: idx + 1,
          previewFileAssetId: id.trim(),
          url: undefined as string | undefined,
        }))

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Back header */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <button
            onClick={() => {
              setSelectedProposalId(null)
              setShowRejectInput(false)
              setRejectReasonText('')
            }}
            className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
            title="Back to List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-foreground">
              Review Proposal: {proposal.title}
            </h2>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
              Submitted by {proposal.author || `Mangaka ID: ${proposal.mangakaId}`} · Status:{' '}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadgeClass(proposal.status)}`}>
                {proposal.status}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> Overdue
                </span>
              )}
            </p>
          </div>
        </div>

        {detailedProposalLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
            <Clock className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-bold">Loading proposal details...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Metadata & Cover */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                  Cover Artwork & Metadata
                </h3>
                {proposal.coverImageUrl ? (
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proposal.coverImageUrl}
                      alt={proposal.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${proposal.coverColor || 'from-primary to-primary/60'} p-6 flex flex-col justify-between text-white shadow-sm`}>
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xs uppercase">
                      MF
                    </div>
                    <span className="font-black text-base tracking-tight leading-snug drop-shadow-sm">
                      {proposal.title}
                    </span>
                    <span className="text-[10px] font-medium opacity-80">
                      By {proposal.author || `Mangaka ID: ${proposal.mangakaId}`}
                    </span>
                  </div>
                )}

                <div className="space-y-3 pt-2 text-xs divide-y divide-border/40">
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground font-semibold">Mangaka</span>
                    <span className="font-bold text-foreground">{proposal.author || `Mangaka ID: ${proposal.mangakaId}`}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground font-semibold">Publication Type</span>
                    <span className="font-bold text-foreground uppercase">{proposal.publicationType || proposal.type}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground font-semibold">Genres</span>
                    <span className="font-bold text-foreground">{proposal.genre}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground font-semibold">Date Submitted</span>
                    <span className="font-bold text-foreground">
                      {proposal.submittedAt ? formatDateShort(proposal.submittedAt) : (proposal.status === 'Draft' ? 'Draft' : 'N/A')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground font-semibold">Review Deadline</span>
                    <span className={`font-bold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                      {deadlineStr}
                    </span>
                  </div>
                  {proposal.sourceZipFileAssetId && (
                    <div className="py-2.5">
                      <a
                        href={`${API_BASE_URL}/api/files/${proposal.sourceZipFileAssetId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all border border-primary/20"
                      >
                        <FileArchive className="w-4 h-4" /> Download Source ZIP (.zip)
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Synopsis, Preview & Actions */}
            <div className="xl:col-span-2 space-y-6">
              {/* Synopsis */}
              <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                  Proposal Synopsis
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {proposal.synopsis || 'No synopsis provided.'}
                </p>
              </div>

              {/* ZIP File Attachment */}
              {(proposal.sourceZipFileAssetId || proposal.sampleFileUrl) && (
                (() => {
                  const zipDownloadUrl = proposal.sourceZipFileAssetId
                    ? `${API_BASE_URL}/api/files/${proposal.sourceZipFileAssetId}`
                    : proposal.sampleFileUrl?.startsWith('http')
                      ? proposal.sampleFileUrl
                      : `${API_BASE_URL}/api/files/${proposal.sampleFileUrl}`;

                  const zipFileName = proposal.sourceZipFileAssetId
                    ? `source_manuscript_${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.zip`
                    : `sample_pages_${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.zip`;

                  return (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                          <FileArchive className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Attached ZIP Manuscript Package
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Original source files uploaded by the Mangaka
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-muted/30 border border-border/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {zipFileName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            URL: {zipDownloadUrl}
                          </p>
                        </div>
                        <a
                          href={zipDownloadUrl}
                          download={zipFileName}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                        >
                          <Download className="w-4 h-4" /> Download ZIP
                        </a>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Manuscript Preview (5 Pages) */}
              {previewPages.length > 0 && (
                <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                        Mandatory Manuscript Preview (5 Pages)
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Required sample pages submitted by the Mangaka for review
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
                      {previewPages.length} PAGES
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {previewPages.map((page: any, idx: number) => {
                      const imgUrl = page.url
                        || (page.previewFileAssetId?.startsWith('http')
                          ? page.previewFileAssetId
                          : `${API_BASE_URL}/api/files/${page.previewFileAssetId}`);
                      return (
                        <div
                          key={page.proposalPageId || idx}
                          onClick={() => {
                            setLightboxActiveIndex(idx);
                            setLightboxOpen(true);
                          }}
                          className="group relative cursor-pointer aspect-[3/4] bg-muted border border-border hover:border-primary/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Page ${page.pageNo || idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <div className="bg-background/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm text-primary text-[10px] font-bold flex items-center gap-1">
                              <ZoomIn className="w-3.5 h-3.5" /> Inspect
                            </div>
                          </div>

                          <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                            Page {page.pageNo || idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evaluation Panel */}
              <div className="bg-card border border-border p-6 rounded-2xl space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Editorial Board Voting & Decision
                  </h3>
                  {boardDecision && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${boardDecision.status === 'Open'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                      {boardDecision.status} Decision
                    </span>
                  )}
                </div>

                {!boardDecision ? (
                  <div className="p-6 bg-muted/20 border border-border/60 rounded-2xl text-center space-y-2">
                    <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto animate-pulse" />
                    <p className="text-xs font-bold text-muted-foreground">
                      Awaiting Board Submission
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      This proposal has not been submitted to the board yet. The assigned Tantou Editor must approve and submit it to initiate the board voting phase.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Quorum and Vote Counts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Quorum Progress */}
                      <div className="bg-muted/30 border border-border/80 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> Quorum Progress
                          </span>
                          <span>{votesList.length} / 3</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-350 ${votesList.length >= 3 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            style={{ width: `${Math.min((votesList.length / 3) * 100, 100)}%` }}
                          />
                        </div>
                        {/* BR-29: Quorum Requirement Validation */}
                        <p className="text-[10px] text-muted-foreground/80 mt-1 font-medium">
                          {votesList.length >= 3
                            ? 'Quorum requirement met.'
                            : 'Minimum 3 valid votes required for a decision.'}
                        </p>
                      </div>

                      {/* Approve Count */}
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve Votes
                        </span>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-2xl font-black text-emerald-600">
                            {votesList.filter(v => v.voteValue).length}
                          </span>
                          <span className="text-xs text-muted-foreground">votes</span>
                        </div>
                      </div>

                      {/* Reject Count */}
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <ThumbsDown className="w-3.5 h-3.5" /> Reject Votes
                        </span>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-2xl font-black text-red-600">
                            {votesList.filter(v => !v.voteValue).length}
                          </span>
                          <span className="text-xs text-muted-foreground">votes</span>
                        </div>
                      </div>
                    </div>

                    {/* Deadline and Info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-muted/20 border border-border/60 rounded-xl gap-2 text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          Voting Deadline: <strong className="text-foreground">{new Date(boardDecision.votingDeadline).toLocaleString()}</strong>
                        </span>
                      </div>
                      {boardDecision.status === 'Open' && (
                        <span className={new Date() > new Date(boardDecision.votingDeadline) ? 'text-destructive font-bold animate-pulse' : 'text-primary'}>
                          {new Date() > new Date(boardDecision.votingDeadline)
                            ? 'Deadline Passed'
                            : `Time remaining: ${Math.max(0, Math.ceil((new Date(boardDecision.votingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days`}
                        </span>
                      )}
                    </div>

                    {/* Conflict of Interest Warning & Voting Action Panel */}
                    {(() => {
                      let currentUserId = ''
                      if (typeof window !== 'undefined') {
                        const userStr = localStorage.getItem('user-info')
                        if (userStr) {
                          try {
                            const parsed = JSON.parse(userStr)
                            currentUserId = parsed.id || parsed.userId || ''
                          } catch { }
                        }
                      }

                      // BR-27 / 28: Conflict of Interest Guard
                      const hasConflict =
                        proposal.mangakaId === currentUserId ||
                        proposal.tantouEditorId === currentUserId ||
                        boardDecision.createdBy === currentUserId

                      const alreadyVoted = votesList.some(v => v.voterId === currentUserId)
                      const userVote = votesList.find(v => v.voterId === currentUserId)

                      if (hasConflict) {
                        return (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
                            <Shield className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                Conflict of Interest Detected
                              </h4>
                              <p className="text-[11px] text-amber-700/95 dark:text-amber-400/90 leading-relaxed font-medium">
                                You are identified as a key contributor to this series (Mangaka or assigned Editor). Per Conflict of Interest rules, you are prohibited from voting.
                              </p>
                            </div>
                          </div>
                        )
                      }

                      if (boardDecision.status !== 'Open') {
                        return (
                          <div className="p-4 bg-muted/30 border border-border/80 rounded-xl text-center">
                            <p className="text-xs font-bold text-muted-foreground">
                              Voting is Closed
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              This decision has been finalized. Final Result: <strong className="text-foreground uppercase">{boardDecision.result || 'N/A'}</strong>
                            </p>
                          </div>
                        )
                      }

                      if (alreadyVoted) {
                        return (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-2.5 items-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                Your Vote is Recorded
                              </p>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                You voted <strong className="uppercase text-emerald-600">{userVote?.voteValue ? 'Approve' : 'Reject'}</strong> on {new Date(userVote?.votedAt).toLocaleDateString()}.
                              </p>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                            Cast Your Vote
                          </h4>

                          {showRejectInput ? (
                            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3 animate-in slide-in-from-top-2">
                              <label className="text-xs font-extrabold text-destructive flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Rejection Comment
                              </label>
                              <textarea
                                value={rejectReasonText}
                                onChange={(e) => setRejectReasonText(e.target.value)}
                                placeholder="Explain why you are voting to reject this proposal... (At least 50 characters required)"
                                className="w-full p-3 bg-card border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground resize-none"
                                rows={4}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setShowRejectInput(false);
                                    setRejectReasonText('');
                                  }}
                                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted text-muted-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    // BR-35: Reject Reason Requirement (minimum 50 characters)
                                    if (rejectReasonText.trim().length < 50) {
                                      showNotification('Rejection comment must be at least 50 characters.', 'error')
                                      return
                                    }
                                    await handleCastVote(false, rejectReasonText.trim())
                                    setShowRejectInput(false)
                                    setRejectReasonText('')
                                  }}
                                  disabled={votingLoading}
                                  className="px-3 py-1.5 bg-destructive hover:bg-destructive/95 text-destructive-foreground rounded-lg text-xs font-bold disabled:opacity-50"
                                >
                                  {votingLoading ? 'Submitting...' : 'Confirm Reject Vote'}
                                </button>
                              </div>
                            </div>
                          ) : showApproveCommentModal ? (
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3 animate-in slide-in-from-top-2">
                              <label className="text-xs font-extrabold text-emerald-600 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Optional Approve Comment
                              </label>
                              <textarea
                                value={customApproveComment}
                                onChange={(e) => setCustomApproveComment(e.target.value)}
                                placeholder="Add an optional comment/feedback for approval..."
                                className="w-full p-3 bg-card border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground resize-none"
                                rows={3}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setShowApproveCommentModal(false);
                                    setCustomApproveComment('');
                                  }}
                                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted text-muted-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    const comment = customApproveComment.trim() || 'Approved proposal from Editorial Board review.'
                                    await handleCastVote(true, comment)
                                    setShowApproveCommentModal(false)
                                    setCustomApproveComment('')
                                  }}
                                  disabled={votingLoading}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                                >
                                  {votingLoading ? 'Submitting...' : 'Submit Approve Vote'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowApproveCommentModal(true)}
                                disabled={votingLoading}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                              >
                                <ThumbsUp className="w-4 h-4" /> Vote Approve
                              </button>
                              <button
                                onClick={() => setShowRejectInput(true)}
                                disabled={votingLoading}
                                className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                              >
                                <ThumbsDown className="w-4 h-4" /> Vote Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Cast Votes Log List */}
                    <div className="space-y-3 border-t border-border pt-4">
                      <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Votes Log ({votesList.length})
                      </h4>
                      {votesList.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic">No votes cast yet.</p>
                      ) : (
                        <div className="divide-y divide-border/60 max-h-[200px] overflow-y-auto pr-1 space-y-2.5">
                          {votesList.map((v) => (
                            <div key={v.boardVoteId} className="pt-2.5 first:pt-0 space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-foreground">{v.voterName || `Voter ID: ${v.voterId.substring(0, 8)}`}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase ${v.voteValue
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-600 border-red-500/20'
                                  }`}>
                                  {v.voteValue ? 'Approve' : 'Reject'}
                                </span>
                              </div>
                              {v.comment && (
                                <p className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40 leading-relaxed font-medium">
                                  {v.comment}
                                </p>
                              )}
                              <p className="text-[9px] text-muted-foreground/80 font-mono">
                                Voted: {new Date(v.votedAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Editor-in-Chief Executive Actions Panel */}
                    {role === 'EditorInChief' && (
                      <div className="border-t border-border/80 pt-4 space-y-3">
                        <h4 className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Crown className="w-4 h-4" /> Chief Executive Override Controls
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => setShowExtendModal(true)}
                            className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                          >
                            Extend Deadline
                          </button>
                          <button
                            onClick={() => setShowOverrideModal(true)}
                            className="flex-1 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                          >
                            Override & Finalize
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxOpen && (() => {
          const activePage = previewPages[lightboxActiveIndex];
          if (!activePage) return null;

          const imgUrl = activePage.url
            || (activePage.previewFileAssetId?.startsWith('http')
              ? activePage.previewFileAssetId
              : `${API_BASE_URL}/api/files/${activePage.previewFileAssetId}`);

          const handlePrev = (e?: React.MouseEvent) => {
            e?.stopPropagation();
            setLightboxActiveIndex((prev) => (prev > 0 ? prev - 1 : previewPages.length - 1));
          };

          const handleNext = (e?: React.MouseEvent) => {
            e?.stopPropagation();
            setLightboxActiveIndex((prev) => (prev < previewPages.length - 1 ? prev + 1 : 0));
          };

          return (
            <div
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
              onClick={() => setLightboxOpen(false)}
            >
              {/* Header bar */}
              <div className="w-full max-w-5xl flex items-center justify-between py-2 text-white/90 z-10">
                <div>
                  <h4 className="text-xs font-bold font-mono tracking-wider text-primary">
                    MANUSCRIPT PREVIEW
                  </h4>
                  <p className="text-[10px] text-white/50">
                    Page {lightboxActiveIndex + 1} of {previewPages.length}
                  </p>
                </div>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 w-full max-w-5xl flex items-center justify-between gap-4 z-10">
                {/* Prev Button */}
                <button
                  onClick={handlePrev}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl transition-all border border-white/10 cursor-pointer hidden md:flex"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Image Wrapper */}
                <div
                  className="flex-1 max-h-[80vh] flex items-center justify-center p-2 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Page ${lightboxActiveIndex + 1}`}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
                  />
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl transition-all border border-white/10 cursor-pointer hidden md:flex"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Footer bar */}
              <div className="py-4 text-[10px] text-white/40 z-10 flex gap-4">
                <span>Use Left/Right arrows or click side buttons to navigate</span>
                <span>•</span>
                <span>Press ESC to exit</span>
              </div>
            </div>
          );
        })()}

        {/* Editor-in-Chief Modals */}
        {showExtendModal && boardDecision && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" /> Extend Voting Deadline
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Extend the voting deadline for this board decision. You can only extend this once per decision.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">New Deadline</label>
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Extension Reason</label>
                  <textarea
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                    placeholder="Provide a clear reason for the voting extension..."
                    className="w-full p-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 h-24 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setShowExtendModal(false);
                    setNewDeadline('');
                    setExtendReason('');
                  }}
                  className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendDeadline}
                  disabled={votingLoading || !newDeadline || !extendReason.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {votingLoading ? 'Processing...' : 'Extend Deadline'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showOverrideModal && boardDecision && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-destructive" /> Special Override Decision
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Issue a direct Chief Editor veto override to Approve or Reject this series proposal. This bypasses normal voting.
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Override Decision</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOverrideChoice('Approved')}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${overrideChoice === 'Approved'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-border hover:bg-muted text-foreground'
                        }`}
                    >
                      Approve Proposal
                    </button>
                    <button
                      onClick={() => setOverrideChoice('Rejected')}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${overrideChoice === 'Rejected'
                        ? 'bg-destructive border-destructive text-white'
                        : 'border-border hover:bg-muted text-foreground'
                        }`}
                    >
                      Reject Proposal
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Justification / Reason</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide a justification for the override decision..."
                    className="w-full p-2.5 bg-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 h-24 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button
                  onClick={() => {
                    setShowOverrideModal(false);
                    setOverrideChoice('');
                    setOverrideReason('');
                  }}
                  className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverrideFinalize}
                  disabled={votingLoading || !overrideChoice || !overrideReason.trim()}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {votingLoading ? 'Processing...' : 'Submit Override'}
                </button>
              </div>
            </div>
          </div>
        )}
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



      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Submitted', value: counts.total, icon: BookOpen, color: 'text-foreground' },
          { label: 'Pending Review', value: counts.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'Under Review', value: counts.underReview, icon: Eye, color: 'text-blue-600' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between space-y-3"
          >
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon className="w-6.5 h-6.5" />
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              {f} <span className="opacity-70 ml-1">({count})</span>
            </button>
          )
        }
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
                  className={`h-1.5 w-full ${proposal.status === 'Approved'
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

                    <button
                      onClick={() => setSelectedProposalId(proposal.id)}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review Proposal
                    </button>
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
