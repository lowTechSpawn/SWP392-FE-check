export interface ReviewAnnotation {
  id: string
  versionId: string
  pageNumber: number
  comment: string
  resolved: boolean
}

export interface ReviewDecision {
  id: string
  versionId: string
  reviewerId: string
  status: 'Approved' | 'Revision Required'
  notes?: string
  createdAt: string
}
