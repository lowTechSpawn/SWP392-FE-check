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
  getChapters,
  getTasks,
  updateChapterStatus,
  type Chapter,
  type Task,
  type ChapterStatus,
} from '@/lib/chapters-store'
import {
  getManuscripts,
  getAnnotations,
  addAnnotation,
  updateManuscriptStatus,
  syncManuscriptsFromBackend,
  syncAnnotationsFromBackend,
  type ManuscriptItem,
  type Annotation,
} from '@/lib/manuscripts-store'
import { toast } from 'sonner'
import { seriesService } from '@/services/seriesService'
import { getUsers } from '@/lib/users-store'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'folder'
  size: string
  children?: FileItem[]
  previewType?: 'image' | 'pdf' | 'text'
  content?: string
  pageNo?: number
}

const getProposalFileTree = (title: string, numPages: number, description: string): FileItem[] => {
  const pagesList: FileItem[] = Array.from({ length: numPages }).map((_, idx) => {
    const pageNum = idx + 1
    return {
      name: `page_${pageNum.toString().padStart(2, '0')}.png`,
      path: `root/drafts/page_${pageNum.toString().padStart(2, '0')}.png`,
      type: 'file',
      size: `${(1.5 + idx * 0.1).toFixed(1)} MB`,
      previewType: 'image',
      pageNo: pageNum,
    }
  })

  return [
    {
      name: 'storyboards',
      path: 'root/storyboards',
      type: 'folder',
      size: '',
      children: [
        {
          name: 'storyboard_ch1_draft.pdf',
          path: 'root/storyboards/storyboard_ch1_draft.pdf',
          type: 'file',
          size: '5.8 MB',
          previewType: 'pdf',
          pageNo: 1,
        },
        {
          name: 'storyboard_ch2_draft.pdf',
          path: 'root/storyboards/storyboard_ch2_draft.pdf',
          type: 'file',
          size: '4.2 MB',
          previewType: 'pdf',
          pageNo: 2,
        },
      ],
    },
    {
      name: 'final_manuscript_drafts',
      path: 'root/drafts',
      type: 'folder',
      size: '',
      children: pagesList,
    },
    {
      name: 'character_concepts.pdf',
      path: 'root/character_concepts.pdf',
      type: 'file',
      size: '2.4 MB',
      previewType: 'pdf',
      pageNo: 3,
    },
    {
      name: 'world_setting_outline.txt',
      path: 'root/world_setting_outline.txt',
      type: 'file',
      size: '12 KB',
      previewType: 'text',
      content: `WORLD SETTING OUTLINE:\n\nSeries Title: ${title}\n\nKey Concepts:\n1. Main Theme & Tone\n   - A unique exploration of characters in a fantasy/slice-of-life setting.\n   - Visual pacing focuses heavily on emotional close-ups and landscape panels.\n\n2. Magic/Power System\n   - Standardized arcane rules, visual signatures for active spells.\n   - Elf magic: ancient patterns, slow but high output.\n   - Human magic: highly efficient, militaristic.\n\n3. Story Arc Structure\n   - Chapter 1: Introduction of main quest and companion relationships.\n   - Chapter 2: Journey across border mountains; encountering ancient spirits.\n\n4. Synopsis Outline:\n   ${description || 'No detailed synopsis outlines available.'}`,
    },
  ]
}

const findFileByPath = (items: FileItem[], path: string | null): FileItem | null => {
  if (!path) return null
  for (const item of items) {
    if (item.path === path) return item
    if (item.children) {
      const found = findFileByPath(item.children, path)
      if (found) return found
    }
  }
  return null
}

const MangaPageMockup = ({ pageNo }: { pageNo: number }) => (
  <svg viewBox="0 0 400 600" className="w-full h-auto bg-white border border-border shadow-md rounded-lg max-w-[320px] mx-auto select-none">
    <rect width="400" height="600" fill="#f8fafc" />
    <rect x="20" y="20" width="360" height="560" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />

    <text x="30" y="40" fontSize="10" fontFamily="monospace" fill="#94a3b8" fontWeight="bold">PAGE {pageNo} - DRAFT WORK</text>

    <rect x="30" y="60" width="340" height="180" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
    <path d="M 30,60 L 370,240" stroke="#cbd5e1" strokeWidth="1" />
    <ellipse cx="100" cy="120" rx="35" ry="25" fill="#fff" stroke="#334155" strokeWidth="1.5" />
    <text x="82" y="123" fontSize="8" fontFamily="sans-serif" fill="#000" fontWeight="bold">Himmel...</text>

    <rect x="30" y="250" width="160" height="300" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
    <ellipse cx="110" cy="380" rx="40" ry="30" fill="#fff" stroke="#334155" strokeWidth="1.5" />
    <text x="82" y="383" fontSize="8" fontFamily="sans-serif" fill="#000" fontWeight="bold">It's beautiful.</text>

    <rect x="200" y="250" width="170" height="300" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
    <line x1="200" y1="250" x2="370" y2="550" stroke="#475569" strokeWidth="1.5" />
    <line x1="370" y1="250" x2="200" y2="550" stroke="#475569" strokeWidth="1.5" />
    <ellipse cx="285" cy="400" rx="45" ry="25" fill="#fff" stroke="#334155" strokeWidth="1.5" />
    <text x="260" y="403" fontSize="9" fontFamily="sans-serif" fill="#000" fontWeight="bold">FLASSHH!</text>
  </svg>
)

const PdfPageMockup = ({ filename, page }: { filename: string; page: number }) => (
  <div className="bg-white border border-border shadow-md rounded-lg p-6 max-w-[360px] mx-auto min-h-[480px] flex flex-col justify-between text-left select-none text-slate-800">
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2 text-[10px] text-slate-400 font-mono">
        <span>DOCUMENT PREVIEW ({filename})</span>
        <span>PAGE {page} OF 8</span>
      </div>
      <div className="h-6 bg-slate-100 rounded w-3/4" />
      <div className="h-4 bg-slate-50 rounded w-1/2" />

      <div className="space-y-2.5 pt-4">
        <div className="h-3 bg-slate-50 rounded w-full" />
        <div className="h-3 bg-slate-50 rounded w-full" />
        <div className="h-3 bg-slate-50 rounded w-11/12" />
        <div className="h-3 bg-slate-50 rounded w-full" />
      </div>

      <div className="h-32 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium">
        [Storyboard Scene Outline {page}]
      </div>

      <div className="space-y-2.5">
        <div className="h-3 bg-slate-50 rounded w-full" />
        <div className="h-3 bg-slate-50 rounded w-5/6" />
      </div>
    </div>

    <div className="text-center text-[9px] text-slate-400 font-mono mt-4">
      Confidential - Manga Proposal Submission
    </div>
  </div>
)

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

  // File Explorer states for proposal reviews
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'root': true,
    'root/storyboards': true,
    'root/drafts': true,
  })
  const [explorerZoom, setExplorerZoom] = useState(100)
  const [explorerPdfPage, setExplorerPdfPage] = useState(1)

  // Reset file explorer states when proposal changes
  useEffect(() => {
    setSelectedFilePath(null)
    setExplorerZoom(100)
    setExplorerPdfPage(1)
  }, [selectedProposalId])

  // Load Data function
  const loadData = useCallback(async () => {
    let list: any[] = []
    try {
      list = await seriesService.listSeries()
    } catch (e) {
      console.error('Failed to load series from backend:', e)
    }

    // Fallback: If list is empty, load from localStorage or default seeds
    if (!list || list.length === 0) {
      if (typeof window !== 'undefined') {
        const rawProposals = localStorage.getItem('mangaflow_proposals')
        if (rawProposals) {
          try {
            const parsed = JSON.parse(rawProposals)
            list = parsed.map((p: any) => ({
              id: p.id,
              title: p.title,
              author: p.author || 'Tanaka Yuki',
              genre: Array.isArray(p.genre) ? p.genre : (p.genre ? p.genre.split(', ') : ['Fantasy']),
              type: p.type || 'Weekly',
              status: p.status,
              description: p.description || p.synopsis || '',
              mangakaId: p.mangakaId || 'U01',
              tantouEditorId: p.tantouEditorId || 'U06',
              tantouEditorName: p.tantouEditorName || 'Nakamura Takeshi',
              rating: p.rating || 4.8
            }))
          } catch {}
        }
      }
    }

    // If still empty (e.g. first run), load default Sakura Knights seed
    if (!list || list.length === 0) {
      list = [
        {
          id: 'S01',
          title: 'Sakura Knights',
          author: 'Tanaka Yuki',
          genre: ['Action', 'Fantasy'],
          type: 'Weekly',
          status: 'Active',
          description: 'In feudal Japan reimagined with magitech armor...',
          mangakaId: 'U01',
          tantouEditorId: 'U06',
          tantouEditorName: 'Nakamura Takeshi',
          rating: 4.8
        }
      ]
    } else {
      // Ensure mock series 'S01' is always in the list to enable testing mock manuscripts
      const hasS01 = list.some(s => s.id === 'S01');
      if (!hasS01) {
        list.push({
          id: 'S01',
          title: 'Sakura Knights',
          author: 'Tanaka Yuki',
          genre: ['Action', 'Fantasy'],
          type: 'Weekly',
          status: 'Active',
          description: 'In feudal Japan reimagined with magitech armor...',
          mangakaId: 'U01',
          tantouEditorId: 'U06',
          tantouEditorName: 'Nakamura Takeshi',
          rating: 4.8
        });
      }
    }

    setSeriesList(list)
    setChapters(getChapters())
    setTasks(getTasks())
    setManuscripts(getManuscripts())

    // Background sync manuscripts
    try {
      const synced = await syncManuscriptsFromBackend()
      if (synced) setManuscripts(synced)
    } catch (e) {
      console.warn('Failed to sync manuscripts from backend:', e)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.id) {
        setCurrentUserId(parsed.id)
      }
      if (parsed?.name || parsed?.displayName || parsed?.userName || parsed?.username) {
        setCurrentUserName(parsed.name || parsed.displayName || parsed.username || parsed.userName)
      }
      let mangakas = parsed?.assignedMangakas || []
      if (mangakas.length === 0 && parsed?.id) {
        try {
          const localUsers = getUsers()
          mangakas = localUsers.filter(u => 
            u.role === 'Mangaka' && 
            (u.editorId?.toLowerCase() === parsed.id.toLowerCase() || u.editorId === 'U01')
          ).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email
          }))
        } catch {}
      }
      setAssignedMangakas(mangakas)
    }
    loadData()
  }, [loadData])

  // Sync annotations when active manuscript changes in review mode
  const activeManuscript = useMemo(() => {
    return manuscripts.find((m) => m.id === activeManuscriptId)
  }, [manuscripts, activeManuscriptId])

  useEffect(() => {
    if (activeManuscript) {
      setAnnotations(getAnnotations(activeManuscript.id, activeManuscript.latestVersion))
      syncAnnotationsFromBackend(activeManuscript.id)
        .then((synced) => {
          if (synced) setAnnotations(synced)
        })
        .catch((e) => console.warn(e))
    }
  }, [activeManuscript])

  // Filtered Supervised Series list for this editor
  const supervisedSeries = useMemo(() => {
    let assignedMangakaIds: string[] = []
    let assignedEmails: string[] = []

    if (assignedMangakas && assignedMangakas.length > 0) {
      assignedMangakaIds = assignedMangakas.map(m => m.id.toLowerCase());
      assignedEmails = assignedMangakas.map(m => m.email.toLowerCase());
    }

    try {
      const localUsers = getUsers()
      const myMangakas = localUsers.filter(u => 
        u.role === 'Mangaka' && 
        (u.editorId?.toLowerCase() === currentUserId?.toLowerCase() || u.editorId === 'U01')
      )
      myMangakas.forEach(m => {
        assignedMangakaIds.push(m.id.toLowerCase())
        assignedMangakaIds.push(m.username.toLowerCase())
        if (m.email) assignedEmails.push(m.email.toLowerCase())
      })
    } catch (err) {
      console.warn("Failed to load local users for assignments", err)
    }

    const filtered = seriesList.filter((s) => {
      // 1. Match by tantouEditorId if returned by backend
      if (s.tantouEditorId?.toLowerCase() === currentUserId?.toLowerCase()) return true;

      // 2. Match by MangakaId / author
      if (s.mangakaId && assignedMangakaIds.includes(s.mangakaId.toLowerCase())) return true;
      if (s.author && assignedMangakaIds.includes(s.author.toLowerCase())) return true;

      // 3. Fallback: if we have NO assignments at all, show all proposals so the editor doesn't see an empty screen!
      if (assignedMangakaIds.length === 0) return true;

      return false;
    })
    // Always include S01 (Sakura Knights) to allow testing mock manuscripts
    const hasS01 = filtered.some(s => s.id === 'S01')
    if (!hasS01) {
      const s01 = seriesList.find(s => s.id === 'S01')
      if (s01) {
        filtered.push(s01)
      }
    }
    return filtered
  }, [seriesList, currentUserId, assignedMangakas])

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

    const ann = addAnnotation(
      activeManuscript.id,
      activeManuscript.latestVersion,
      newAnnotationText.trim()
    )
    setAnnotations((prev) => [...prev, ann])
    setNewAnnotationText('')
    toast.success('Annotation added to this version draft!')
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

    const success = updateManuscriptStatus(
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
                              {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Draft'}
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
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${series.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : series.status === 'Proposed'
                              ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                              : series.status === 'Under Review' ||
                                series.status === 'UnderReview'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                        >
                          {series.status || 'Active'}
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
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-foreground truncate flex items-center">
                          <PencilLine className="w-3.5 h-3.5 mr-1 text-primary shrink-0" /> {series.author || 'Unknown Mangaka'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {series.rating && (
                          <span className="text-[10px] font-black text-sky-500">
                            {series.rating}% score
                          </span>
                        )}
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

          const normalizedStatus = (status || 'Proposed').trim();

          if (normalizedStatus === 'Approved' || normalizedStatus === 'Active') {
            bg = 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20';
            dot = 'bg-emerald-500';
          } else if (normalizedStatus === 'Proposed' || normalizedStatus === 'Pending Review' || normalizedStatus === 'PendingReview') {
            bg = 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/20';
            dot = 'bg-indigo-500';
          } else if (normalizedStatus === 'Under Review' || normalizedStatus === 'UnderReview') {
            bg = 'bg-amber-500/15 text-amber-600 border border-amber-500/20';
            dot = 'bg-amber-500';
          } else if (normalizedStatus === 'Rejected') {
            bg = 'bg-red-500/15 text-red-600 border border-red-500/20';
            dot = 'bg-red-500';
          }

          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {normalizedStatus}
            </span>
          );
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {selectedProposalId ? (
              /* Detailed Proposal Review View */
              (() => {
                const proposal = seriesList.find((s) => s.id === selectedProposalId)
                if (!proposal) return <p className="text-sm text-muted-foreground">Proposal not found.</p>

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
                    toast.success(`Proposal status successfully updated to "${status}"!`)
                    setShowRejectInput(false)
                    setRejectReasonText('')
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
                      {/* Left: Metadata & cover */}
                      <div className="space-y-6">
                        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                            Cover Artwork & Metadata
                          </h3>
                          {proposal.coverImageUrl ? (
                            <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-sm">
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
                                By {proposal.author}
                              </span>
                            </div>
                          )}

                          <div className="space-y-3 pt-2 text-xs divide-y divide-border/40">
                            <div className="flex justify-between py-1.5">
                              <span className="text-muted-foreground font-semibold">Mangaka</span>
                              <span className="font-bold text-foreground">{proposal.author}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-muted-foreground font-semibold">Publication Type</span>
                              <span className="font-bold text-foreground uppercase">{proposal.type}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-muted-foreground font-semibold">Genres</span>
                              <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                                {proposal.genre.map((g: string) => (
                                  <span key={g} className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-muted-foreground font-semibold">Date Submitted</span>
                              <span className="font-bold text-foreground">
                                {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Draft'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-muted-foreground font-semibold">Review Deadline</span>
                              <span className={`font-bold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                                {deadlineStr}
                              </span>
                            </div>
                            {proposal.sampleFileUrl && (
                              <div className="py-2.5">
                                <a
                                  href={proposal.sampleFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all border border-primary/20"
                                >
                                  <FileText className="w-4 h-4" /> Download Sample File (.zip)
                                </a>
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

                        {/* Sample Pages Preview - Replaced with Interactive Folder Explorer */}
                        {(() => {
                          const fileTree = getProposalFileTree(proposal.title, samplePages, proposal.description);
                          const selectedFile = findFileByPath(fileTree, selectedFilePath);

                          const renderTree = (items: FileItem[], depth = 0): React.ReactNode => {
                            return items.map((item) => {
                              const isFolder = item.type === 'folder';
                              const isExpanded = expandedFolders[item.path];
                              const isSelected = selectedFilePath === item.path;

                              const toggleFolder = () => {
                                setExpandedFolders((prev) => ({
                                  ...prev,
                                  [item.path]: !prev[item.path],
                                }));
                              };

                              const handleItemClick = () => {
                                if (isFolder) {
                                  toggleFolder();
                                } else {
                                  setSelectedFilePath(item.path);
                                  if (item.previewType === 'pdf') {
                                    setExplorerPdfPage(1);
                                  }
                                }
                              };

                              return (
                                <div key={item.path} className="select-none">
                                  <div
                                    onClick={handleItemClick}
                                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                                    className={`flex items-center justify-between py-1.5 px-2.5 rounded-xl cursor-pointer transition-all duration-200 group text-xs font-semibold ${isSelected
                                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                      : 'hover:bg-muted text-foreground/80 hover:text-foreground border border-transparent'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {isFolder ? (
                                        <span className="text-muted-foreground/60 group-hover:text-primary transition-colors">
                                          {isExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          )}
                                        </span>
                                      ) : (
                                        <span className="w-3.5" />
                                      )}

                                      <span>
                                        {isFolder ? (
                                          isExpanded ? (
                                            <FolderOpen className="w-4 h-4 text-primary fill-primary/10" />
                                          ) : (
                                            <Folder className="w-4 h-4 text-primary fill-primary/10" />
                                          )
                                        ) : item.previewType === 'image' ? (
                                          <FileImage className="w-4 h-4 text-sky-500 fill-sky-500/5" />
                                        ) : item.previewType === 'pdf' ? (
                                          <BookOpen className="w-4 h-4 text-rose-500 fill-rose-500/5" />
                                        ) : (
                                          <FileText className="w-4 h-4 text-slate-500 fill-slate-500/5" />
                                        )}
                                      </span>

                                      <span className="truncate">{item.name}</span>
                                    </div>

                                    {!isFolder && item.size && (
                                      <span className="text-[10px] text-muted-foreground bg-muted group-hover:bg-background px-1.5 py-0.5 rounded font-mono transition-colors">
                                        {item.size}
                                      </span>
                                    )}
                                  </div>

                                  {isFolder && isExpanded && item.children && (
                                    <div className="mt-0.5">
                                      {renderTree(item.children, depth + 1)}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          };

                          return (
                            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
                              {/* Explorer Header */}
                              <div className="bg-muted/20 border-b border-border px-5 py-3.5 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  <FileArchive className="w-4.5 h-4.5 text-primary" />
                                  <div>
                                    <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                                      Proposal Files Explorer
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground">
                                      Interactive review of zip package documents
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
                                  ZIP SOURCE
                                </span>
                              </div>

                              {/* Explorer Grid */}
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 overflow-hidden">
                                {/* Left Tree Pane (2/5 cols) */}
                                <div className="md:col-span-2 border-r border-border overflow-y-auto p-3 bg-muted/5 space-y-1">
                                  <div className="flex items-center gap-1.5 py-1 px-2 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground/60" />
                                    <span>root_archive.zip</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {renderTree(fileTree)}
                                  </div>
                                </div>

                                {/* Right Preview Pane (3/5 cols) */}
                                <div className="md:col-span-3 overflow-hidden flex flex-col bg-card">
                                  {selectedFile ? (
                                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                                      {/* Preview Toolbar */}
                                      <div className="bg-muted/10 border-b border-border px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                                        <div className="min-w-0 pr-2">
                                          <h4 className="text-xs font-bold text-foreground truncate">
                                            {selectedFile.name}
                                          </h4>
                                          <p className="text-[9px] text-muted-foreground font-mono truncate">
                                            {selectedFile.path}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {selectedFile.previewType === 'image' && (
                                            <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                                              <button
                                                onClick={() => setExplorerZoom((prev) => Math.max(50, prev - 25))}
                                                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold border-r border-border"
                                                title="Zoom Out"
                                              >
                                                <ZoomOut className="w-3.5 h-3.5" />
                                              </button>
                                              <span className="px-2 text-[10px] font-mono text-muted-foreground font-bold">
                                                {explorerZoom}%
                                              </span>
                                              <button
                                                onClick={() => setExplorerZoom((prev) => Math.min(150, prev + 25))}
                                                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold"
                                                title="Zoom In"
                                              >
                                                <ZoomIn className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          )}
                                          <a
                                            href={proposal.sampleFileUrl || '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all border border-primary/20 flex items-center gap-1"
                                            title="Download original document"
                                          >
                                            <Download className="w-3 h-3" />
                                            <span>Get File</span>
                                          </a>
                                        </div>
                                      </div>

                                      {/* Preview Content Area */}
                                      <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-muted/5">
                                        {selectedFile.previewType === 'image' && (
                                          <div
                                            style={{ transform: `scale(${explorerZoom / 100})`, transformOrigin: 'top center' }}
                                            className="transition-transform duration-200"
                                          >
                                            <MangaPageMockup pageNo={selectedFile.pageNo || 1} />
                                          </div>
                                        )}

                                        {selectedFile.previewType === 'pdf' && (
                                          <div className="w-full flex flex-col items-center gap-3">
                                            <div className="flex items-center justify-between w-full max-w-[320px] bg-background border border-border rounded-xl px-2.5 py-1 shadow-sm text-xs">
                                              <button
                                                disabled={explorerPdfPage <= 1}
                                                onClick={() => setExplorerPdfPage((p) => p - 1)}
                                                className="px-2 py-0.5 bg-muted hover:bg-muted/80 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed text-[10px]"
                                              >
                                                Prev
                                              </button>
                                              <span className="font-bold text-muted-foreground font-mono text-[10px]">
                                                Page {explorerPdfPage} of 8
                                              </span>
                                              <button
                                                disabled={explorerPdfPage >= 8}
                                                onClick={() => setExplorerPdfPage((p) => p + 1)}
                                                className="px-2 py-0.5 bg-muted hover:bg-muted/80 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed text-[10px]"
                                              >
                                                Next
                                              </button>
                                            </div>
                                            <PdfPageMockup filename={selectedFile.name} page={explorerPdfPage} />
                                          </div>
                                        )}

                                        {selectedFile.previewType === 'text' && (
                                          <div className="w-full h-full max-w-2xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] p-4 rounded-xl overflow-auto leading-relaxed shadow-lg relative group">
                                            <pre className="whitespace-pre-wrap select-text">{selectedFile.content}</pre>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={() => {
                                                  navigator.clipboard.writeText(selectedFile.content || '');
                                                  toast.success('Outline copied to clipboard!');
                                                }}
                                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] rounded font-bold border border-slate-700"
                                              >
                                                Copy
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                                      <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/40">
                                        <Folder className="w-6 h-6" />
                                      </div>
                                      <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-foreground">No File Selected</h4>
                                        <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                                          Expand folders on the left and select any file to inspect drawings, scripts, or storyboards.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Evaluation Panel */}
                        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
                          <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                            Direct Editor Evaluation
                          </h3>

                          {proposal.status === 'Proposed' || proposal.status === 'PendingReview' || proposal.status === 'Pending Review' ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-muted/30 border border-border/80 rounded-xl space-y-2">
                                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-amber-500" /> Pending Your Evaluation
                                </h4>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  As the assigned Tantou Editor, you are responsible for the first line of evaluation.
                                  If you approve this proposal, its status will become <strong>Under Review</strong> and it will be sent to the Editorial Board for voting. If you reject it, it will be marked as <strong>Rejected</strong>.
                                </p>
                              </div>

                              {showRejectInput ? (
                                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3 animate-in slide-in-from-top-2">
                                  <label className="text-xs font-extrabold text-destructive flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Rejection Reason
                                  </label>
                                  <textarea
                                    value={rejectReasonText}
                                    onChange={(e) => setRejectReasonText(e.target.value)}
                                    placeholder="Explain why this proposal is being rejected... (This will be sent to the Mangaka)"
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
                                      onClick={handleRejectSubmit}
                                      className="px-3 py-1.5 bg-destructive hover:bg-destructive/95 text-destructive-foreground rounded-lg text-xs font-bold"
                                    >
                                      Confirm Rejection
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-3 pt-2">
                                  <button
                                    onClick={() => handleUpdateStatus('Under Review')}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                                  >
                                    <CheckCircle2 className="w-4 h-4" /> Approve & Submit to Board
                                  </button>
                                  <button
                                    onClick={() => setShowRejectInput(true)}
                                    className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                                  >
                                    <X className="w-4 h-4" /> Reject Proposal
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-5 bg-muted/40 border border-border rounded-xl flex items-center gap-3">
                                {proposal.status === 'Under Review' || proposal.status === 'UnderReview' ? (
                                  <>
                                    <Clock className="w-8 h-8 text-amber-500 shrink-0" />
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-extrabold text-foreground">Under Review by Editorial Board</p>
                                      <p className="text-[10px] text-muted-foreground">You approved this proposal. It is currently being voted on by the Editorial Board.</p>
                                    </div>
                                  </>
                                ) : proposal.status === 'Approved' || proposal.status === 'Active' ? (
                                  <>
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-extrabold text-foreground">
                                        {proposal.rawStatus === 'Approved' ? 'Proposal Approved' : 'Proposal Approved & Active'}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground">
                                        {proposal.rawStatus === 'Approved'
                                          ? 'This proposal has been approved by the Editorial Board. You can now activate it.'
                                          : 'This proposal was approved by the Editorial Board and has been activated as an official series.'}
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-8 h-8 text-destructive shrink-0" />
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-extrabold text-foreground">Proposal Rejected</p>
                                      <p className="text-[10px] text-muted-foreground">This proposal has been rejected.</p>
                                    </div>
                                  </>
                                )}
                              </div>

                              {proposal.rawStatus === 'Approved' && (
                                <div className="pt-2">
                                  <button
                                    onClick={() => handleUpdateStatus('Active')}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                                  >
                                    <CheckCircle2 className="w-4 h-4" /> Activate Series
                                  </button>
                                </div>
                              )}

                              {proposal.status === 'Rejected' && proposal.rejectReason && (
                                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-1 text-xs">
                                  <p className="text-[10px] font-extrabold text-destructive uppercase tracking-wider">
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
                    {supervisedSeries.length} Total Proposals
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
                        <option value="Proposed">Proposed (Awaiting Your Review)</option>
                        <option value="Under Review">Under Review (At Editorial Board)</option>
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
                    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.author.toLowerCase().includes(searchQuery.toLowerCase());
                    if (proposalFilter === 'All') return matchesSearch;

                    const pStatus = (p.status || 'Proposed').toLowerCase().replace(/\s+/g, '');
                    const filterVal = proposalFilter.toLowerCase().replace(/\s+/g, '');
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
                        const isOverdue = (proposal.status === 'Proposed' || proposal.status === 'Pending Review' || proposal.status === 'PendingReview') && new Date() > deadlineDate;
                        const escalated = isOverdue;
                        const informationComplete = proposal.status !== 'Proposed';

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
                                    {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Draft'}
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
                                    <CheckCircle className="w-3 h-3" /> Info Complete
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
                              <button
                                onClick={() => setSelectedProposalId(proposal.id)}
                                className="w-full md:w-auto px-4 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                              >
                                <FileText className="w-4 h-4" /> Review & Decide
                              </button>
                            </div>
                          </div>
                        )
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
                    Manuscript Draft Preview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeManuscript.pages?.map((p, idx) => (
                      <div
                        key={idx}
                        className="aspect-[3/4] rounded-2xl bg-muted/30 border border-border/80 flex flex-col justify-between p-4 shadow-sm group hover:border-primary/25 transition-all"
                      >
                        <div className="w-6 h-6 rounded-lg bg-muted text-[10px] text-muted-foreground font-bold flex items-center justify-center border border-border/30">
                          {idx + 1}
                        </div>
                        <span className="text-[11px] text-muted-foreground text-center font-bold">
                          Page {idx + 1}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50 text-center">
                          Storyboard File
                        </span>
                      </div>
                    ))}
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
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                              Latest Version: <span className="text-foreground">{m.latestVersion}</span> • Cycles: {m.history?.length || 1}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border ${m.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
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
