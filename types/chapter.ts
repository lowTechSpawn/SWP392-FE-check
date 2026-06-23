export interface Chapter {
  id: string
  seriesId: string
  title: string
  publicationDate: string
  deadline: string
  overdue: boolean
  progress: number
  referenceFiles?: { fileAssetId: string; originalFileName: string; publicUrl?: string; mimeType?: string }[]
}
