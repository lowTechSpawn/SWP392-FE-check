import { calculateVoteScore } from './business-logic'

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

const STORAGE_KEY = 'mangaflow_votes'
const SEED_VOTES: VoteRecord[] = []

function loadVotes(): VoteRecord[] {
  if (typeof window === 'undefined') return SEED_VOTES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VOTES))
      return SEED_VOTES
    }
    const parsed = JSON.parse(raw) as VoteRecord[]
    // Filter out any mock vote records based on seriesId length
    return parsed.filter(v => v.seriesId.length > 3)
  } catch {
    return SEED_VOTES
  }
}

function saveVotes(votes: VoteRecord[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
}

export function getVoteRecords(): VoteRecord[] {
  return loadVotes()
}

export function getPendingVotes(): VoteRecord[] {
  return loadVotes().filter(v => !v.confirmed)
}

export function createVoteRecord(data: Omit<VoteRecord, 'id' | 'score' | 'confirmed' | 'createdAt'>): VoteRecord {
  const votes = loadVotes()
  
  // Enforce BR-88: One VoteRecord per period per series
  const exists = votes.some(v => v.seriesId === data.seriesId && v.period === data.period)
  if (exists) {
    throw new Error(`A vote record already exists for ${data.seriesTitle} in period ${data.period}.`)
  }

  const score = calculateVoteScore(data.voteCount, data.readerCount)

  const newRecord: VoteRecord = {
    ...data,
    id: `V${String(votes.length + 1).padStart(2, '0')}`,
    score: Math.round(score * 100) / 100, // round to 2 decimals
    confirmed: false,
    createdAt: new Date().toISOString()
  }

  votes.push(newRecord)
  saveVotes(votes)
  return newRecord
}

export function confirmVoteRecord(id: string): boolean {
  const votes = loadVotes()
  const idx = votes.findIndex(v => v.id === id)
  if (idx === -1) return false
  
  votes[idx].confirmed = true
  votes[idx].confirmedAt = new Date().toISOString()
  
  // Recalculate score on confirm just to be consistent
  const calculatedScore = calculateVoteScore(votes[idx].voteCount, votes[idx].readerCount)
  votes[idx].score = Math.round(calculatedScore * 100) / 100
  
  saveVotes(votes)
  return true
}

export function getRankingsForPeriod(period: string): RankingRow[] {
  const allVotes = loadVotes()
  const confirmed = allVotes.filter(v => v.confirmed && v.period === period)

  // Sort by score desc, then by voteCount desc
  const sorted = [...confirmed].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.voteCount - a.voteCount
  })

  const total = sorted.length
  const allScores = sorted.map(v => v.score)

  return sorted.map((v, index) => {
    const rank = index + 1
    let status: 'TOP 3' | 'BOTTOM 20% (BR-94)' | '—' = '—'

    if (rank <= 3) {
      status = 'TOP 3'
    } else if (total >= 5) {
      // BR-94: Bottom 20% calculations.
      // If total < 5, only generate report, do not flag.
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
}
