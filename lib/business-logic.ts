import { CHAPTER_DEADLINE_DAYS_BEFORE, BOTTOM_PERCENTILE_FOR_CANCELLATION } from './constants'

/**
 * Calculate chapter deadline based on publication date
 * Deadline = publication date - 14 days
 */
export function calculateChapterDeadline(publicationDate: Date | string): Date {
  const pubDate = new Date(publicationDate)
  const deadline = new Date(pubDate)
  deadline.setDate(deadline.getDate() - CHAPTER_DEADLINE_DAYS_BEFORE)
  return deadline
}

/**
 * Calculate reader vote score percentage
 * Score = (voteCount / readerCount) × 100%
 */
export function calculateVoteScore(voteCount: number, readerCount: number): number {
  if (readerCount === 0) return 0
  return (voteCount / readerCount) * 100
}

/**
 * Check if a chapter is overdue
 */
export function isChapterOverdue(deadline: Date | string, currentDate: Date = new Date()): boolean {
  const deadlineDate = new Date(deadline)
  return currentDate > deadlineDate
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Check if a series score is in bottom 20%
 * Used for cancellation review flag
 */
export function isBelowCancellationThreshold(
  currentScore: number,
  allScores: number[],
): boolean {
  const sorted = [...allScores].sort((a, b) => a - b)
  const percentileIndex = Math.ceil((sorted.length * BOTTOM_PERCENTILE_FOR_CANCELLATION) / 100)
  const threshold = sorted[percentileIndex - 1] ?? 0
  return currentScore <= threshold
}

/**
 * Calculate chapter progress percentage
 */
export function calculateChapterProgress(approvedPages: number, totalPages: number): number {
  if (totalPages === 0) return 0
  return Math.round((approvedPages / totalPages) * 100)
}

/**
 * Format duration until deadline
 */
export function formatDurationUntilDeadline(deadline: Date | string): string {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()

  if (diffMs <= 0) {
    return 'Overdue'
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  }
  return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
}

/**
 * Generate estimation of assistant earnings
 * Based on pages completed × unit price
 */
export function estimateAssistantEarnings(
  pagesCompleted: number,
  unitPricePerPage: number = 10,
): number {
  return pagesCompleted * unitPricePerPage
}

/**
 * Validate quorum for voting
 */
export function hasVotingQuorum(votes: Record<string, any> | any[], quorum: number = 3): boolean {
  const voteCount = Array.isArray(votes) ? votes.length : Object.keys(votes).length
  return voteCount >= quorum
}

/**
 * Check if all pages in chapter are approved
 */
export function areAllPagesApproved(pageStatuses: string[]): boolean {
  return pageStatuses.length > 0 && pageStatuses.every((status) => status === 'Approved')
}

/**
 * Determine series status based on voting
 */
export function determineSeriesStatus(
  approvalsCount: number,
  rejectionsCount: number,
  quorum: number = 3,
): 'Proposed' | 'Active' | 'Rejected' | 'Deferred' {
  const totalVotes = approvalsCount + rejectionsCount

  if (totalVotes < quorum) {
    return 'Deferred'
  }

  if (approvalsCount > rejectionsCount) {
    return 'Active'
  }

  return 'Rejected'
}

