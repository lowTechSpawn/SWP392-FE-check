import { z } from 'zod'

// BR-15: Proposal Validation Requirements
export const seriesProposalSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be ≤ 100 characters'),
  genre: z.string().min(1, 'Genre is required'),
  publicationType: z.enum(['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'One-Shot'], {
    message: 'Publication type is required',
  }),
  // BR-15: Synopsis must be 200–2000 characters
  synopsis: z
    .string()
    .min(200, 'Synopsis must be ≥ 200 characters')
    .max(2000, 'Synopsis must be ≤ 2000 characters'),
  sampleFileUrl: z
    .string()
    .min(1, 'Sample file is required'),
  coverImageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  sourceZipFileAssetId: z.string().optional().nullable(),
})

export type SeriesProposalInput = z.infer<typeof seriesProposalSchema>

export const chapterTaskSchema = z.object({
  chapterId: z.string().min(1, 'Chapter is required'),
  pageStart: z.number().min(1, 'Page start must be at least 1'),
  pageEnd: z.number().min(1, 'Page end must be at least 1'),
  assignedToId: z.string().min(1, 'Please assign to an assistant'),
  deadline: z.string().refine((date) => new Date(date) > new Date(), 'Deadline must be in the future'),
})

export type ChapterTaskInput = z.infer<typeof chapterTaskSchema>

export const manuscriptSchema = z.object({
  seriesId: z.string().min(1, 'Series is required'),
  fileUrl: z.string().url('Invalid file URL'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export type ManuscriptInput = z.infer<typeof manuscriptSchema>

export const voteEntrySchema = z
  .object({
    seriesId: z.string().min(1, 'Series is required'),
    chapterId: z.string().min(1, 'Chapter is required'),
    readerCount: z.number().min(0, 'Reader count must be non-negative'),
    voteCount: z.number().min(0, 'Vote count must be non-negative'),
  })
  .refine((data) => data.voteCount <= data.readerCount, {
    message: 'Vote count cannot exceed reader count',
    path: ['voteCount'],
  })

export type VoteEntryInput = z.infer<typeof voteEntrySchema>

export const pageTaskSchema = z.object({
  chapterId: z.string().min(1, 'Chapter is required'),
  pageNumber: z.number().min(1, 'Page number must be at least 1'),
  status: z.enum(['Pending', 'In-Progress', 'Submitted', 'Approved', 'Rejected']),
  assignedToId: z.string().optional(),
  rejectionReason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
})

export type PageTaskInput = z.infer<typeof pageTaskSchema>

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
