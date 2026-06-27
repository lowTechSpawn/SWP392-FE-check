import { z } from 'zod'

// Proposal Validation Requirements
export const seriesProposalSchema = z.object({
  title: z
    .string()
    .min(1, 'Tiêu đề là bắt buộc')
    .max(100, 'Tiêu đề phải ≤ 100 ký tự'),
  genre: z.string().min(1, 'Thể loại là bắt buộc'),
  publicationType: z.enum(['Weekly', 'Monthly', 'One-Shot'], {
    message: 'Hình thức xuất bản là bắt buộc',
  }),
  // Synopsis must be 100–2000 characters
  synopsis: z
    .string()
    .min(100, 'Tóm tắt cốt truyện phải ≥ 100 ký tự')
    .max(2000, 'Tóm tắt cốt truyện phải ≤ 2000 ký tự'),
  sampleFileUrl: z.string(),
  coverImageUrl: z.string().url('Đường dẫn hình ảnh không hợp lệ').optional().or(z.literal('')),
  sourceZipFileAssetId: z.string().optional().nullable(),
})

export type SeriesProposalInput = z.infer<typeof seriesProposalSchema>

// Chapter task deadline validation rules
export const chapterTaskSchema = z.object({
  chapterId: z.string().min(1, 'Chapter là bắt buộc'),
  pageStart: z.number().min(1, 'Trang bắt đầu phải ít nhất là 1'),
  pageEnd: z.number().min(1, 'Trang kết thúc phải ít nhất là 1'),
  assignedToId: z.string().min(1, 'Vui lòng phân công cho trợ lý'),
  deadline: z.string().refine((date) => new Date(date) > new Date(), 'Hạn chót phải ở tương lai'),
})

export type ChapterTaskInput = z.infer<typeof chapterTaskSchema>

export const manuscriptSchema = z.object({
  seriesId: z.string().min(1, 'Tác phẩm là bắt buộc'),
  fileUrl: z.string().url('Đường dẫn file không hợp lệ'),
  notes: z.string().max(500, 'Ghi chú phải ít hơn 500 ký tự').optional(),
})

export type ManuscriptInput = z.infer<typeof manuscriptSchema>

// VoteRecord Validation constraints (readerCount >= voteCount >= 0)
export const voteEntrySchema = z
  .object({
    seriesId: z.string().min(1, 'Tác phẩm là bắt buộc'),
    chapterId: z.string().min(1, 'Chapter là bắt buộc'),
    readerCount: z.number().min(0, 'Số lượng độc giả không được âm'),
    voteCount: z.number().min(0, 'Số lượng bình chọn không được âm'),
  })
  .refine((data) => data.voteCount <= data.readerCount, {
    message: 'Số lượng bình chọn không được vượt quá số lượng độc giả',
    path: ['voteCount'],
  })

export type VoteEntryInput = z.infer<typeof voteEntrySchema>

// Mandatory fields for page tasks
export const pageTaskSchema = z.object({
  chapterId: z.string().min(1, 'Chapter là bắt buộc'),
  pageNumber: z.number().min(1, 'Số trang phải ít nhất là 1'),
  status: z.enum(['Pending', 'In-Progress', 'Submitted', 'Approved', 'Rejected']),
  assignedToId: z.string().optional(),
  rejectionReason: z.string().max(500, 'Lý do phải ít hơn 500 ký tự').optional(),
})


export type PageTaskInput = z.infer<typeof pageTaskSchema>

export const loginSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

export type LoginInput = z.infer<typeof loginSchema>
