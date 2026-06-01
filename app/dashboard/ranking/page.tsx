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

// Import stores and logic helpers
import { getSeries, getChapters } from '@/lib/chapters-store'
import {
  getPendingVotes,
  getRankingsForPeriod,
  confirmVoteRecord,
  createVoteRecord,
  type VoteRecord,
  type RankingRow
} from '@/lib/ranking-store'

export default function RankingPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)
  
  // State variables
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-Q1')
  const [pendingVotes, setPendingVotes] = useState<VoteRecord[]>([])
  const [rankings, setRankings] = useState<RankingRow[]>([])
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form states
  const [formSeriesId, setFormSeriesId] = useState('')
  const [formChapterId, setFormChapterId] = useState('')
  const [formReaderCount, setFormReaderCount] = useState<number>(0)
  const [formVoteCount, setFormVoteCount] = useState<number>(0)
  const [formPeriod, setFormPeriod] = useState('2026-Q2')
  
  const periods = ['2026-Q2', '2026-Q1', '2025-Q4']

  // Determine if active user is Authorized Admin for Vote Imports (BR-87)
  const isAuthorized = useMemo(() => {
    return role === 'Editorial Board' || role === 'Editor-in-Chief'
  }, [role])

  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [selectedPeriod, role])

  const refreshData = () => {
    setPendingVotes(getPendingVotes())
    setRankings(getRankingsForPeriod(selectedPeriod))
  }

  // Generate dynamic list of available series (active + seeded ones)
  const allSeries = useMemo(() => {
    const activeSeriesList = getSeries()
    const seededList = [
      { id: 'S11', title: 'Steel Horizon', genre: 'Seinen' },
      { id: 'S12', title: 'Blade of Eternity', genre: 'Shōnen' },
      { id: 'S13', title: 'Moonlit Academy', genre: 'Shōjo' },
      { id: 'S14', title: 'Garden of Stars', genre: 'Romance' },
      { id: 'S15', title: 'Ramen Dynasty', genre: 'Slice of Life' },
      { id: 'S16', title: 'Crimson Protocol', genre: 'Action' }
    ]
    // Merge without duplicates
    const combined = [...activeSeriesList]
    seededList.forEach(s => {
      if (!combined.some(item => item.id === s.id)) {
        combined.push({
          id: s.id,
          title: s.title,
          mangakaId: 'U_seed',
          coverColor: 'from-blue-500 to-indigo-600',
          status: 'Active'
        })
      }
    })
    return combined
  }, [])

  // Generate dynamic list of chapters based on selected series
  const availableChapters = useMemo(() => {
    if (!formSeriesId) return []
    const actualChapters = getChapters(formSeriesId)
    if (actualChapters.length > 0) {
      return actualChapters.map(c => ({
        id: c.id,
        title: `Ch. ${c.number}: ${c.title}`
      }))
    }
    // Seeded series fallbacks
    switch (formSeriesId) {
      case 'S11': return [{ id: 'C101_new', title: 'Ch. 25: Iron Shield' }]
      case 'S12': return [{ id: 'C102_new', title: 'Ch. 44: Rising Phoenix' }]
      case 'S13': return [{ id: 'C103_new', title: 'Ch. 13: Moonlight Dance' }]
      case 'S14': return [{ id: 'C104_new', title: 'Ch. 19: Midnight Rose' }]
      case 'S15': return [{ id: 'C105_new', title: 'Ch. 31: Double Flavor' }]
      case 'S16': return [{ id: 'C106_new', title: 'Ch. 9: Firewall' }]
      default: return [{ id: 'C_default', title: 'Ch. 1: Storyboard Draft' }]
    }
  }, [formSeriesId])

  // Get genre of a selected series
  const getSelectedSeriesGenre = (seriesId: string): string => {
    const seededGenres: Record<string, string> = {
      S11: 'Seinen',
      S12: 'Shōnen',
      S13: 'Shōjo',
      S14: 'Romance',
      S15: 'Slice of Life',
      S16: 'Action'
    }
    return seededGenres[seriesId] || 'Fantasy'
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

    const selectedSeries = allSeries.find(s => s.id === formSeriesId)
    const selectedChapter = availableChapters.find(c => c.id === formChapterId)

    try {
      createVoteRecord({
        seriesId: formSeriesId,
        seriesTitle: selectedSeries?.title || 'Unknown Series',
        genre: getSelectedSeriesGenre(formSeriesId),
        chapterId: formChapterId,
        chapterTitle: selectedChapter?.title || 'Unknown Chapter',
        period: formPeriod,
        readerCount: formReaderCount,
        voteCount: formVoteCount
      })

      toast.success('Vote record successfully imported as Pending Confirmation!')
      setIsDialogOpen(false)
      
      // Reset form fields
      setFormSeriesId('')
      setFormChapterId('')
      setFormReaderCount(0)
      setFormVoteCount(0)
      
      refreshData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to import vote data.')
    }
  }

  // Handle vote confirmation (BR-92)
  const handleConfirmVote = (id: string, title: string) => {
    const success = confirmVoteRecord(id)
    if (success) {
      toast.success(`Confirmed vote record for "${title}". Rankings recalculated!`)
      refreshData()
    } else {
      toast.error('Failed to confirm vote record.')
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-6 sm:p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Series Ranking
            </h1>
            <p className="text-sm text-muted-foreground">
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
                  let scoreClass = 'text-slate-300'
                  if (row.score >= 70) scoreClass = 'text-emerald-500 font-extrabold'
                  else if (row.score >= 40) scoreClass = 'text-amber-500 font-bold'
                  else scoreClass = 'text-rose-500 font-bold'

                  return (
                    <TableRow key={row.seriesId} className="border-b border-border hover:bg-muted/15 transition-colors">
                      {/* Rank Cell */}
                      <TableCell className="text-center font-bold">
                        {row.rank === 1 ? (
                          <div className="flex justify-center" title="1st Place">
                            <Trophy className="w-5 h-5 text-amber-500" />
                          </div>
                        ) : row.rank === 2 ? (
                          <div className="flex justify-center" title="2nd Place">
                            <Medal className="w-5 h-5 text-slate-350" />
                          </div>
                        ) : row.rank === 3 ? (
                          <div className="flex justify-center" title="3rd Place">
                            <Medal className="w-5 h-5 text-amber-700" />
                          </div>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-slate-400 text-xs font-bold">
                            {row.rank}
                          </span>
                        )}
                      </TableCell>

                      {/* Title */}
                      <TableCell className="font-bold text-foreground">{row.seriesTitle}</TableCell>

                      {/* Genre */}
                      <TableCell className="text-xs text-muted-foreground font-semibold">{row.genre}</TableCell>

                      {/* Votes count */}
                      <TableCell className="text-right text-xs font-semibold text-slate-350">
                        {row.voteCount.toLocaleString()}
                      </TableCell>

                      {/* Readers count */}
                      <TableCell className="text-right text-xs font-semibold text-slate-350">
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
