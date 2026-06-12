'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRole } from '@/context/RoleContext'
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  MessageSquare,
  Plus,
  BookOpen,
  ChevronRight,
  FileCheck,
  Lock,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

import {
  getManuscripts,
  getAnnotations,
  addAnnotation,
  updateManuscriptStatus,
  syncManuscriptsFromBackend,
  syncAnnotationsFromBackend,
  type ManuscriptItem,
  type Annotation
} from '@/lib/manuscripts-store'

export default function ManuscriptsPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)

  // Page States
  const [manuscripts, setManuscripts] = useState<ManuscriptItem[]>([])
  const [activeManuscriptId, setActiveManuscriptId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED'>('ALL')

  // Review Panel States
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [newAnnotationText, setNewAnnotationText] = useState('')
  const [feedbackText, setFeedbackText] = useState('')

  // Load data from store
  useEffect(() => {
    setMounted(true)
    setManuscripts(getManuscripts())

    // Background sync from Backend
    syncManuscriptsFromBackend().then((synced) => {
      setManuscripts(synced)
    })
  }, [])

  // Sync annotations when active manuscript changes
  const activeManuscript = useMemo(() => {
    return manuscripts.find(m => m.id === activeManuscriptId)
  }, [manuscripts, activeManuscriptId])

  const filteredManuscripts = useMemo(() => {
    if (activeTab === 'ALL') return manuscripts
    return manuscripts.filter(m => m.status === activeTab)
  }, [manuscripts, activeTab])

  useEffect(() => {
    if (activeManuscript) {
      setAnnotations(getAnnotations(activeManuscript.id, activeManuscript.latestVersion))

      // Background sync from Backend
      syncAnnotationsFromBackend(activeManuscript.id).then((synced) => {
        setAnnotations(synced)
      })
    }
  }, [activeManuscript])

  // Is authorized editor (Tantou Editor)
  const isTantouEditor = useMemo(() => {
    return role === 'TantouEditor'
  }, [role])

  const handleOpenReview = (id: string) => {
    setActiveManuscriptId(id)
    setNewAnnotationText('')
    setFeedbackText('')
  }

  const handleBackToList = () => {
    setActiveManuscriptId(null)
    setManuscripts(getManuscripts())
  }

  // Handle adding version-bound annotations (BR-78)
  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeManuscript || !newAnnotationText.trim()) return

    addAnnotation(activeManuscript.id, activeManuscript.latestVersion, newAnnotationText.trim()).then((ann) => {
      setAnnotations(prev => [...prev, ann])
      setNewAnnotationText('')
      toast.success('Annotation added to this version draft!')
    }).catch((err) => {
      toast.error(err.message || 'Failed to add annotation')
    })
  }

  // Handle decision outcomes (BR-80, BR-84)
  const handleDecision = (status: 'APPROVED' | 'REVISION REQUIRED') => {
    if (!activeManuscript) return

    // BR-84 Guard: Cannot approve if chapter drawing progress < 100%
    if (status === 'APPROVED' && activeManuscript.progress < 100) {
      toast.error(`BR-84 Violation: Chapter drawing progress is only ${activeManuscript.progress}%. Must be 100% to approve.`)
      return
    }

    updateManuscriptStatus(activeManuscript.id, status, feedbackText.trim()).then((success) => {
      if (success) {
        if (status === 'APPROVED') {
          toast.success(`Manuscript for "${activeManuscript.seriesTitle}" approved and locked (BR-80)!`)
        } else {
          toast.warning(`Revision requested for "${activeManuscript.seriesTitle}". Draft status updated to Revision Required.`)
        }
        handleBackToList()
      } else {
        toast.error('Failed to update manuscript review status.')
      }
    }).catch((err) => {
      toast.error(err.message || 'Failed to update manuscript review status.')
    })
  }

  const formatDateShort = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* If Reviewing a Specific Manuscript (Image 2 View) */}
      {activeManuscript ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
                title="Back to List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                  Reviewing: {activeManuscript.seriesTitle}
                </h1>
                <p className="text-xs text-muted-foreground font-semibold">
                  Chapter {activeManuscript.chapterNumber}: "{activeManuscript.chapterTitle}" • Version {activeManuscript.latestVersion}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs bg-muted px-3 py-1.5 rounded-xl border border-border/80 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Progress: <strong>{activeManuscript.progress}%</strong></span>
            </div>
          </div>

          {/* Grid Layout: Left Storyboards, Right Review panel */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Pages Preview */}
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Manuscript Storyboard Pages</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activeManuscript.pages.map((p, idx) => (
                  <div
                    key={p}
                    className="aspect-[3/4] rounded-2xl bg-[#121824] border border-border/60 flex flex-col justify-between p-4 shadow-sm group hover:border-primary/25 transition-all"
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] text-slate-400 font-bold flex items-center justify-center">
                      {idx + 5}
                    </div>
                    <span className="text-[11px] text-slate-400 text-center font-semibold">Page {idx + 5}</span>
                    <span className="text-[9px] text-slate-600 text-center">Storyboard Preview</span>
                  </div>
                ))}
              </div>

              {/* Annotations panel (BR-78) */}
              <Card className="border-border bg-card p-5 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-foreground">
                    Annotations (BR-78: version-bound)
                  </h3>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border">
                    Locked to {activeManuscript.latestVersion}
                  </span>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {annotations.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No annotations for this version</p>
                  ) : (
                    annotations.map(ann => (
                      <div key={ann.id} className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1">
                        <p className="text-xs text-foreground font-medium">{ann.text}</p>
                        <p className="text-[9px] text-muted-foreground">{formatDateShort(ann.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Annotation Form */}
                <form onSubmit={handleAddAnnotation} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add annotation..."
                    value={newAnnotationText}
                    onChange={(e) => setNewAnnotationText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-muted/65 border border-border rounded-xl text-xs focus:outline-none text-foreground"
                    required
                  />
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl px-4 cursor-pointer transition-colors">
                    Add
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right Column: Decisions Section */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Evaluation Decisions</h2>

              <Card className="border-border bg-card p-5 rounded-2xl space-y-5 shadow-sm">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">Review Decision</h3>
                  <p className="text-xs text-muted-foreground">
                    Evaluate drawing progress, annotations, and storyboard files. Note: Approvals lock the manuscript and cannot be undone.
                  </p>
                </div>

                {/* BR-84 Warning Banner */}
                {activeManuscript.progress < 100 && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-500 rounded-xl text-xs leading-relaxed font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>BR-84 Alert: Cannot approve — chapter completion is {activeManuscript.progress}%, must be 100%</span>
                  </div>
                )}

                {/* Feedback Comment box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Editorial Feedback</label>
                  <textarea
                    placeholder="Provide feedback..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground resize-none"
                  />
                </div>

                {/* Actions buttons */}
                {isTantouEditor ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    <Button
                      onClick={() => handleDecision('APPROVED')}
                      disabled={activeManuscript.progress < 100}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve (BR-80: Lock)
                    </Button>
                    <Button
                      onClick={() => handleDecision('REVISION REQUIRED')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" /> Request Revision
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted border border-border/80 rounded-xl text-[10px] text-muted-foreground text-center font-medium leading-relaxed">
                      🔒 <strong>View-only mode:</strong> Only the assigned Tantou Editor (Nakamura Takeshi) can approve or request revisions.
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 opacity-50">
                      <Button disabled className="w-full bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl">
                        Approve (BR-80: Lock)
                      </Button>
                      <Button disabled className="w-full bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl">
                        Request Revision
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Manuscripts List View (Image 1 View) */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <Layers className="w-8 h-8 text-primary" />
                Manuscripts Review
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Evaluate chapter storyboards, ink version cycles, and issue revision calls
              </p>
            </div>
            <div className="text-xs bg-card border border-border px-3.5 py-2 rounded-xl text-muted-foreground font-semibold max-w-xs shrink-0 self-start md:self-center">
              Logged in as: <strong className="text-primary">{role}</strong>
            </div>
          </div>

          {/* Status Tabs Menu */}
          <div className="flex border-b border-border">
            {[
              { id: 'ALL', label: 'Tất cả Bản thảo' },
              { id: 'SUBMITTED', label: 'Chờ Duyệt' },
              { id: 'APPROVED', label: 'Đã Phê Duyệt' },
              { id: 'REVISION REQUIRED', label: 'Yêu Cầu Sửa Đổi' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredManuscripts.map((m) => {
              const isSpecialHistoryCard = m.id === 'M04'
              const latestVer = m.history[0]

              // Status colors styling
              const getBadgeColor = (status: string) => {
                switch (status) {
                  case 'APPROVED': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20'
                  case 'SUBMITTED': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20'
                  case 'REVISION REQUIRED': return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20'
                  default: return 'bg-muted text-muted-foreground border-border'
                }
              }

              return (
                <Card
                  key={m.id}
                  className={`border border-border bg-card rounded-2xl overflow-hidden hover:border-primary/20 transition-all ${isSpecialHistoryCard ? 'border-amber-500/15' : ''
                    }`}
                >
                  <div className="p-6 space-y-4">
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base text-foreground">
                            {m.seriesTitle} — Ch. {m.chapterNumber} "{m.chapterTitle}"
                          </h3>
                          <span className="text-[10px] font-mono bg-muted border text-muted-foreground px-1.5 py-0.5 rounded">
                            {m.id}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Latest Version: <span className="font-semibold text-foreground">{m.latestVersion}</span> • Total versions: {m.history.length}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-start">
                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${getBadgeColor(m.status)}`}>
                          {m.status}
                        </span>

                        {/* Review action button: show to everyone but toggle view-only status internally */}
                        {m.status === 'SUBMITTED' && (
                          <Button
                            onClick={() => handleOpenReview(m.id)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-1.5 h-8 rounded-xl cursor-pointer transition-colors"
                          >
                            <FileCheck className="w-3.5 h-3.5 mr-1" /> Review
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Body content */}
                    {isSpecialHistoryCard ? (
                      /* Special Detailed Revision History Card (Card 1 in screenshot) */
                      <div className="space-y-3 pt-2 border-t border-border/40">
                        <div className="space-y-2">
                          {m.history.map((h, hIdx) => (
                            <div
                              key={hIdx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/40 border border-border/30 p-3 rounded-xl hover:bg-muted/65 transition-all"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground text-xs">{h.version}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(h.status)}`}>
                                  {h.status}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  Submitted: {formatDateShort(h.submittedAt)}
                                </span>
                                {h.reviewedAt && (
                                  <span className="text-muted-foreground text-[10px]">
                                    Reviewed: {formatDateShort(h.reviewedAt)}
                                  </span>
                                )}
                              </div>

                              {h.revisionNumber && (
                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 font-bold text-[9px] rounded px-1.5 py-0.5 w-fit">
                                  REV #{h.revisionNumber}/3 (BR-83)
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Editor feedback box */}
                        {latestVer.feedback && (
                          <div className="bg-muted/45 p-4 rounded-xl border border-border/50 space-y-1 text-xs">
                            <p className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Editor Feedback:</p>
                            <p className="text-muted-foreground leading-relaxed italic">
                              "{latestVer.feedback}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Simple card list layouts (Cards 2 & 3 in screenshot) */
                      <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                        {m.history.map((h, hIdx) => (
                          <div
                            key={hIdx}
                            className="flex flex-wrap items-center gap-3 bg-muted/20 border border-border/20 p-2.5 rounded-xl"
                          >
                            <span className="font-bold text-foreground">{h.version}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getBadgeColor(h.status)}`}>
                              {h.status}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              Submitted: {formatDateShort(h.submittedAt)}
                            </span>
                            {h.reviewedAt && (
                              <span className="text-muted-foreground text-[10px]">
                                Reviewed: {formatDateShort(h.reviewedAt)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
