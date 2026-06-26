export interface ManuscriptVersion {
  version: string
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED' | 'PUBLISHED'
  submittedAt: string
  reviewedAt?: string
  revisionNumber?: number // for BR-83 display, e.g. 1 for v1, 2 for v2
  feedback?: string
  fileUrl?: string
}

export interface ManuscriptItem {
  id: string
  chapterId: string
  seriesId: string
  seriesTitle: string
  chapterNumber: number
  chapterTitle: string
  latestVersion: string
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED' | 'PUBLISHED'
  progress: number // chapter drawing progress (e.g., 0 to 100) for BR-84 check
  history: ManuscriptVersion[]
  pages: string[] // mock page previews
  fileUrl?: string
}

export interface Annotation {
  id: string
  manuscriptId: string
  versionName: string
  text: string
  createdAt: string
}
