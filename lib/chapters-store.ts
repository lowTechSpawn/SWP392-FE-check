export type ChapterStatus = 'Draft' | 'In Progress' | 'Submitted' | 'Ready for Editor' | 'Published'

export type TaskStatus = 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected'

export interface Assistant {
  id: string
  name: string
  avatarUrl: string
  specialty: string
  activeTasks: number
}

export interface Series {
  id: string
  title: string
  mangakaId: string
  coverColor: string
  status?: string // Added to support validation
}

export interface Task {
  id: string
  chapterId: string
  manuscriptId?: string
  type: string // e.g. "Line Art", "Coloring", "Backgrounds", "Toning"
  pages: string // e.g. "1-3", "4-7", "8"
  description: string
  assistantId: string
  assistantName: string
  status: TaskStatus
  submittedWorkUrl?: string
  prevSubmittedWorkUrl?: string
  feedback?: string // Feedback comments from Mangaka
  assignedAt?: string
  updatedAt?: string
  dueDate?: string // NgÃ y háº¡n chÃ³t ná»™p task Ä‘á»ƒ Mangaka theo dÃµi tiáº¿n Ä‘á»™
  pageStart?: number // Sá»‘ trang báº¯t Ä‘áº§u váº½
  pageEnd?: number // Sá»‘ trang káº¿t thÃºc váº½
  attachments?: { name: string; size: string; type: string }[] // TÃ i liá»‡u hÆ°á»›ng dáº«n Ä‘Ã­nh kÃ¨m tá»« Mangaka
  submittedFiles?: { name: string; size: string; type: string }[] // CÃ¡c file hÃ¬nh áº£nh/sáº£n pháº©m Assistant Ä‘Ã£ ná»™p
  submitDescription?: string // Lá»i nháº¯n hoáº·c mÃ´ táº£ chá»‰nh sá»­a tá»« Assistant khi ná»™p bÃ i
  submissionId?: string // to support backend approve/reject calls
  submittedFileAssetId?: string
  submissionCount?: number
  referenceFiles?: { fileAssetId: string; publicUrl: string; originalFileName: string; mimeType?: string }[]
}

export interface Chapter {
  id: string
  seriesId: string
  number: number
  title: string
  status: ChapterStatus
  totalPages: number
  publicationDate: string
  deadline: string // calculated (pubDate - 14 days)
  createdAt: string
  synopsis?: string // Added to support synopsis info from SubmitChapterPage
  notes?: string // Added to support notes from SubmitChapterPage
  storyboardFiles?: any[] // Added to support storyboard files from SubmitChapterPage
  manuscriptFiles?: any[] // Added to support manuscript files from SubmitChapterPage
  referenceFiles?: { fileAssetId: string; publicUrl: string; originalFileName: string; mimeType?: string }[]
}


export const TASK_TYPE_SUGGESTIONS = [
  {
    name: 'Line Art',
    description: 'Phác thảo nét vẽ và vẽ viền cho nhân vật/bối cảnh.',
    template: 'Yêu cầu đi nét vẽ chi tiết cho nhân vật chính ở trang {pages}. Chú ý độ dày nét viền mặt và tóc.'
  },
  {
    name: 'Coloring',
    description: 'Tô màu, đánh bóng và xử lý nguồn sáng cảnh tranh.',
    template: 'Thực hiện tô màu kỹ thuật số cho trang {pages}. Sử dụng tông màu hoàng hôn vàng ấm áp theo moodboard.'
  },
  {
    name: 'Background Art',
    description: 'Vẽ bối cảnh, môi trường và cảnh nền chi tiết.',
    template: 'Vẽ chi tiết bối cảnh ngôi đền cổ ở hậu cảnh cho các trang {pages}. Tập trung vào họa tiết mái ngói.'
  },
  {
    name: 'Screentoning',
    description: 'Dán lưới tông màu và tạo hiệu ứng chiều sâu cho trang truyện.',
    template: 'Dán lưới screentone tạo chiều sâu bóng râm và vân sáng cho trang {pages}.'
  },
  {
    name: 'Clean-up',
    description: 'Làm sạch nét vẽ phác thảo thô, căn chỉnh các khung tranh.',
    template: 'Tẩy xóa nét nháp thô thừa và chuẩn hóa kích thước khung hình cho trang {pages}.'
  }
]

