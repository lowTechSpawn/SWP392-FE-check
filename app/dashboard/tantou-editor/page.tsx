'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Layers,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  FileCheck,
  ClipboardList,
  Calendar,
  XCircle,
  MessageSquare,
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Plus,
  ChevronDown,
  Star,
  Users,
  X,
  Mail,
  CheckCircle,
  Folder,
  FolderOpen,
  FileImage,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileArchive,
  PencilLine,
} from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import {
  type Chapter,
  type Task,
  type ChapterStatus,
} from '@/lib/chapters-store'
import { manuscriptService } from '@/services/manuscriptService'
import type { ManuscriptItem, Annotation } from '@/types/manuscript'
import { toast } from 'sonner'
import { seriesService, type SeriesProposal } from '@/services/seriesService'
import { userService } from '@/services/userService'
import { chapterService } from '@/services/chapterService'
import { API_BASE_URL } from '@/lib/constants'


function TantouEditorWorkspace() {
  const { role } = useRole()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'

  // Current logged in user info
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>('Editor')
  const [assignedMangakas, setAssignedMangakas] = useState<{ id: string; name: string; email: string }[]>([])

  // Data states
  const [seriesList, setSeriesList] = useState<any[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [manuscripts, setManuscripts] = useState<ManuscriptItem[]>([])

  // Filter States for Series tab
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All Genres')
  const [selectedType, setSelectedType] = useState('All Types')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Manuscript Detailed Review View State
  const [activeManuscriptId, setActiveManuscriptId] = useState<string | null>(null)
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  // Proposal Review states
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [proposalFilter, setProposalFilter] = useState<string>('All')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReasonText, setRejectReasonText] = useState('')



  const [detailedProposal, setDetailedProposal] = useState<SeriesProposal | null>(null)
  const [detailedProposalLoading, setDetailedProposalLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState(0)

  useEffect(() => {
    if (!selectedProposalId) {
      setDetailedProposal(null)
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
    return () => {
      active = false
    }
  }, [selectedProposalId])

  // Keyboard event listener for Lightbox navigation
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

  // Load Data function
  const loadData = useCallback(async (editorId?: string) => {
    const targetEditorId = editorId || currentUserId
    let list: any[] = []

    try {
      list = await seriesService.listSeries()
      setSeriesList(list)
    } catch (e) {
      console.error('Failed to load series from backend:', e)
    }

    if (targetEditorId) {
      try {
        let assigned: { id: string; name: string; email: string }[] = []
        try {
          const res = await userService.getMyMangakas()
          if (res && res.data) {
            assigned = res.data.map(u => ({
              id: u.userId,
              name: u.displayName || u.userName,
              email: u.email
            }))
          }
        } catch (e) {
          console.warn('Failed to load assigned mangakas from backend:', e)
        }

        // Merge local storage overrides if any
        if (typeof window !== 'undefined') {
          try {
            const overrides = JSON.parse(localStorage.getItem('editor_assignments_override') || '{}')
            for (const [mangakaId, editorId] of Object.entries(overrides)) {
              if (typeof editorId === 'string' && editorId.toLowerCase() === targetEditorId.toLowerCase()) {
                const alreadyAdded = assigned.some(m => m.id.toLowerCase() === mangakaId.toLowerCase())
                if (!alreadyAdded) {
                  const seriesObj = list.find(s => s.mangakaId?.toLowerCase() === mangakaId.toLowerCase())
                  const name = seriesObj ? seriesObj.author : 'Assigned Mangaka'
                  assigned.push({
                    id: mangakaId,
                    name: name,
                    email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`
                  })
                }
              }
            }
          } catch { }
        }

        setAssignedMangakas(assigned)
      } catch (e) {
        console.error('Failed to process assigned mangakas:', e)
      }
    }

    setManuscripts(manuscriptService.getManuscripts())

    try {
      const allChaps = await chapterService.listChapters()
      setChapters(allChaps)
    } catch (e) {
      console.warn('Failed to load chapters from backend:', e)
    }

    // Background sync manuscripts
    try {
      const synced = await manuscriptService.syncManuscriptsFromBackend()
      if (synced) setManuscripts(synced)
    } catch (e) {
      console.warn('Failed to sync manuscripts from backend:', e)
    }
  }, [currentUserId])

  useEffect(() => {
    let editorId = currentUserId
    const saved = localStorage.getItem('user-info')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.id) {
        editorId = parsed.id
        setCurrentUserId(parsed.id)
      }
      if (parsed?.displayName || parsed?.userName) {
        setCurrentUserName(parsed.displayName || parsed.userName)
      }
      if (parsed?.assignedMangakas) {
        setAssignedMangakas(parsed.assignedMangakas)
      }
    }
    if (editorId) {
      loadData(editorId)
    }
  }, [loadData, currentUserId])

  // Sync annotations when active manuscript changes in review mode
  const activeManuscript = useMemo(() => {
    return manuscripts.find((m) => m.id === activeManuscriptId)
  }, [manuscripts, activeManuscriptId])

  useEffect(() => {
    if (activeManuscript) {
      setAnnotations(manuscriptService.getAnnotations(activeManuscript.id, activeManuscript.latestVersion))
      manuscriptService.syncAnnotationsFromBackend(activeManuscript.id)
        .then((synced) => {
          if (synced) setAnnotations(synced)
        })
        .catch((e) => console.warn(e))
    }
  }, [activeManuscript])

  //BR74:Filters manuscript dashboard to show only works of creators supervised by the active editor.
  const supervisedSeries = useMemo(() => {
    const assignedIds = new Set(assignedMangakas.map(m => m.id.toLowerCase()))
    const filteredList = seriesList.filter(
      (s) => s.mangakaId && assignedIds.has(s.mangakaId.toLowerCase())
    )
    return [...filteredList].sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.submittedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
  }, [seriesList, assignedMangakas])

  // Stats Counters
  const pendingReviewsCount = useMemo(() => {
    const manuscriptsSubmitted = manuscripts.filter(
      (m) =>
        m.status === 'SUBMITTED' &&
        supervisedSeries.some((s) => s.id === m.seriesId)
    ).length
    const chaptersReadyForReview = chapters.filter(
      (c) =>
        c.status === 'Ready for Editor' &&
        supervisedSeries.some((s) => s.id === c.seriesId)
    ).length
    return manuscriptsSubmitted + chaptersReadyForReview
  }, [manuscripts, chapters, supervisedSeries])

  // Render stats summary helper
  const stats = useMemo(() => {
    return {
      seriesCount: supervisedSeries.length,
      pendingCount: pendingReviewsCount,
    }
  }, [supervisedSeries, pendingReviewsCount])

  // Role Guard check
  if (role !== 'TantouEditor') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Only users with the <strong>Tantou Editor</strong> role are authorized to view this dashboard.
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
          💡 <strong>Tip:</strong> Use the role switcher in the bottom left of the sidebar to change your active role to <strong>Tantou Editor</strong>.
        </p>
        <Link
          href="/dashboard/manga-list"
          className="mt-2 text-sm font-semibold text-primary hover:underline"
        >
          Go to Manga List
        </Link>
      </div>
    )
  }

  // --- Handlers for Manuscript Review Tab ---
  const handleOpenReview = (id: string) => {
    setActiveManuscriptId(id)
    setNewAnnotationText('')
    setFeedbackText('')
  }

  const handleBackToManuscripts = () => {
    setActiveManuscriptId(null)
    loadData()
  }

  const handleAddAnnotationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeManuscript || !newAnnotationText.trim()) return

    manuscriptService.addAnnotation(
      activeManuscript.id,
      activeManuscript.latestVersion,
      newAnnotationText.trim()
    ).then((ann) => {
      setAnnotations((prev) => [...prev, ann])
      setNewAnnotationText('')
      toast.success('Annotation added to this version draft!')
    }).catch((err) => {
      toast.error(err.message || 'Failed to add annotation')
    })
  }

  const handleDecision = async (status: 'APPROVED' | 'REVISION REQUIRED') => {
    if (!activeManuscript) return

    // BR-84 Guard: Cannot approve if chapter drawing progress < 100%
    if (status === 'APPROVED' && activeManuscript.progress < 100) {
      toast.error(
        `BR-84 Violation: Chapter drawing progress is only ${activeManuscript.progress}%. Must be 100% to approve.`
      )
      return
    }

    try {
      const success = await manuscriptService.updateManuscriptStatus(
        activeManuscript.id,
        status,
        feedbackText.trim()
      )
      if (success) {
        if (status === 'APPROVED') {
          toast.success(`Manuscript for "${activeManuscript.seriesTitle}" approved and locked (BR-80)!`)
        } else {
          toast.warning(
            `Revision requested for "${activeManuscript.seriesTitle}". Status updated.`
          )
        }
        handleBackToManuscripts()
      } else {
        toast.error('Failed to update manuscript review status.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update manuscript review status.')
    }
  }

  const handlePublishManuscript = async (manuscript: ManuscriptItem) => {
    try {
      const success = await manuscriptService.updateManuscriptStatus(
        manuscript.id,
        'PUBLISHED',
        'Manuscript published.'
      )

      if (success) {
        toast.success(`Manuscript for "${manuscript.seriesTitle}" published.`)
        handleBackToManuscripts()
      } else {
        toast.error('Failed to publish manuscript.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish manuscript.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mt-1.5">
            Welcome back, <span className="text-primary">{currentUserName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          Active: {assignedMangakas.length} assigned Mangakas
        </div>
      </div>

      {/* RENDER VIEW BASED ON TAB PARAMETER */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-foreground">Dashboard</h2>
          </div>

          {/* Stats Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/tantou-editor?tab=series"
              className="bg-card border border-border hover:border-primary/20 p-6 rounded-2xl flex items-center gap-4 transition-all shadow-sm group cursor-pointer"
            >
              <div className="text-primary group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">My Series</p>
                <p className="text-2xl font-black text-foreground leading-none mt-1">
                  {stats.seriesCount}
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/tantou-editor?tab=manuscripts"
              className="bg-card border border-border hover:border-primary/20 p-6 rounded-2xl flex items-center gap-4 transition-all shadow-sm group cursor-pointer"
            >
              <div className="text-amber-600 group-hover:scale-105 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold font-sans">
                  Pending Reviews
                </p>
                <p className="text-2xl font-black text-foreground leading-none mt-1">
                  {stats.pendingCount}
                </p>
              </div>
            </Link>
          </div>

          {/* Double Column content: Recent Proposals and Series Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left side: Recent Proposals */}
            <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Recent Proposals
                </h3>
                <Link
                  href="/dashboard/tantou-editor?tab=proposals"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-border/30">
                {supervisedSeries.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    No proposals submitted yet.
                  </p>
                ) : (
                  [...supervisedSeries]
                    .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime())
                    .slice(0, 5)
                    .map((proposal) => {
                      return (
                        <div
                          key={proposal.id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground">
                              {proposal.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center">
                              <PencilLine className="w-3 h-3 mr-1 text-primary shrink-0" /> Mangaka: {proposal.author} · {proposal.type || 'Weekly'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-muted-foreground">
                              {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (proposal.status === 'Draft' ? 'Draft' : 'N/A')}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${proposal.status === 'Approved' || proposal.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : proposal.status === 'Proposed'
                                  ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                  : proposal.status === 'Under Review' || proposal.status === 'UnderReview'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}
                            >
                              {proposal.status || 'Proposed'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </div>

            {/* Right side column: Assigned Mangakas & Series Overview */}
            <div className="space-y-6">
              {/* Assigned Mangakas List Card */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-border/40">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Assigned Mangakas
                  </h3>
                </div>

                <div className="divide-y divide-border/30">
                  {assignedMangakas.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">
                      No mangakas assigned.
                    </p>
                  ) : (
                    assignedMangakas.map((mangaka) => (
                      <div
                        key={mangaka.id}
                        className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">
                            {mangaka.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {mangaka.email}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
                          Active
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Series Overview */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-border/40">
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Series Overview
                  </h3>
                  <Link
                    href="/dashboard/tantou-editor?tab=series"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-border/30">
                  {supervisedSeries.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">
                      No series assigned.
                    </p>
                  ) : (
                    supervisedSeries.slice(0, 5).map((series) => (
                      <div
                        key={series.id}
                        className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">
                            {series.title}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {series.genre?.join(', ') || 'No genre'} ·{' '}
                            {series.type || 'Weekly'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {series.rating && (
                            <span className="text-[10px] font-bold text-sky-500 bg-sky-500/5 px-2 py-0.5 rounded-lg border border-sky-500/10">
                              {series.rating}% Score
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${series.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}
                          >
                            {series.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'series' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-2xl font-black text-foreground">Series</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {supervisedSeries.length} series found
            </p>
          </div>

          {/* Search and Filters row */}
          <div className="flex flex-col gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary/40 text-foreground"
                />
              </div>

              {/* Genre filter */}
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none appearance-none cursor-pointer font-semibold"
                >
                  <option>All Genres</option>
                  <option>Shōnen</option>
                  <option>Shōjo</option>
                  <option>Seinen</option>
                  <option>Fantasy</option>
                  <option>Slice of Life</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Type filter */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none appearance-none cursor-pointer font-semibold"
                >
                  <option>All Types</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Bi-Weekly</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Status filters horizontal list */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {[
                'All',
                'Proposed',
                'Under Review',
                'Approved',
                'Active',
                'On-Hold',
                'Cancelled',
              ].map((status) => {
                const isActive = selectedStatus === status
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                  >
                    {status}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grid display of series cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {supervisedSeries
              .filter((s) => {
                // Apply Search query
                if (
                  searchQuery &&
                  !s.title.toLowerCase().includes(searchQuery.toLowerCase())
                ) {
                  return false
                }
                // Apply Genre filter
                if (
                  selectedGenre !== 'All Genres' &&
                  (!s.genre || !s.genre.includes(selectedGenre))
                ) {
                  return false
                }
                // Apply Type filter
                if (selectedType !== 'All Types' && s.type !== selectedType) {
                  return false
                }
                // Apply Status filter
                if (
                  selectedStatus !== 'All' &&
                  s.status?.replace(' ', '').toLowerCase() !==
                  selectedStatus.replace(' ', '').toLowerCase()
                ) {
                  return false
                }
                return true
              })
              .map((series, idx) => {
                // Get display code S01, S02...
                const displayCode = `S${String(idx + 1).padStart(2, '0')}`

                return (
                  <div
                    key={series.id}
                    className="bg-card border border-border hover:border-primary/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Top Accent Row */}
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${series.status === 'Active' || series.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : series.status === 'Under Review' || series.status === 'UnderReview'
                              ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                              : series.status === 'BoardVoting' || series.status === 'Board Voting'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : series.status === 'Rejected'
                                  ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                  : 'bg-muted text-muted-foreground border-border'
                            }`}
                        >
                          {series.status === 'UnderReview' ? 'Under Review' : series.status === 'BoardVoting' ? 'Board Voting' : (series.status || 'Active')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono font-bold">
                          {displayCode}
                        </span>
                      </div>

                      {/* Title & Info */}
                      <h3 className="font-extrabold text-base text-foreground mt-3 group-hover:text-primary transition-colors">
                        {series.title}
                      </h3>

                      {/* Genre pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {series.genre?.slice(0, 3).map((g: string) => (
                          <span
                            key={g}
                            className="bg-muted text-muted-foreground text-[9px] font-bold px-2 py-0.5 rounded"
                          >
                            {g}
                          </span>
                        ))}
                        {series.type && (
                          <span className="bg-primary/5 text-primary text-[9px] font-bold px-2 py-0.5 rounded border border-primary/10">
                            {series.type}
                          </span>
                        )}
                      </div>

                      {/* Description snippet */}
                      <p className="text-xs text-muted-foreground leading-relaxed mt-3.5 line-clamp-3">
                        {series.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Bottom Metadata row */}
                    <div className="pt-3 border-t border-border/40 flex items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-foreground truncate flex items-center">
                          <PencilLine className="w-3.5 h-3.5 mr-1 text-primary shrink-0" /> {series.author || 'Unknown Mangaka'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {activeTab === 'proposals' && (() => {
        const getIntakeStatusBadge = (status: string) => {
          let bg = 'bg-gray-500/20';
          let dot = 'bg-gray-400';

          const normalizedStatus = (status || '').trim();

          if (normalizedStatus === 'Approved' || normalizedStatus === 'Active') {
            bg = 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20';
            dot = 'bg-emerald-500';
          } else if (normalizedStatus === 'Under Review' || normalizedStatus === 'UnderReview') {
            // Mangaka submitted → Tantou reviewing
            bg = 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/20';
            dot = 'bg-indigo-500';
          } else if (normalizedStatus === 'BoardVoting' || normalizedStatus === 'Board Voting') {
            // Tantou approved → Editorial Board voting
            bg = 'bg-blue-500/15 text-blue-600 border border-blue-500/20';
            dot = 'bg-blue-500';
          } else if (normalizedStatus === 'Proposed' || normalizedStatus === 'Pending Review' || normalizedStatus === 'PendingReview') {
            bg = 'bg-amber-500/15 text-amber-600 border border-amber-500/20';
            dot = 'bg-amber-500';
          } else if (normalizedStatus === 'Rejected') {
            bg = 'bg-red-500/15 text-red-600 border border-red-500/20';
            dot = 'bg-red-500';
          }

          const displayLabel = normalizedStatus === 'UnderReview' ? 'Under Review'
            : normalizedStatus === 'BoardVoting' ? 'Board Voting'
            : normalizedStatus === 'PendingReview' ? 'Pending Review'
            : normalizedStatus;

          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {displayLabel}
            </span>
          );
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {selectedProposalId ? (
              /* Detailed Proposal Review View */
              (() => {
                const baseProposal = seriesList.find((s) => s.id === selectedProposalId)
                if (!baseProposal) return <p className="text-sm text-muted-foreground">Proposal not found.</p>

                const proposal: any = detailedProposal && detailedProposal.id === selectedProposalId
                  ? detailedProposal
                  : baseProposal

                const samplePages = proposal.samplePages || ((proposal.title.length % 5) + 6);
                const deadlineDate = proposal.submittedAt ? new Date(proposal.submittedAt) : new Date(proposal.createdAt || Date.now());
                deadlineDate.setDate(deadlineDate.getDate() + 7);
                const deadlineStr = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const isOverdue = (proposal.status === 'Proposed' || proposal.status === 'Pending Review' || proposal.status === 'PendingReview') && new Date() > deadlineDate;
                const escalated = isOverdue;
                const informationComplete = proposal.status !== 'Proposed';

                const handleUpdateStatus = async (status: string, rejectReason?: string) => {
                  try {
                    await seriesService.updateProposalStatus(proposal.id, status, rejectReason)
                    const displayStatus = (status === 'BoardVoting') ? 'Board Voting' : status;
                    toast.success(`Proposal status successfully updated to "${displayStatus}"!`)
                    setShowRejectInput(false)
                    setRejectReasonText('')
                    setSelectedProposalId(null)
                    // Refresh data
                    const list = await seriesService.listSeries()
                    setSeriesList(list)
                  } catch (e: any) {
                    toast.error(e.message || `Failed to update status to ${status}`)
                  }
                }

                const handleRejectSubmit = async () => {
                  if (!rejectReasonText.trim()) {
                    toast.error('Please provide a reason for rejection')
                    return
                  }
                  await handleUpdateStatus('Rejected', rejectReasonText.trim())
                }

                return (
                  <div className="space-y-6">
                    {/* Back header */}
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                      <button
                        onClick={() => {
                          setSelectedProposalId(null);
                          setShowRejectInput(false);
                          setRejectReasonText('');
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
                          Submitted by {proposal.author} · Status: {getIntakeStatusBadge(proposal.status)}
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                          {escalated && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" /> Escalated
                            </span>
                          )}
                          {informationComplete && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> Info Complete
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Left: Combined Cover, Metadata & Evaluation Panel */}
                      <div className="space-y-6">
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                            Cover Artwork, Metadata & Evaluation
                          </h3>

                          {/* Image & Metadata Row */}
                          <div className="flex gap-4">
                            {/* Image Container */}
                            <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
                              {proposal.coverImageUrl ? (
                                <img
                                  src={proposal.coverImageUrl}
                                  alt={proposal.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${proposal.coverColor || 'from-primary to-primary/60'} p-3 flex flex-col justify-between text-white`}>
                                  <div className="w-6 h-6 rounded bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-[9px] uppercase">
                                    MF
                                  </div>
                                  <span className="font-black text-xs tracking-tight leading-snug drop-shadow-sm line-clamp-3">
                                    {proposal.title}
                                  </span>
                                  <span className="text-[8px] font-medium opacity-80 truncate">
                                    By {proposal.author}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Metadata */}
                            <div className="flex-1 min-w-0 space-y-2 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">Mangaka</span>
                                <span className="font-extrabold text-foreground text-sm block truncate">{proposal.author}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">Publication Type</span>
                                <span className="font-bold text-foreground capitalize block">{proposal.type || 'Weekly'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase block tracking-wider">Genre</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {proposal.genre && proposal.genre.length > 0 ? (
                                    proposal.genre.map((g: string) => (
                                      <span key={g} className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-bold text-muted-foreground">
                                        {g}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Extra Metadata Details */}
                          <div className="space-y-2 pt-2 text-xs border-t border-border/40">
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground font-semibold">Date Submitted</span>
                              <span className="font-bold text-foreground">
                                {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : (proposal.status === 'Draft' ? 'Draft' : 'N/A')}
                              </span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-muted-foreground font-semibold">Review Deadline</span>
                              <span className={`font-bold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                                {deadlineStr}
                              </span>
                            </div>
                          </div>

                          {/* Evaluation Section */}
                          <div className="pt-4 border-t border-border/40 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                                Direct Editor Evaluation
                              </h4>
                              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
                                ACTION REQUIRED
                              </span>
                            </div>

                            {/* Show evaluation panel for proposals pending Tantou action: UnderReview from BE */}
                            {['UnderReview', 'Under Review', 'Proposed', 'PendingReview', 'Pending Review'].includes(proposal.status) ? (
                              <div className="space-y-4">
                                <div className="p-3 bg-muted/30 border border-border/80 rounded-xl space-y-1.5">
                                  <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Your Evaluation
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground leading-normal">
                                    As the assigned Tantou Editor, you must review this submission.
                                    Approving it changes its status to <strong>Board Voting</strong>. Rejecting it marks it as <strong>Rejected</strong>.
                                  </p>
                                </div>

                                {showRejectInput ? (
                                  <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3 animate-in slide-in-from-top-2">
                                    <label className="text-xs font-extrabold text-destructive flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4" /> Rejection Reason
                                    </label>
                                    <textarea
                                      value={rejectReasonText}
                                      onChange={(e) => setRejectReasonText(e.target.value)}
                                      placeholder="Explain why this proposal is being rejected... (This will be sent to the Mangaka)"
                                      className="w-full p-2.5 bg-card border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground resize-none"
                                      rows={4}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setShowRejectInput(false);
                                          setRejectReasonText('');
                                        }}
                                        className="px-2.5 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted text-muted-foreground"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleRejectSubmit}
                                        className="px-2.5 py-1.5 bg-destructive hover:bg-destructive/95 text-destructive-foreground rounded-lg text-xs font-bold"
                                      >
                                        Confirm Rejection
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                    <button
                                      onClick={() => handleUpdateStatus('BoardVoting')}
                                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Send to Board
                                    </button>
                                    <button
                                      onClick={() => setShowRejectInput(true)}
                                      className="flex-1 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-[10px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                                    >
                                      <X className="w-3.5 h-3.5" /> Reject Proposal
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-4 bg-muted/40 border border-border rounded-xl flex items-center gap-3">
                                  {proposal.status === 'Board Voting' || proposal.status === 'BoardVoting' ? (
                                    <>
                                      <Clock className="w-7 h-7 text-amber-500 shrink-0" />
                                      <div className="space-y-0.5">
                                        <p className="text-[11px] font-extrabold text-foreground">Under Board Review</p>
                                        <p className="text-[9px] text-muted-foreground">Currently being voted on by the Editorial Board.</p>
                                      </div>
                                    </>
                                  ) : proposal.status === 'Approved' || proposal.status === 'Active' ? (
                                    <>
                                      <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
                                      <div className="space-y-0.5">
                                        <p className="text-[11px] font-extrabold text-foreground">
                                          {proposal.rawStatus === 'Approved' ? 'Proposal Approved' : 'Approved & Active'}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground">
                                          {proposal.rawStatus === 'Approved'
                                            ? 'Approved by the Editorial Board. You can now activate it.'
                                            : 'Approved and activated as an official series.'}
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-7 h-7 text-destructive shrink-0" />
                                      <div className="space-y-0.5">
                                        <p className="text-[11px] font-extrabold text-foreground">Proposal Rejected</p>
                                        <p className="text-[9px] text-muted-foreground">This proposal has been rejected.</p>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {proposal.rawStatus === 'Approved' && (
                                  <div className="pt-1">
                                    <button
                                      onClick={() => handleUpdateStatus('Active')}
                                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                                    >
                                      <CheckCircle2 className="w-4 h-4" /> Activate Series
                                    </button>
                                  </div>
                                )}

                                {proposal.status === 'Rejected' && proposal.rejectReason && (
                                  <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1 text-[11px]">
                                    <p className="text-[9px] font-extrabold text-destructive uppercase tracking-wider">
                                      Editor Rejection Feedback:
                                    </p>
                                    <p className="text-muted-foreground italic leading-normal">
                                      "{proposal.rejectReason}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Synopsis & Actions */}
                      <div className="xl:col-span-2 space-y-6">
                        {/* Synopsis Card */}
                        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
                          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                            Proposal Synopsis
                          </h3>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                            {proposal.description || 'No synopsis provided.'}
                          </p>
                        </div>

                        {/* ZIP File Attachment Panel */}
                        {proposal.sourceZipPublicUrl || proposal.sourceZipFile || proposal.sourceZipFileAssetId || proposal.sampleFileUrl ? (
                          (() => {
                            const zipDownloadUrl = proposal.sourceZipPublicUrl
                              || proposal.sourceZipFile?.url
                              || (proposal.sourceZipFileAssetId
                                ? `${API_BASE_URL}/api/files/${proposal.sourceZipFileAssetId}`
                                : proposal.sampleFileUrl?.startsWith('http')
                                  ? proposal.sampleFileUrl
                                  : proposal.sampleFileUrl
                                    ? `${API_BASE_URL}/api/files/${proposal.sampleFileUrl}`
                                    : '');

                            const zipFileName = proposal.sourceZipFile?.fileName
                              || (proposal.sourceZipFileAssetId || proposal.sourceZipPublicUrl
                                ? `source_manuscript_${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.zip`
                                : `sample_pages_${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.zip`);

                            const isLegacy = !proposal.sourceZipPublicUrl && !proposal.sourceZipFile && !proposal.sourceZipFileAssetId && !!proposal.sampleFileUrl;

                            return (
                              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLegacy ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                                    {isLegacy ? <FileText className="w-6 h-6" /> : <FileArchive className="w-6 h-6" />}
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-bold text-foreground">
                                      {isLegacy ? 'Attached Sample Images Package' : 'Attached ZIP Manuscript Package'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      {isLegacy ? 'Legacy comma-separated image file sequence' : 'Original source files uploaded by the Mangaka'}
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
                        ) : (
                          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-sm min-h-[160px]">
                            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40">
                              <FileArchive className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-foreground">No ZIP Package Uploaded</h4>
                              <p className="text-[10px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                                This proposal does not have any attached ZIP packages or sample files from the creator.
                              </p>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              /* Proposal List View */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Proposal Review</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manage and evaluate proposals submitted by your assigned Mangakas.
                    </p>
                  </div>
                  <div className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full shrink-0">
                    {supervisedSeries.filter(p => (p.status || '').toLowerCase() !== 'draft').length} Total Proposals
                  </div>
                </div>

                {/* Filters & Search Row */}
                <div className="flex flex-col gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search proposals by title or author..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary/40 text-foreground"
                      />
                    </div>

                    {/* Status selection */}
                    <div className="relative">
                      <select
                        value={proposalFilter}
                        onChange={(e) => setProposalFilter(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none appearance-none cursor-pointer font-bold"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Under Review">Under Review (Awaiting Your Decision)</option>
                        <option value="BoardVoting">Board Voting (At Editorial Board)</option>
                        <option value="Approved">Approved / Active</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Proposals List Grid */}
                {(() => {
                  const filtered = supervisedSeries.filter((p) => {
                    // Always hide Draft proposals
                    if ((p.status || '').toLowerCase() === 'draft') return false;

                    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.author.toLowerCase().includes(searchQuery.toLowerCase());
                    if (proposalFilter === 'All') return matchesSearch;

                    const pStatus = (p.status || '').toLowerCase().replace(/[\s_]+/g, '');
                    const filterVal = proposalFilter.toLowerCase().replace(/[\s_]+/g, '');
                    return matchesSearch && pStatus === filterVal;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-4">
                        <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                        <div>
                          <h3 className="font-bold text-lg text-foreground">No proposals found</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Try adjusting your filters or search terms.
                          </p>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4">
                      {filtered.map((proposal) => {
                        const deadlineDate = proposal.submittedAt ? new Date(proposal.submittedAt) : new Date(proposal.createdAt || Date.now());
                        deadlineDate.setDate(deadlineDate.getDate() + 7);
                        const deadlineStr = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const isOverdue = (proposal.status === 'Under Review' || proposal.status === 'UnderReview') && new Date() > deadlineDate;
                        const escalated = isOverdue;
                        const informationComplete = proposal.status !== 'UnderReview' && proposal.status !== 'Under Review';
                        const isRejected =
                          proposal.status?.toLowerCase() === 'rejected';
                        const isApprovedOrActive =
                          proposal.status?.toLowerCase() === 'approved' ||
                          proposal.status?.toLowerCase() === 'active';

                        return (
                          <div
                            key={proposal.id}
                            className={`bg-card border border-border border-l-4 p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-2xl hover:shadow-md transition-all ${isOverdue ? 'border-l-destructive' : 'border-l-primary'
                              }`}
                          >
                            {/* Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-foreground text-base">{proposal.title}</h3>
                                {getIntakeStatusBadge(proposal.status)}
                                {isOverdue && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" /> Overdue
                                  </span>
                                )}
                                {escalated && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    <AlertTriangle className="w-3 h-3" /> Escalated
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-6 gap-y-2">
                                <span className="flex items-center gap-1.5 font-semibold">
                                  <Users className="w-3.5 h-3.5 text-primary" /> Author: <strong className="text-foreground">{proposal.author || 'Unknown'}</strong>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Submitted:{' '}
                                  <strong className="text-foreground">
                                    {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : (proposal.status === 'Draft' ? 'Draft' : 'N/A')}
                                  </strong>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Deadline:{' '}
                                  <strong className={isOverdue ? 'text-destructive font-bold' : 'text-foreground'}>
                                    {deadlineStr}
                                  </strong>
                                </span>
                              </div>

                              <div className="flex gap-2 flex-wrap pt-0.5">
                                {informationComplete && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                    <CheckCircle className="w-3.5 h-3.5" /> Info Complete
                                  </span>
                                )}
                                <span className="bg-muted px-2 py-0.5 rounded text-[9px] font-bold text-muted-foreground uppercase">
                                  {proposal.type || 'Weekly'}
                                </span>
                                {proposal.genre?.slice(0, 2).map((g: string) => (
                                  <span key={g} className="bg-primary/5 px-2 py-0.5 rounded text-[9px] font-bold text-primary border border-primary/10 uppercase">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 w-full md:w-auto">
                              {!isRejected && (
                                <button
                                  onClick={() => setSelectedProposalId(proposal.id)}
                                  className={`w-full md:w-auto px-4 py-2.5 text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                                    isApprovedOrActive
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-primary hover:bg-primary/95 text-primary-foreground'
                                  }`}
                                >
                                  <FileText className="w-4 h-4" />
                                  {isApprovedOrActive ? 'View Details' : 'Review & Decide'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'manuscripts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {activeManuscript ? (
            /* Detailed Manuscript Review View */
            <div className="space-y-6">
              {/* Back header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToManuscripts}
                    className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
                    title="Back to List"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-foreground">
                      Reviewing: {activeManuscript.seriesTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      Chapter {activeManuscript.chapterNumber}: "{activeManuscript.chapterTitle}" • Version {activeManuscript.latestVersion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60 text-muted-foreground font-bold">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Completion: <strong>{activeManuscript.progress}%</strong>
                  </span>
                </div>
              </div>

              {/* Grid: Storyboard Page preview + annotations + decisions */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left side: previews & annotations */}
                <div className="xl:col-span-2 space-y-5">
                  <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Manuscript File Attachment
                  </h3>

                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <FileArchive className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          Bản thảo đã nộp (Manuscript File)
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Tập tin đính kèm của Mangaka cho phiên bản {activeManuscript.latestVersion}
                        </p>
                      </div>
                    </div>

                    {activeManuscript.fileUrl ? (
                      <div className="p-4 bg-muted/30 border border-border/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">
                            {activeManuscript.fileUrl.split('/').pop() || 'manuscript_file'}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            URL: {activeManuscript.fileUrl}
                          </p>
                        </div>
                        <a
                          href={activeManuscript.fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 py-2 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-extrabold rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                        >
                          <Download className="w-4 h-4" /> Tải về Bản thảo
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-600 font-medium">
                        Không tìm thấy liên kết file cho phiên bản này.
                      </div>
                    )}
                  </div>

                  {/* Annotations */}
                  <div className="bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wide text-foreground">
                        Annotations (BR-78 bound)
                      </h4>
                      <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/65">
                        Locked to {activeManuscript.latestVersion}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {annotations.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No annotations added to this version yet.
                        </p>
                      ) : (
                        annotations.map((ann) => (
                          <div
                            key={ann.id}
                            className="p-3 bg-muted/30 border border-border/30 rounded-xl space-y-1 text-xs"
                          >
                            <p className="text-foreground font-semibold">{ann.text}</p>
                            <p className="text-[9px] text-muted-foreground/60">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Annotation Form */}
                    <form onSubmit={handleAddAnnotationSubmit} className="flex gap-2 pt-2 border-t border-border/30">
                      <input
                        type="text"
                        placeholder="Type storyboard annotations..."
                        value={newAnnotationText}
                        onChange={(e) => setNewAnnotationText(e.target.value)}
                        className="flex-1 px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary/40 text-foreground"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-primary text-primary-foreground font-extrabold text-xs rounded-xl px-4 hover:bg-primary/95 transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right side: Evaluation Decisions */}
                <div className="space-y-5">
                  <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Evaluation Panel
                  </h3>
                  <div className="bg-card border border-border p-5 rounded-2xl space-y-5 shadow-sm">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">
                        Submit Review Outcome
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Evaluate the manuscript storyboard draft. Approvals lock the manuscript and prepare it for publication.
                      </p>
                    </div>

                    {/* BR-84 Warning banner if progress < 100% */}
                    {activeManuscript.progress < 100 && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 rounded-xl text-xs font-bold leading-normal">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          BR-84 Warning: Chapter drawing progress is only {activeManuscript.progress}%. Approval is disabled until it reaches 100%.
                        </span>
                      </div>
                    )}

                    {/* Editorial Feedback */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Feedback Message
                      </label>
                      <textarea
                        placeholder="Write feedback comments for the mangaka..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        rows={4}
                        className="w-full p-3 bg-muted/30 border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 gap-2">
                      {activeManuscript.status === 'APPROVED' ? (
                        <button
                          onClick={() => handlePublishManuscript(activeManuscript)}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <FileCheck className="w-4 h-4" /> Publish Manuscript
                        </button>
                      ) : activeManuscript.status === 'PUBLISHED' ? (
                        <div className="w-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Published
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDecision('APPROVED')}
                            disabled={activeManuscript.progress < 100}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve & Lock (BR-80)
                          </button>
                          <button
                            onClick={() => handleDecision('REVISION REQUIRED')}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <AlertTriangle className="w-4 h-4" /> Request Revision
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Manuscripts List View */
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-foreground">Manuscripts</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage manuscript submissions and editorial reviews
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {manuscripts
                  .filter((m) => supervisedSeries.some((s) => s.id === m.seriesId))
                  .map((m) => {
                    const latestVer = m.history?.[0] || {
                      version: m.latestVersion,
                      status: m.status,
                      submittedAt: new Date().toISOString(),
                    }

                    return (
                      <div
                        key={m.id}
                        className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4 hover:border-primary/20 transition-all"
                      >
                        {/* Header details */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-foreground">
                                {m.seriesTitle} — Ch.{m.chapterNumber} "{m.chapterTitle}"
                              </h3>
                              <span className="text-[10px] font-mono bg-muted border border-border/80 text-muted-foreground px-1.5 py-0.5 rounded">
                                {m.id}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                              Latest Version: <span className="text-foreground">{m.latestVersion}</span> • Cycles: {m.history?.length || 1}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border ${m.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : m.status === 'PUBLISHED'
                                  ? 'bg-primary/10 text-primary border-primary/20'
                                : m.status === 'REVISION REQUIRED'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse'
                                }`}
                            >
                              {m.status}
                            </span>

                            {m.status === 'SUBMITTED' && (
                              <button
                                onClick={() => handleOpenReview(m.id)}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm"
                              >
                                Review
                              </button>
                            )}
                            {m.status === 'APPROVED' && (
                              <button
                                onClick={() => handlePublishManuscript(m)}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground font-black text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors shadow-sm"
                              >
                                Publish
                              </button>
                            )}
                            {m.status === 'PUBLISHED' && (
                              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black text-[10px] uppercase tracking-wide px-3.5 py-1.5 rounded-xl">
                                Published
                              </span>
                            )}
                          </div>
                        </div>

                        {/* History cycle list inside card */}
                        <div className="space-y-2.5 pt-3.5 border-t border-border/40">
                          {m.history?.map((h, hIdx) => (
                            <div
                              key={hIdx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/30 border border-border/30 p-3 rounded-xl"
                            >
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-black text-foreground">{h.version}</span>
                                <span
                                  className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${h.status === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : h.status === 'PUBLISHED'
                                      ? 'bg-primary/10 text-primary border-primary/20'
                                    : h.status === 'REVISION REQUIRED'
                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                      : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                    }`}
                                >
                                  {h.status}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">
                                  Submitted: {new Date(h.submittedAt).toLocaleDateString()}
                                </span>
                                {h.reviewedAt && (
                                  <span className="text-[10px] text-muted-foreground/60">
                                    Reviewed: {new Date(h.reviewedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              {h.revisionNumber && (
                                <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-black text-[9px] rounded px-2 py-0.5">
                                  REV #{h.revisionNumber}/3 (BR-83)
                                </span>
                              )}
                            </div>
                          ))}

                          {/* Latest Editor Feedback */}
                          {latestVer.feedback && (
                            <div className="bg-muted/40 p-4 rounded-xl border border-border/40 text-xs">
                              <p className="text-[9px] font-extrabold text-primary uppercase tracking-wider">
                                Editor Feedback:
                              </p>
                              <p className="text-muted-foreground mt-1 italic leading-normal">
                                "{latestVer.feedback}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Lightbox Modal */}
      {lightboxOpen && detailedProposal && (
        (() => {
          const previewPages = detailedProposal.proposalPages && detailedProposal.proposalPages.length > 0
            ? detailedProposal.proposalPages
            : (detailedProposal.sampleFileUrl || '')
              .split(',')
              .filter(Boolean)
              .map((id: string, idx: number) => ({
                pageNo: idx + 1,
                previewFileAssetId: id.trim(),
                url: undefined as string | undefined,
              }));

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

              {/* Footer Control Info & Mobile Navigation */}
              <div className="w-full max-w-5xl flex flex-col items-center gap-3 z-10 text-white/60 text-[10px] pb-4">
                <div className="flex items-center gap-4 md:hidden">
                  <button
                    onClick={handlePrev}
                    className="py-1.5 px-3 bg-white/15 active:bg-white/20 rounded-lg text-white font-bold"
                  >
                    Prev
                  </button>
                  <span className="font-bold">
                    {lightboxActiveIndex + 1} / {previewPages.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className="py-1.5 px-3 bg-white/15 active:bg-white/20 rounded-lg text-white font-bold"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden md:block text-[10px] font-medium tracking-wide">
                  Use <kbd className="px-1.5 py-0.5 bg-white/15 rounded text-[8px] font-mono">←</kbd> and{" "}
                  <kbd className="px-1.5 py-0.5 bg-white/15 rounded text-[8px] font-mono">→</kbd> keys to navigate,{" "}
                  <kbd className="px-1.5 py-0.5 bg-white/15 rounded text-[8px] font-mono">ESC</kbd> to close.
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  )
}

export default function TantouEditorDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading workspace...
          </p>
        </div>
      }
    >
      <TantouEditorWorkspace />
    </Suspense>
  )
}
