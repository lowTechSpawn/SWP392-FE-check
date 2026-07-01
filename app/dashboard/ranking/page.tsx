'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRole } from '@/context/RoleContext'
import {
  Trophy,
  Medal,
  Plus,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  FileSpreadsheet,
  Users,
  Info,
  Check,
  Percent
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Import backend APIs and logic helpers
import { fetchAPI } from '@/services/api'
import { seriesService } from '@/services/seriesService'
import { chapterService } from '@/services/chapterService'

export interface VoteRecord {
  id: string
  seriesId: string
  seriesTitle: string
  genre: string
  chapterId: string
  chapterTitle: string
  period: string // e.g., "2026-Q2", "2026-Q1", "2025-Q4"
  readerCount: number
  voteCount: number
  score: number
  confirmed: boolean
  createdAt: string
  confirmedAt?: string
}

export interface RankingRow {
  rank: number
  seriesId: string
  seriesTitle: string
  genre: string
  voteCount: number
  readerCount: number
  score: number
  status: 'TOP 3' | 'BOTTOM 20% (BR-94)' | '—'
}

export default function RankingPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)
  
  // State variables
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-Q1')
  const [pendingVotes, setPendingVotes] = useState<VoteRecord[]>([])
  const [rankings, setRankings] = useState<RankingRow[]>([])
  const [allSeries, setAllSeries] = useState<any[]>([])
  const [availableChapters, setAvailableChapters] = useState<any[]>([])
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form states
  const [formSeriesId, setFormSeriesId] = useState('')
  const [formChapterId, setFormChapterId] = useState('')
  const [formReaderCount, setFormReaderCount] = useState<number>(0)
  const [formVoteCount, setFormVoteCount] = useState<number>(0)
  const [formPeriod, setFormPeriod] = useState('2026-Q1')
  
  const periods = ['2026-Q2', '2026-Q1', '2025-Q4']

  // Determine if active user is Authorized Admin for Vote Imports (BR-87)
  const isAuthorized = useMemo(() => {
    return role === 'EditorialBoard' || role === 'EditorInChief'
  }, [role])

  // Fetch all active series
  useEffect(() => {
    seriesService.listSeries().then((list) => {
      setAllSeries(list.map(s => ({
        id: s.id,
        title: s.title,
        genre: s.genre?.join(', ') || 'Fantasy'
      })))
    }).catch((err) => {
      console.warn("Failed to load active series:", err)
      setAllSeries([])
    })
  }, [])

  // Fetch chapters when formSeriesId changes
  useEffect(() => {
    if (!formSeriesId) {
      setAvailableChapters([])
      return
    }
    chapterService.getChaptersBySeries(formSeriesId).then((res) => {
      setAvailableChapters(res.map(c => ({
        id: c.id,
        title: `Ch. ${c.number || (c as any).chapterNo || 1}: ${c.title}`
      })))
    }).catch(() => {
      setAvailableChapters([{ id: 'C_default', title: 'Ch. 1: Storyboard Draft' }])
    })
  }, [formSeriesId])

  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [selectedPeriod, role, allSeries])

  const refreshData = async () => {
    if (allSeries.length === 0) return
    try {
      const allRecordsList = await Promise.all(
        allSeries.map(async (s) => {
          try {
            const res = await fetchAPI<{ data: any[] } | any[]>(`/api/series/${s.id}/vote-records`)
            const records = (res as any).data || res
            if (Array.isArray(records)) {
              return records.map(r => ({
                id: r.voteRecordId || r.id,
                seriesId: s.id,
                seriesTitle: s.title,
                genre: s.genre || 'Fantasy',
                chapterId: 'C_default',
                chapterTitle: `Period: ${r.period}`,
                period: r.period,
                readerCount: r.readerCount,
                voteCount: r.voteCount,
                score: Math.round(((r.voteCount / (r.readerCount || 1)) * 100) * 100) / 100,
                confirmed: r.status?.toLowerCase() === 'confirmed',
                createdAt: r.createdAt
              }))
            }
          } catch (e) {
            console.warn(`Failed to fetch vote records for series ${s.id}:`, e)
          }
          return []
        })
      )
      
      const flatRecords = allRecordsList.flat()
      setPendingVotes(flatRecords.filter(r => !r.confirmed))
      
      // Calculate rankings for the selected period
      const confirmedForPeriod = flatRecords.filter(r => r.confirmed && r.period === selectedPeriod)
      const sorted = [...confirmedForPeriod].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.voteCount - a.voteCount
      })
      const total = sorted.length
      const calculatedRankings = sorted.map((v, index) => {
        const rank = index + 1
        let status: 'TOP 3' | 'BOTTOM 20% (BR-94)' | '—' = '—'

        if (rank <= 3) {
          status = 'TOP 3'
        } else if (total >= 5) {
          const bottomCount = Math.ceil((total * 20) / 100)
          if (rank > total - bottomCount) {
            status = 'BOTTOM 20% (BR-94)'
          }
        }
        return {
          rank,
          seriesId: v.seriesId,
          seriesTitle: v.seriesTitle,
          genre: v.genre,
          voteCount: v.voteCount,
          readerCount: v.readerCount,
          score: v.score,
          status
        }
      })
      setRankings(calculatedRankings)
    } catch (err) {
      console.error("Failed to refresh ranking/votes data from backend:", err)
    }
  }

  // Get genre of a selected series
  const getSelectedSeriesGenre = (seriesId: string): string => {
    const series = allSeries.find(s => s.id === seriesId)
    return series?.genre || 'Fantasy'
  }

  // Handle vote import submission (BR-89 validations)
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formSeriesId || !formChapterId) {
      toast.error('Please select both a Series and a Chapter.')
      return
    }

    if (formReaderCount < 0 || formVoteCount < 0) {
      toast.error('Reader count and Vote count must be non-negative values.')
      return
    }

    // BR-89 constraint: readerCount >= voteCount
    if (formVoteCount > formReaderCount) {
      toast.error('Vote count cannot exceed total readers (BR-89 violation).')
      return
    }

    const payload = {
      seriesId: formSeriesId,
      period: formPeriod,
      readerCount: formReaderCount,
      voteCount: formVoteCount
    }

    fetchAPI('/api/vote-records', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(() => {
      toast.success('Vote record successfully imported as Pending Confirmation!')
      setIsDialogOpen(false)
      
      // Reset form fields
      setFormSeriesId('')
      setFormChapterId('')
      setFormReaderCount(0)
      setFormVoteCount(0)
      
      refreshData()
    }).catch((err: any) => {
      toast.error(err.message || 'Failed to import vote data.')
    })
  }

  // Handle vote confirmation (BR-92)
  const handleConfirmVote = (id: string, title: string) => {
    fetchAPI(`/api/vote-records/${id}/confirm`, {
      method: 'PUT'
    }).then(() => {
      toast.success(`Confirmed vote record for "${title}". Rankings recalculated!`)
      refreshData()
    }).catch(() => {
      toast.error('Failed to confirm vote record.')
    })
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            Series Ranking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated ranking based on reader votes (BR-90)
          </p>
        </div>

        {/* Import Button: only visible to Editorial Board or Editor-in-Chief (BR-87) */}
        {isAuthorized ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all">
                <Plus className="w-4 h-4" /> Enter Vote Data (BR-87)
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Import Reader Vote Data
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleImportSubmit} className="space-y-4 pt-3">
                {/* Select Series */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Series</label>
                  <select
                    value={formSeriesId}
                    onChange={(e) => {
                      setFormSeriesId(e.target.value)
                      setFormChapterId('')
                    }}
                    className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
                    required
                  >
                    <option value="">-- Choose a Series --</option>
                    {allSeries.map(s => (
                      <option key={s.id} value={s.id}>{s.title} ({s.id})</option>
                    ))}
                  </select>
                </div>

                {/* Select Chapter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Chapter</label>
                  <select
                    value={formChapterId}
                    onChange={(e) => setFormChapterId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
                    disabled={!formSeriesId}
                    required
                  >
                    <option value="">-- Choose a Chapter --</option>
                    {availableChapters.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Select Period */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Period</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
                    required
                  >
                    {periods.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Input Counts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Readers</label>
                    <input
                      type="number"
                      min="0"
                      value={formReaderCount}
                      onChange={(e) => setFormReaderCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Votes</label>
                    <input
                      type="number"
                      min="0"
                      value={formVoteCount}
                      onChange={(e) => setFormVoteCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl mt-2 cursor-pointer transition-colors">
                  Submit Vote Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-[11px] bg-muted/50 border border-border p-2 rounded-xl text-muted-foreground max-w-xs text-center">
            💡 <strong>Read-Only Mode:</strong> Only the Editorial Board is authorized to import ranking vote data.
          </div>
        )}
      </div>

      {/* Pending Confirmation (BR-92 Area) */}
      {pendingVotes.length > 0 && (
        <Card className="border-amber-500/25 bg-amber-500/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Pending Confirmation ({pendingVotes.length})</span>
          </div>

          <div className="space-y-3">
            {pendingVotes.map(vote => (
              <div
                key={vote.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0d1527]/60 border border-border/60 rounded-xl"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm truncate">{vote.seriesTitle}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                      {vote.period}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Readers: <strong className="text-foreground">{vote.readerCount.toLocaleString()}</strong> | Votes: <strong className="text-foreground">{vote.voteCount.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-500 mr-2">
                    Score: {vote.score}%
                  </span>
                  {isAuthorized ? (
                    <Button
                      onClick={() => handleConfirmVote(vote.id, vote.seriesTitle)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Confirm (BR-92)
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Awaiting Admin Confirmation</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Period Selector tabs */}
      <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl w-fit">
        {periods.map(p => {
          const isActive = selectedPeriod === p
          return (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {p}
            </button>
          )
        })}
      </div>

      {/* Main Ranking Table Card */}
      <Card className="border-border rounded-2xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow>
                <TableHead className="w-20 text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Rank</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Series</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Genre</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Votes</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Readers</TableHead>
                <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Score (BR-90)</TableHead>
                <TableHead className="w-48 text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {rankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-12 text-center text-muted-foreground space-y-2">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs">No ranking data confirmed for period {selectedPeriod}.</p>
                  </TableCell>
                </TableRow>
              ) : (
                rankings.map(row => {
                  // Determine Score Text styling class
                  let scoreClass = 'text-slate-600 dark:text-slate-400'
                  if (row.score >= 70) scoreClass = 'text-emerald-500 font-extrabold'
                  else if (row.score >= 40) scoreClass = 'text-amber-500 font-bold'
                  else scoreClass = 'text-rose-500 font-bold'

                  return (
                   <TableRow key={row.seriesId} className={`border-b border-border transition-colors ${
                      row.rank === 1 ? 'bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100/60' :
                      row.rank === 2 ? 'bg-slate-50 dark:bg-slate-500/5 hover:bg-slate-100/60' :
                      row.rank === 3 ? 'bg-orange-50 dark:bg-orange-500/5 hover:bg-orange-100/60' :
                      'hover:bg-muted/15'
                    }`}>
                      {/* Rank Cell */}
                      <TableCell className="text-center font-bold">
                        {row.rank === 1 ? (
                          <div className="flex flex-col items-center" title="Hạng 1">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            <span className="text-[10px] font-extrabold text-amber-600">TOP 1</span>
                          </div>
                        ) : row.rank === 2 ? (
                          <div className="flex flex-col items-center" title="Hạng 2">
                            <Medal className="w-6 h-6 text-slate-400" />
                            <span className="text-[10px] font-extrabold text-slate-500">TOP 2</span>
                          </div>
                        ) : row.rank === 3 ? (
                          <div className="flex flex-col items-center" title="Hạng 3">
                            <Medal className="w-6 h-6 text-orange-600" />
                            <span className="text-[10px] font-extrabold text-orange-600">TOP 3</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-slate-400 text-sm font-bold">
                            {row.rank}
                          </span>
                        )}
                      </TableCell>

                      {/* Title */}
                      <TableCell className="font-bold text-foreground">{row.seriesTitle}</TableCell>

                      {/* Genre */}
                      <TableCell className="text-xs text-muted-foreground font-semibold">{row.genre}</TableCell>

                      {/* Votes count */}
                      <TableCell className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {row.voteCount.toLocaleString()}
                      </TableCell>

                      {/* Readers count */}
                      <TableCell className="text-right text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {row.readerCount.toLocaleString()}
                      </TableCell>

                      {/* Vote percentage score (BR-90) */}
                      <TableCell className={`text-right text-sm ${scoreClass}`}>
                        {row.score.toFixed(2)}%
                      </TableCell>

                      {/* Status badge */}
                      <TableCell className="text-center">
                        {row.status === 'TOP 3' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                            TOP 3
                          </Badge>
                        ) : row.status === 'BOTTOM 20% (BR-94)' ? (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> BOTTOM 20% (BR-94)
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Rules Footnote */}
      <div className="flex items-start gap-2.5 p-4 bg-muted/30 border border-border/40 rounded-2xl text-[11px] text-muted-foreground leading-relaxed">
        <Info className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-foreground">BRs enforced:</span> BR-87 (Entry Authority), BR-88 (Uniqueness), BR-89 (Validation), BR-90 (Formula), BR-91 (Tie-break), BR-92 (Auto-recalculate), BR-94 (Bottom 20% flag)
        </div>
      </div>
    </div>
  )
}
