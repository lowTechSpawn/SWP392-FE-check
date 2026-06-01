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

// Seed data matching the user's design image perfectly
const SEED_VOTES: VoteRecord[] = [
  // 2026-Q1 Confirmed Rank list
  {
    id: 'V01',
    seriesId: 'S11',
    seriesTitle: 'Steel Horizon',
    genre: 'Seinen',
    chapterId: 'C101',
    chapterTitle: 'Ch. 24: Iron Clad',
    period: '2026-Q1',
    readerCount: 12000,
    voteCount: 9850,
    score: 82.08,
    confirmed: true,
    createdAt: '2026-03-20T10:00:00Z',
    confirmedAt: '2026-03-25T15:00:00Z'
  },
  {
    id: 'V02',
    seriesId: 'S12',
    seriesTitle: 'Blade of Eternity',
    genre: 'Shōnen',
    chapterId: 'C102',
    chapterTitle: 'Ch. 42: Resonating Wills',
    period: '2026-Q1',
    readerCount: 15000,
    voteCount: 11800,
    score: 78.67,
    confirmed: true,
    createdAt: '2026-03-20T10:05:00Z',
    confirmedAt: '2026-03-25T15:01:00Z'
  },
  {
    id: 'V03',
    seriesId: 'S13',
    seriesTitle: 'Moonlit Academy',
    genre: 'Shōjo',
    chapterId: 'C103',
    chapterTitle: 'Ch. 12: Starlight Waltz',
    period: '2026-Q1',
    readerCount: 8500,
    voteCount: 5540,
    score: 65.18,
    confirmed: true,
    createdAt: '2026-03-20T10:10:00Z',
    confirmedAt: '2026-03-25T15:02:00Z'
  },
  {
    id: 'V04',
    seriesId: 'S14',
    seriesTitle: 'Garden of Stars',
    genre: 'Romance',
    chapterId: 'C104',
    chapterTitle: 'Ch. 18: Petals of Time',
    period: '2026-Q1',
    readerCount: 7500,
    voteCount: 4185,
    score: 55.8,
    confirmed: true,
    createdAt: '2026-03-20T10:15:00Z',
    confirmedAt: '2026-03-25T15:03:00Z'
  },
  {
    id: 'V05',
    seriesId: 'S15',
    seriesTitle: 'Ramen Dynasty',
    genre: 'Slice of Life',
    chapterId: 'C105',
    chapterTitle: 'Ch. 30: Secret Broth',
    period: '2026-Q1',
    readerCount: 6000,
    voteCount: 2720,
    score: 45.33,
    confirmed: true,
    createdAt: '2026-03-20T10:20:00Z',
    confirmedAt: '2026-03-25T15:04:00Z'
  },
  {
    id: 'V06',
    seriesId: 'S16',
    seriesTitle: 'Crimson Protocol',
    genre: 'Action',
    chapterId: 'C106',
    chapterTitle: 'Ch. 8: Cybernetic Breach',
    period: '2026-Q1',
    readerCount: 9000,
    voteCount: 1980,
    score: 22.0,
    confirmed: true,
    createdAt: '2026-03-20T10:25:00Z',
    confirmedAt: '2026-03-25T15:05:00Z'
  },

  // 2026-Q2 Pending Review data
  {
    id: 'V07',
    seriesId: 'S12',
    seriesTitle: 'Blade of Eternity',
    genre: 'Shōnen',
    chapterId: 'C202',
    chapterTitle: 'Ch. 43: Unbreakable Shield',
    period: '2026-Q2',
    readerCount: 16000,
    voteCount: 12500,
    score: 78.125,
    confirmed: false,
    createdAt: '2026-05-28T08:00:00Z'
  }
]

function loadVotes(): VoteRecord[] {
  if (typeof window === 'undefined') return SEED_VOTES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_VOTES))
      return SEED_VOTES
    }
    return JSON.parse(raw) as VoteRecord[]
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
