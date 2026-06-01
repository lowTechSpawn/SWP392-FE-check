'use client'

import { useEffect, useState } from 'react'
import { useRole } from '@/context/RoleContext'
import {
  ClipboardList,
  Plus,
  BookOpen,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Check,
  X,
  FileEdit,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Eye,
  FileText,
  Upload,
  PlusCircle,
  PenTool,
  ScrollText,
  CalendarDays,
  Hash,
  AlertCircle,
  Info,
  Layers
} from 'lucide-react'
import {
  getSeries,
  getChapters,
  getChapterById,
  createChapter,
  updateChapterStatus,
  getTasks,
  getTaskById,
  getTasksByAssistant,
  createTask,
  updateTaskStatus,
  assignTask,
  getAssistants,
  getSeriesByMangaka,
  SEED_ASSISTANTS,
  type Chapter,
  type Task,
  type Assistant,
  type Series,
  type ChapterStatus,
  type TaskStatus
} from '@/lib/chapters-store'
import { calculateChapterDeadline, calculateChapterProgress } from '@/lib/business-logic'

// Mock current logged in mangaka ID (matches seed data)
const MOCK_MANGAKA_ID = 'U01'

export default function ChaptersPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // --- State for Mangaka Role ---
  const [mangakaSeries, setMangakaSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [chapterTasks, setChapterTasks] = useState<Task[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])

  // Modal control states
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [activeTaskToReview, setActiveTaskToReview] = useState<Task | null>(null)
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false)
  const [activeTaskToView, setActiveTaskToView] = useState<Task | null>(null)

  // Form states for creating chapter (Matching SubmitChapterPage.jsx)
  const [newChapterSeriesId, setNewChapterSeriesId] = useState('')
  const [newChapterNo, setNewChapterNo] = useState<string>('')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [newChapterPages, setNewChapterPages] = useState<number>(24)
  const [newChapterPubDate, setNewChapterPubDate] = useState('')
  const [newChapterSynopsis, setNewChapterSynopsis] = useState('')
  const [newChapterNotes, setNewChapterNotes] = useState('')
  const [newChapterStoryboardFiles, setNewChapterStoryboardFiles] = useState<any[]>([])
  const [newChapterManuscriptFiles, setNewChapterManuscriptFiles] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form states for creating task
  const [newTaskTypes, setNewTaskTypes] = useState<string[]>(['Line Art'])
  const [newTaskPageStart, setNewTaskPageStart] = useState<number>(1)
  const [newTaskPageEnd, setNewTaskPageEnd] = useState<number>(3)
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskAssistantId, setNewTaskAssistantId] = useState('Unassigned')
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('')
  const [newTaskAttachments, setNewTaskAttachments] = useState<{ name: string; size: string; type: string }[]>([])

  // Review states (Approve / Reject)
  const [reviewFeedback, setReviewFeedback] = useState('')

  // --- State for Assistant Role ---
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('A01') // Sato Takashi by default
  const [assistantTasks, setAssistantTasks] = useState<Task[]>([])
  const [isSubmitWorkModalOpen, setIsSubmitWorkModalOpen] = useState(false)
  const [activeTaskToSubmit, setActiveTaskToSubmit] = useState<Task | null>(null)
  const [submitWorkUrl, setSubmitWorkUrl] = useState('')
  const [submitComment, setSubmitComment] = useState('')
  const [submittedFiles, setSubmittedFiles] = useState<{ name: string; size: string; type: string }[]>([])

  // Trigger Toast Notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load Initial Data
  useEffect(() => {
    setMounted(true)
    refreshData()
  }, [role, selectedSeriesId, selectedChapterId, selectedAssistantId])

  const refreshData = () => {
    // 1. Load active series and select default
    const seriesList = getSeriesByMangaka(MOCK_MANGAKA_ID)
    setMangakaSeries(seriesList)

    let currentSeriesId = selectedSeriesId
    if (!currentSeriesId && seriesList.length > 0) {
      currentSeriesId = seriesList[0].id
      setSelectedSeriesId(currentSeriesId)
    }

    // 2. Load chapters for series
    if (currentSeriesId) {
      const chapterList = getChapters(currentSeriesId)
      setChapters(chapterList)

      let currentChapterId = selectedChapterId
      if (!currentChapterId && chapterList.length > 0) {
        currentChapterId = chapterList[0].id
        setSelectedChapterId(currentChapterId)
      }

      if (currentChapterId) {
        const chap = getChapterById(currentChapterId)
        setSelectedChapter(chap || null)
        setChapterTasks(getTasks(currentChapterId))
      } else {
        setSelectedChapter(null)
        setChapterTasks([])
      }
    }

    // 3. Load assistant dropdown / info
    setAssistants(getAssistants())

    // 4. Load tasks for selected assistant
    if (selectedAssistantId) {
      setAssistantTasks(getTasksByAssistant(selectedAssistantId))
    }
  }

  if (!mounted) return null

  // --- Action Handlers for Mangaka ---

  // 1. Helper kiểm tra ngày xuất bản (BR-42)
  const validatePublicationDate = (pubDate: string, createdDate = new Date()) => {
    const pub = new Date(pubDate)
    const created = new Date(createdDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (pub <= today) return 'Ngày xuất bản dự kiến phải nằm trong tương lai'

    const deadline = new Date(pub)
    deadline.setDate(deadline.getDate() - 14) // Hạn nộp bản thảo là 14 ngày trước xuất bản

    const minDeadline = new Date(created)
    minDeadline.setDate(minDeadline.getDate() + 3) // Tối thiểu trợ lý/mangaka phải có 3 ngày làm việc

    if (deadline < minDeadline) {
      return 'Ngày xuất bản phải cách ngày hiện tại ít nhất 17 ngày (do hạn nộp bản thảo là 14 ngày trước xuất bản + tối thiểu 3 ngày làm việc)'
    }
    return null
  }

  // Helper kiểm tra quyền tạo Chapter (BR-40)
  const canCreateChapter = (userId: string, series: Series) => {
    return series.mangakaId === userId && series.status === 'Active'
  }

  // Upload giả lập
  const handleMockUpload = (field: 'storyboardFiles' | 'manuscriptFiles') => {
    const extensions = { storyboardFiles: ['pdf', 'jpg'], manuscriptFiles: ['zip', 'tif', 'jpg'] }
    const list = field === 'storyboardFiles' ? newChapterStoryboardFiles : newChapterManuscriptFiles
    const ext = extensions[field][Math.floor(Math.random() * extensions[field].length)]
    
    const chapterNoVal = newChapterNo || 'X'
    const name = field === 'storyboardFiles'
      ? `Ch${chapterNoVal}_Storyboard_p${list.length + 1}.${ext}`
      : `Ch${chapterNoVal}_Pages_${list.length * 5 + 1}-${(list.length + 1) * 5}.${ext}`
      
    const newFile = {
      name,
      size: `${Math.floor(Math.random() * 30) + 5} MB`,
      type: ext
    }

    if (field === 'storyboardFiles') {
      setNewChapterStoryboardFiles(prev => [...prev, newFile])
    } else {
      setNewChapterManuscriptFiles(prev => [...prev, newFile])
      setErrors(prev => {
        const copy = { ...prev }
        delete copy.manuscriptFiles
        return copy
      })
    }
  }

  // Xóa file giả lập
  const removeFile = (field: 'storyboardFiles' | 'manuscriptFiles', index: number) => {
    if (field === 'storyboardFiles') {
      setNewChapterStoryboardFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      setNewChapterManuscriptFiles(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Upload giả lập cho Task
  const handleTaskMockUpload = () => {
    const extensions = ['pdf', 'jpg', 'zip', 'png']
    const ext = extensions[Math.floor(Math.random() * extensions.length)]
    const name = `Ref_${selectedChapter?.title.replace(/\s+/g, '_') || 'Chapter'}_Task_${newTaskAttachments.length + 1}.${ext}`
    const newFile = {
      name,
      size: `${Math.floor(Math.random() * 5) + 1} MB`,
      type: ext
    }
    setNewTaskAttachments(prev => [...prev, newFile])
  }

  const removeTaskAttachment = (index: number) => {
    setNewTaskAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Tra cứu Tên Manga (Series Title) dựa vào task.chapterId và series.id
  const getMangaTitleForTask = (task: Task) => {
    const chapter = getChapterById(task.chapterId)
    if (!chapter) return 'Unknown Manga'
    const seriesList = getSeries()
    const series = seriesList.find(s => s.id === chapter.seriesId)
    return series ? series.title : 'Unknown Manga'
  }

  // Lấy thông tin số chương và tiêu đề chương tương ứng với task.chapterId
  const getChapterInfoForTask = (task: Task) => {
    const chapter = getChapterById(task.chapterId)
    if (!chapter) return ''
    return `Ch. ${chapter.number}: ${chapter.title}`
  }

  // Giả lập tải lên file sản phẩm của Assistant.
  // Tạo ngẫu nhiên định dạng (jpg, png, zip, psd, clip), dung lượng và tên file mô phỏng theo Task.
  const handleAssistantMockUpload = () => {
    const extensions = ['jpg', 'png', 'zip', 'psd', 'clip']
    const ext = extensions[Math.floor(Math.random() * extensions.length)]
    const name = `Work_${activeTaskToSubmit?.type.replace(/[\s,]+/g, '_') || 'Task'}_Page_${activeTaskToSubmit?.pages || '1'}_v1.${ext}`
    const newFile = {
      name,
      size: `${Math.floor(Math.random() * 15) + 5} MB`,
      type: ext
    }
    setSubmittedFiles(prev => [...prev, newFile])
  }

  // Xóa file vẽ sản phẩm khỏi danh sách chuẩn bị nộp của Assistant
  const removeAssistantSubmittedFile = (index: number) => {
    setSubmittedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Điền dữ liệu mẫu (demo quy trình thực)
  const handleFillSample = () => {
    const activeSeriesList = mangakaSeries.filter(s => s.status === 'Active')
    if (activeSeriesList.length === 0) {
      showToast('Bạn cần có series đang Active để thử demo.', 'error')
      return
    }
    
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateStr = futureDate.toISOString().split('T')[0]

    setNewChapterSeriesId(activeSeriesList[0].id)
    setNewChapterNo('12')
    setNewChapterTitle('Sự Thức Tỉnh Của Rồng Thần')
    setNewChapterPages(24)
    setNewChapterPubDate(dateStr)
    setNewChapterSynopsis(
      'Trong chương này, nhân vật chính Ryuu lần đầu tiên giải phóng sức mạnh rồng thần tiềm ẩn khi phải đối đầu trực tiếp với hội đồng hắc ám. ' +
      'Bí mật về nguồn gốc của thanh gươm ánh sáng dần được hé lộ qua flashback. ' +
      'Cú twist lớn cuối chương: người đồng đội cũ mà Ryuu tưởng đã mất 3 năm trước bất ngờ xuất hiện để giải vây.'
    )
    setNewChapterNotes(
      'Gửi Editor Nakamura: Trang 12–13 là cảnh chiến đấu dùng DOUBLE-SPREAD (trang đôi). ' +
      'Vui lòng lưu ý khi dàn trang in ấn không cắt đứt giữa. ' +
      'Trang 20: lời thoại của nhân vật phụ dùng font italic để phân biệt với nhân vật chính.'
    )
    setNewChapterStoryboardFiles([
      { name: 'Ch12_Storyboard_v2.pdf', size: '3.2 MB', type: 'pdf' }
    ])
    setNewChapterManuscriptFiles([
      { name: 'Ch12_Page_01-11_Pencil.zip', size: '28 MB', type: 'zip' },
      { name: 'Ch12_Page_12-13_Spread_Ink.tif', size: '18 MB', type: 'tif' },
      { name: 'Ch12_Page_14-24_Pencil.zip', size: '31 MB', type: 'zip' }
    ])
    setErrors({})
    showToast('Đã điền dữ liệu mẫu (demo quy trình thực)!', 'success')
  }

  // 1. Tạo Chapter mới
  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (!newChapterSeriesId) errs.seriesId = 'Vui lòng chọn tác phẩm'
    if (!newChapterNo) errs.chapterNo = 'Vui lòng nhập số chương'
    if (!newChapterTitle.trim()) errs.title = 'Vui lòng nhập tiêu đề chương'
    if (!newChapterPubDate) {
      errs.publicationDate = 'Vui lòng chọn ngày xuất bản dự kiến'
    } else {
      const dateError = validatePublicationDate(newChapterPubDate)
      if (dateError) errs.publicationDate = dateError
    }

    if (newChapterManuscriptFiles.length === 0) {
      errs.manuscriptFiles = 'Tối thiểu phải đính kèm 1 file bản thảo tranh thô'
    }

    // Eligibility check
    const selectedSeries = mangakaSeries.find(s => s.id === newChapterSeriesId)
    if (selectedSeries && !canCreateChapter(MOCK_MANGAKA_ID, selectedSeries)) {
      errs.seriesId = 'Chỉ Mangaka chủ sở hữu của series đang Active mới được tạo chapter'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      showToast('Vui lòng kiểm tra lại thông tin.', 'error')
      return
    }

    // Calculate deadline: publicationDate - 14 days
    const pubDateObj = new Date(newChapterPubDate)
    pubDateObj.setDate(pubDateObj.getDate() - 14)
    const deadlineString = pubDateObj.toISOString().split('T')[0]

    const newChap = createChapter({
      seriesId: newChapterSeriesId,
      number: parseInt(newChapterNo) || 0,
      title: newChapterTitle,
      status: 'Draft',
      totalPages: newChapterPages,
      publicationDate: newChapterPubDate,
      deadline: deadlineString,
      synopsis: newChapterSynopsis,
      notes: newChapterNotes,
      storyboardFiles: newChapterStoryboardFiles,
      manuscriptFiles: newChapterManuscriptFiles
    })

    showToast(`Đã tạo thành công Chapter ${newChap.number}: ${newChap.title}!`)
    setIsChapterModalOpen(false)
    
    // Reset form states
    setNewChapterSeriesId(selectedSeriesId)
    setNewChapterNo('')
    setNewChapterTitle('')
    setNewChapterPages(24)
    setNewChapterPubDate('')
    setNewChapterSynopsis('')
    setNewChapterNotes('')
    setNewChapterStoryboardFiles([])
    setNewChapterManuscriptFiles([])
    setErrors({})

    setSelectedChapterId(newChap.id) // Automatically select the created chapter
    refreshData()
  }

  // 2. Tạo Task & Giao việc cho Assistant
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskTypes.length === 0) {
      showToast('Vui lòng chọn ít nhất một loại task!', 'error')
      return
    }
    if (newTaskPageStart > newTaskPageEnd) {
      showToast('Trang bắt đầu không thể lớn hơn trang kết thúc!', 'error')
      return
    }
    if (!newTaskDesc.trim()) {
      showToast('Vui lòng nhập mô tả công việc!', 'error')
      return
    }

    createTask({
      chapterId: selectedChapterId,
      type: newTaskTypes.join(', '),
      pages: `${newTaskPageStart}-${newTaskPageEnd}`,
      pageStart: newTaskPageStart,
      pageEnd: newTaskPageEnd,
      description: newTaskDesc,
      assistantId: newTaskAssistantId,
      dueDate: newTaskDueDate || undefined,
      attachments: newTaskAttachments.length > 0 ? newTaskAttachments : undefined
    })

    showToast(`Đã tạo task và giao việc thành công!`)
    setIsTaskModalOpen(false)
    setNewTaskDesc('')
    setNewTaskTypes(['Line Art'])
    setNewTaskPageStart(1)
    setNewTaskPageEnd(3)
    setNewTaskDueDate('')
    setNewTaskAttachments([])
    refreshData()

    // Cập nhật trạng thái chapter sang "In Progress" nếu đang là "Draft"
    if (selectedChapter && selectedChapter.status === 'Draft') {
      updateChapterStatus(selectedChapterId, 'In Progress')
      refreshData()
    }
  }

  // 3. Duyệt Task của Assistant (Approve)
  const handleApproveTask = (task: Task) => {
    updateTaskStatus(task.id, 'Approved', reviewFeedback || 'Đồng ý duyệt, bài làm rất tốt!')
    showToast(`Đã phê duyệt công việc của ${task.assistantName}!`)
    setIsReviewModalOpen(false)
    setActiveTaskToReview(null)
    setReviewFeedback('')
    refreshData()
  }

  // 4. Từ chối Task của Assistant (Reject)
  const handleRejectTask = (task: Task) => {
    if (!reviewFeedback.trim()) {
      showToast('Vui lòng điền phản hồi (lý do từ chối)!', 'error')
      return
    }
    updateTaskStatus(task.id, 'Rejected', reviewFeedback)
    showToast(`Đã từ chối và gửi phản hồi yêu cầu sửa đổi!`, 'error')
    setIsReviewModalOpen(false)
    setActiveTaskToReview(null)
    setReviewFeedback('')
    refreshData()
  }

  // --- Action Handlers for Assistant ---

  // 1. Nhận việc / Bắt đầu làm (In-Progress)
  const handleStartTask = (taskId: string) => {
    updateTaskStatus(taskId, 'In-Progress')
    showToast('Đã chuyển trạng thái sang Đang làm việc (In-Progress)!')
    refreshData()
  }

  // 2. Nộp bài làm (Submit Work)
  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTaskToSubmit) return

    // Sử dụng URL mặc định nếu để trống
    const workUrl = submitWorkUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800'

    updateTaskStatus(
      activeTaskToSubmit.id,
      'Submitted',
      undefined,
      workUrl,
      submitComment || 'Đã hoàn thành công việc, gửi Mangaka duyệt.',
      submittedFiles
    )

    showToast('Đã nộp kết quả công việc thành công! Chờ Mangaka phê duyệt.')
    setIsSubmitWorkModalOpen(false)
    setActiveTaskToSubmit(null)
    setSubmitWorkUrl('')
    setSubmitComment('')
    setSubmittedFiles([])
    refreshData()
  }

  // Helper styles for badges
  const getChapterStatusClass = (status: ChapterStatus) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800'
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800/30'
      case 'Ready for Editor': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800/30'
      case 'Published': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800/30'
    }
  }

  const getTaskStatusClass = (status: TaskStatus) => {
    switch (status) {
      case 'Unassigned': return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'
      case 'Pending': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-500'
      case 'In-Progress': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400'
      case 'Submitted': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/10 dark:text-indigo-400'
      case 'Approved': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400'
      case 'Rejected': return 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'
    }
  }

  // Tính phần trăm tiến độ của chapter hiện tại
  const approvedPages = selectedChapter
    ? chapterTasks.filter(t => t.status === 'Approved').reduce((acc, t) => {
        // Tách số trang từ chuỗi (ví dụ: "1-3" -> 3 trang, "5" -> 1 trang)
        const parts = t.pages.split('-')
        if (parts.length === 2) {
          return acc + (parseInt(parts[1]) - parseInt(parts[0]) + 1)
        }
        return acc + 1
      }, 0)
    : 0
  const progressPercent = selectedChapter
    ? Math.min(100, calculateChapterProgress(approvedPages, selectedChapter.totalPages))
    : 0

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-bold shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-6 sm:p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <ClipboardList className="w-3.5 h-3.5" /> Workflow Board
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Chapters & Tasks Management
            </h1>
            <p className="text-sm text-muted-foreground">
              {role === 'Mangaka'
                ? 'Create chapters, assign duties to your assistants, and review submissions.'
                : role === 'Assistant'
                ? 'Check your assigned drawing tasks, update work status, and submit drawings.'
                : 'Oversee and review chapter development and assistant tasks.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MANGAKA VIEW INTERFACE                                                 */}
      {/* ========================================================================= */}
      {role === 'Mangaka' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Series Selection Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Select Serializing Series</label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => {
                    setSelectedSeriesId(e.target.value)
                    setSelectedChapterId('')
                  }}
                  className="bg-transparent text-foreground font-bold text-base focus:outline-none pr-6 cursor-pointer mt-0.5"
                >
                  {mangakaSeries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setNewChapterSeriesId(selectedSeriesId)
                setNewChapterNo('')
                setNewChapterTitle('')
                setNewChapterPages(24)
                setNewChapterPubDate('')
                setNewChapterSynopsis('')
                setNewChapterNotes('')
                setNewChapterStoryboardFiles([])
                setNewChapterManuscriptFiles([])
                setErrors({})
                setIsChapterModalOpen(true)
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-primary/15 hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Chapter
            </button>
          </div>

          {/* Main Grid: Left Chapters List, Right Detail Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chapters List Column */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Chapter List
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  {chapters.length} Total
                </span>
              </div>

              <div className="divide-y divide-border overflow-y-auto max-h-[500px]">
                {chapters.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">No chapters created yet</p>
                    <button
                      onClick={() => {
                        setNewChapterSeriesId(selectedSeriesId)
                        setNewChapterNo('')
                        setNewChapterTitle('')
                        setNewChapterPages(24)
                        setNewChapterPubDate('')
                        setNewChapterSynopsis('')
                        setNewChapterNotes('')
                        setNewChapterStoryboardFiles([])
                        setNewChapterManuscriptFiles([])
                        setErrors({})
                        setIsChapterModalOpen(true)
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Create Chapter 1
                    </button>
                  </div>
                ) : (
                  chapters.map((chap) => {
                    const isSelected = chap.id === selectedChapterId
                    return (
                      <div
                        key={chap.id}
                        onClick={() => {
                          setSelectedChapterId(chap.id)
                          refreshData()
                        }}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            Ch.{chap.number}: {chap.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Deadline: {chap.deadline}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md ${getChapterStatusClass(chap.status)}`}>
                          {chap.status}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Selected Chapter Workspace Detail */}
            <div className="lg:col-span-2 space-y-6">
              {selectedChapter ? (
                <>
                  {/* Chapter Status Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-foreground">
                          Chapter {selectedChapter.number}: {selectedChapter.title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Expected Pub Date: {selectedChapter.publicationDate} | Required Pages: {selectedChapter.totalPages} pages
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-full ${getChapterStatusClass(selectedChapter.status)}`}>
                          {selectedChapter.status}
                        </span>
                      </div>
                    </div>

                    {/* Deadline Warning banner */}
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-500 rounded-xl text-xs">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>Chapter Deadline:</strong> {selectedChapter.deadline} (Submission target to Editorial Board).
                      </span>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Drawing page progress (Approved by Mangaka)</span>
                        <span className="text-primary font-bold">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic text-right">
                        {approvedPages} of {selectedChapter.totalPages} pages completed and approved
                      </p>
                    </div>

                    {/* Change chapter status logic */}
                    <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
                      <span className="text-xs text-muted-foreground font-semibold">Manage Chapter Status:</span>
                      <div className="flex items-center gap-2">
                        {selectedChapter.status === 'Draft' && (
                          <button
                            onClick={() => {
                              updateChapterStatus(selectedChapterId, 'In Progress')
                              refreshData()
                              showToast('Chapter status updated to In Progress')
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Set In Progress
                          </button>
                        )}
                        {selectedChapter.status === 'In Progress' && progressPercent >= 100 && (
                          <button
                            onClick={() => {
                              updateChapterStatus(selectedChapterId, 'Ready for Editor')
                              refreshData()
                              showToast('Chapter marked Ready for Editor review!')
                            }}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Submit to Editor
                          </button>
                        )}
                        {selectedChapter.status === 'Ready for Editor' && (
                          <button
                            onClick={() => {
                              updateChapterStatus(selectedChapterId, 'Published')
                              refreshData()
                              showToast('Chapter successfully Published!')
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark as Published
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" /> Tasks Assigned to Assistants
                      </h3>
                      <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task
                      </button>
                    </div>

                    <div className="divide-y divide-border">
                      {chapterTasks.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                          <p className="text-xs text-muted-foreground">No tasks assigned yet for this chapter</p>
                          <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Assign your first drawing task
                          </button>
                        </div>
                      ) : (
                        chapterTasks.map((task) => (
                          <div key={task.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                  {task.type} (Pages {task.pages})
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTaskStatusClass(task.status)}`}>
                                  {task.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-foreground leading-snug">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="w-3.5 h-3.5" />
                                <span>Assigned to: <strong>{task.assistantName}</strong></span>
                              </div>
                              {task.feedback && (
                                <p className="text-xs text-amber-600 bg-amber-500/5 border border-amber-500/10 p-2 rounded-lg mt-2 font-medium">
                                  <strong>Feedback:</strong> {task.feedback}
                                </p>
                              )}
                            </div>

                            {/* Actions on Task (For Mangaka) */}
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                              {task.status === 'Submitted' && (
                                <button
                                  onClick={() => {
                                    setActiveTaskToReview(task)
                                    setIsReviewModalOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Review Submission
                                </button>
                              )}
                              {task.status === 'Approved' && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5" /> Task Finished
                                </span>
                              )}
                              {task.status === 'Pending' && (
                                <span className="text-xs text-muted-foreground bg-muted p-2 rounded-xl italic">
                                  Awaiting assistant accept
                                </span>
                              )}
                              {task.status === 'In-Progress' && (
                                <span className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 p-2 rounded-xl font-semibold">
                                  Assistant is working
                                </span>
                              )}
                              {task.status === 'Rejected' && (
                                <span className="text-xs text-red-600 bg-red-500/10 border border-red-500/20 p-2 rounded-xl font-semibold">
                                  Needs revision
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-16 text-center space-y-3">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <h3 className="font-bold text-lg text-foreground">Select a chapter</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Select a chapter from the list or create a new one to start assigning work to assistants.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ASSISTANT VIEW INTERFACE                                               */}
      {/* ========================================================================= */}
      {role === 'Assistant' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Assistant Switcher Bar (For Demo Testing Purpose) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Select Active Assistant Profile (Testing)</label>
                <select
                  value={selectedAssistantId}
                  onChange={(e) => setSelectedAssistantId(e.target.value)}
                  className="bg-transparent text-foreground font-bold text-base pr-6 cursor-pointer focus:outline-none mt-0.5"
                >
                  {SEED_ASSISTANTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.specialty})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* My Tasks Board */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> My Assigned Tasks
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {assistantTasks.length} Active Tasks
              </span>
            </div>

            <div className="divide-y divide-border">
              {assistantTasks.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <h4 className="font-bold text-foreground">You don&apos;t have any tasks!</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Once the Mangaka assigns you a page drawing, inking, or coloring task, it will appear here.
                  </p>
                </div>
              ) : (
                assistantTasks.map((task) => (
                  <div key={task.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-muted/10 transition-colors">
                    <div className="space-y-2 min-w-0">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                          Manga: {getMangaTitleForTask(task)} — {getChapterInfoForTask(task)}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {task.type} (Pages {task.pages})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTaskStatusClass(task.status)}`}>
                            {task.status}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              📅 Hạn chót: {task.dueDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-foreground leading-snug">
                        {task.description}
                      </h4>

                      {task.feedback && (
                        <div className="text-xs p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-400">
                          <strong>Feedback from Mangaka:</strong> {task.feedback}
                        </div>
                      )}
                    </div>

                    {/* Action buttons based on task status */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => {
                          setActiveTaskToView(task)
                          setIsViewDetailModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer border border-border"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>

                      {task.status === 'Pending' && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" /> Accept & Start
                        </button>
                      )}
                      
                      {(task.status === 'In-Progress' || task.status === 'Rejected') && (
                        <button
                          onClick={() => {
                            setActiveTaskToSubmit(task)
                            setIsSubmitWorkModalOpen(true)
                          }}
                          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Submit Finished Work
                        </button>
                      )}

                      {task.status === 'Submitted' && (
                        <span className="text-xs text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl font-bold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Awaiting Mangaka Review
                        </span>
                      )}

                      {task.status === 'Approved' && (
                        <span className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Task Completed & Approved
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDITOR VIEW / GENERAL VIEW                                            */}
      {/* ========================================================================= */}
      {(role === 'Tantou Editor' || role === 'Editorial Board') && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Serialization & Chapters Overview (Read-Only Editor Monitor)
            </h3>
            <p className="text-xs text-muted-foreground">
              You are logged in as {role}. Here is the current progress of active serializations and their chapter timelines.
            </p>
            <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
              {getChapters().map(c => {
                const tasksList = getTasks(c.id)
                const appPages = tasksList.filter(t => t.status === 'Approved').length
                const totPages = c.totalPages
                const progress = Math.round((appPages / (tasksList.length || 1)) * 100)

                return (
                  <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Chapter {c.number}: {c.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md ${getChapterStatusClass(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Deadline: {c.deadline} | Target Pub Date: {c.publicationDate}</p>
                    </div>
                    <div className="space-y-1 text-right sm:w-48 shrink-0">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">Assigned Tasks:</span>
                        <span className="text-primary">{tasksList.length} Tasks ({progress}% done)</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* A. Create Chapter Modal (Mangaka) */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-4">
                <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-primary" /> Đăng Ký Chapter Mới (P3)
                </h3>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-all cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" /> Điền Dữ Liệu Mẫu
                </button>
              </div>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hướng dẫn quy trình */}
            <div className="p-4 border border-cyan-500/20 bg-cyan-500/5 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-cyan-500">Quy trình Mangaka khi bắt đầu chapter mới:</p>
                  <p>① Khai báo thông tin cơ bản (chọn series, số chapter, tiêu đề, ngày ra) → hệ thống tự tính deadline</p>
                  <p>② Đính kèm kịch bản/storyboard để Editor nắm trước nội dung (Tùy chọn)</p>
                  <p>③ Nộp bản thảo tranh thô bắt buộc (rough/ink) → Mangaka giao task vẽ chi tiết cho Assistant</p>
                  <p>④ Ghi chú yêu cầu đặc biệt cho Editor (double-spread, SFX, lettering...) (Tùy chọn)</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-6">
              
              {/* Section 1: Thông tin cơ bản */}
              <div className="space-y-4 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <BookOpen className="w-4 h-4 text-primary" />
                  1. Thông tin cơ bản
                </h4>

                {/* Series */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Tác phẩm (Series) <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${
                      errors.seriesId ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                    }`}
                    value={newChapterSeriesId}
                    onChange={(e) => {
                      setNewChapterSeriesId(e.target.value)
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.seriesId
                        return copy
                      })
                    }}
                  >
                    <option value="">Chọn tác phẩm của bạn...</option>
                    {mangakaSeries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  {errors.seriesId && <p className="text-xs text-red-500 mt-1">{errors.seriesId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Chapter No */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" /> Số chương <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 12"
                      min={1}
                      className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${
                        errors.chapterNo ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                      }`}
                      value={newChapterNo}
                      onChange={(e) => {
                        setNewChapterNo(e.target.value)
                        setErrors(prev => {
                          const copy = { ...prev }
                          delete copy.chapterNo
                          return copy
                        })
                      }}
                    />
                    {errors.chapterNo && <p className="text-xs text-red-500 mt-1">{errors.chapterNo}</p>}
                  </div>

                  {/* Total Pages */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Tổng số trang <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 24"
                      min={1}
                      className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                      value={newChapterPages}
                      onChange={(e) => setNewChapterPages(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Tên chương <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Sự Thức Tỉnh Của Rồng Thần"
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${
                      errors.title ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                    }`}
                    value={newChapterTitle}
                    onChange={(e) => {
                      setNewChapterTitle(e.target.value)
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.title
                        return copy
                      })
                    }}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                {/* Publication Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Ngày xuất bản dự kiến <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${
                      errors.publicationDate ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
                    }`}
                    value={newChapterPubDate}
                    onChange={(e) => {
                      setNewChapterPubDate(e.target.value)
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.publicationDate
                        return copy
                      })
                    }}
                  />
                  {errors.publicationDate && <p className="text-xs text-red-500 mt-1">{errors.publicationDate}</p>}
                  
                  {newChapterPubDate && !errors.publicationDate && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-amber-700 dark:text-amber-400">
                        <strong>BR-42:</strong> Hạn chót nộp bản thảo hoàn chỉnh cho Editor:{' '}
                        <strong>
                          {(() => {
                            const d = new Date(newChapterPubDate)
                            d.setDate(d.getDate() - 14)
                            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          })()}
                        </strong>{' '}
                        (14 ngày trước ngày xuất bản)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Tóm tắt nội dung */}
              <div className="space-y-3 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  2. Tóm tắt nội dung chương (Synopsis)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Mô tả ngắn gọn diễn biến chính. Editor dùng phần này để duyệt và chuẩn bị định hướng biên tập.
                </p>
                <textarea
                  placeholder="VD: Ryuu giải phóng sức mạnh rồng thần để đối đầu với hội đồng hắc ám..."
                  className="w-full h-24 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  value={newChapterSynopsis}
                  onChange={(e) => setNewChapterSynopsis(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">{newChapterSynopsis.length} ký tự</p>
              </div>

              {/* Section 3: Storyboard */}
              <div className="space-y-3 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <ScrollText className="w-4 h-4 text-violet-500" />
                  3. Kịch bản / Storyboard <span className="text-xs font-normal text-muted-foreground ml-1">(Tùy chọn)</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Bản phác thảo layout phân khung (storyboard/nemu) giúp Editor và Trợ lý hiểu cấu trúc chương.
                </p>
                <div className="p-5 border-2 border-dashed border-violet-500/20 hover:border-violet-500/40 bg-violet-500/5 rounded-2xl text-center transition-colors">
                  <ScrollText className="w-8 h-8 mx-auto mb-2 text-violet-400 opacity-60" />
                  <p className="text-xs text-muted-foreground">Kéo thả hoặc</p>
                  <button
                    type="button"
                    onClick={() => handleMockUpload('storyboardFiles')}
                    className="mt-2 inline-flex items-center justify-center gap-1.5 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Chọn file kịch bản / storyboard
                  </button>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, JPG, PNG · Tối đa 20MB/file</p>
                </div>
                {newChapterStoryboardFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {newChapterStoryboardFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/60 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-base">📄</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <button
                            type="button"
                            onClick={() => removeFile('storyboardFiles', idx)}
                            className="text-xs text-red-500 hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Bản thảo Sequential Art (Bắt buộc) */}
              <div className="space-y-3 border-b border-border/50 pb-5">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  4. Bản thảo Sequential Art <span className="text-red-500">* Bắt buộc</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Đính kèm phác thảo thô (pencil) hoặc bản vẽ nét (ink) để bắt đầu phân chia công việc vẽ.
                </p>
                <div className={`p-5 border-2 border-dashed rounded-2xl text-center transition-colors ${
                  errors.manuscriptFiles 
                    ? 'border-red-500 bg-red-500/5' 
                    : 'border-primary/20 hover:border-primary/40 bg-primary/5'
                }`}>
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${errors.manuscriptFiles ? 'text-red-400' : 'text-primary'} opacity-65`} />
                  <p className="text-xs text-muted-foreground">Kéo thả bản thảo vào đây hoặc</p>
                  <button
                    type="button"
                    onClick={() => handleMockUpload('manuscriptFiles')}
                    className="mt-2 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Chọn File (Browse)
                  </button>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">ZIP, PDF, JPG, PNG, TIF · Tối đa 50MB/file</p>
                </div>
                {errors.manuscriptFiles && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-semibold mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.manuscriptFiles}
                  </p>
                )}
                {newChapterManuscriptFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {newChapterManuscriptFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/60 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{file.type === 'zip' ? '🗜️' : '🖼️'}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <button
                            type="button"
                            onClick={() => removeFile('manuscriptFiles', idx)}
                            className="text-xs text-red-500 hover:underline cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 5: Ghi chú cho Editor */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  5. Ghi chú đặc biệt cho Editor <span className="text-xs font-normal text-muted-foreground ml-1">(Tùy chọn)</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Các yêu cầu dàn trang đặc biệt: Trang đôi (double-spread), font thoại, thứ tự đọc đặc biệt, v.v.
                </p>
                <textarea
                  placeholder="VD: Trang 12-13 dùng double-spread cảnh chiến đấu lớn, tránh cắt giữa khi đóng gáy..."
                  className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  value={newChapterNotes}
                  onChange={(e) => setNewChapterNotes(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-md shadow-primary/10 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Đăng Ký Chapter Lên Hệ Thống
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Create / Assign Task Modal (Mangaka) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Assign Drawing Task
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Task Types Multiselect Checkboxes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Task Types (Chọn một hoặc nhiều)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-muted/40 border border-border rounded-xl">
                  {['Line Art', 'Coloring', 'Background Art', 'Screentoning', 'Clean-up'].map((t) => {
                    const checked = newTaskTypes.includes(t)
                    return (
                      <label key={t} className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setNewTaskTypes(prev => prev.filter(x => x !== t))
                            } else {
                              setNewTaskTypes(prev => [...prev, t])
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary/20 w-3.5 h-3.5 accent-primary"
                        />
                        {t}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Pages Range: Start & End */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Page Start</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedChapter?.totalPages || 100}
                    value={newTaskPageStart}
                    onChange={(e) => setNewTaskPageStart(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Page End</label>
                  <input
                    type="number"
                    min={newTaskPageStart}
                    max={selectedChapter?.totalPages || 100}
                    value={newTaskPageEnd}
                    onChange={(e) => setNewTaskPageEnd(Math.max(newTaskPageStart, parseInt(e.target.value) || newTaskPageStart))}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Due Date & Select Assistant */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" /> Due Date (Hạn nộp)
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Select Assistant</label>
                  <select
                    value={newTaskAssistantId}
                    onChange={(e) => setNewTaskAssistantId(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  >
                    <option value="Unassigned">Leave Unassigned</option>
                    {assistants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.specialty}) — Active Tasks: {a.activeTasks}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instructions / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Instruction & Description</label>
                <textarea
                  placeholder="Describe details: Pagoda background, light direction, character expression..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  required
                />
              </div>

              {/* Attach Reference Files input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-primary" /> Reference & Guidelines Files (Tài liệu đính kèm)
                </label>
                <div className="p-3 border-2 border-dashed border-primary/20 hover:border-primary/45 bg-primary/5 rounded-xl text-center transition-colors">
                  <p className="text-xs text-muted-foreground">Đính kèm các file tài liệu hướng dẫn vẽ</p>
                  <button
                    type="button"
                    onClick={handleTaskMockUpload}
                    className="mt-1.5 inline-flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach Mock File
                  </button>
                </div>
                {newTaskAttachments.length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                    {newTaskAttachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/70 rounded-xl border border-border text-xs">
                        <span className="truncate max-w-[280px] font-medium text-foreground">📄 {file.name} ({file.size})</span>
                        <button
                          type="button"
                          onClick={() => removeTaskAttachment(idx)}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Review Assistant Submission Modal (Mangaka) */}
      {isReviewModalOpen && activeTaskToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Review Assistant Work
              </h3>
              <button
                onClick={() => {
                  setIsReviewModalOpen(false)
                  setActiveTaskToReview(null)
                  setReviewFeedback('')
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Side: Mock Image Preview */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground">Submitted Work Preview</label>
                <div className="relative border border-border rounded-xl overflow-hidden bg-muted aspect-4/3 flex items-center justify-center group shadow-inner">
                  {activeTaskToReview.submittedWorkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeTaskToReview.submittedWorkUrl}
                      alt="Work deliverable"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                  )}
                </div>

                {/* Submitted Files List */}
                {activeTaskToReview.submittedFiles && activeTaskToReview.submittedFiles.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Submitted Files ({activeTaskToReview.submittedFiles.length})</label>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {activeTaskToReview.submittedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
                          <span className="font-medium text-emerald-800 dark:text-emerald-400 truncate max-w-[200px]">🖼️ {file.name}</span>
                          <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded shrink-0">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border">
                    Không có file đính kèm nào được nộp
                  </div>
                )}
              </div>

              {/* Right Side: Task Details & Actions */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Manga: {getMangaTitleForTask(activeTaskToReview)}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded inline-block">
                      {activeTaskToReview.type} (Pages {activeTaskToReview.pages})
                    </span>
                  </div>
                  
                  <p className="text-sm font-bold text-foreground leading-snug">
                    {activeTaskToReview.description}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    Submitted by: <strong>{activeTaskToReview.assistantName}</strong>
                  </p>
                  
                  <div className="p-3 bg-muted/50 rounded-xl text-xs leading-relaxed text-foreground border border-border">
                    <p className="font-bold text-muted-foreground mb-1 text-[10px] uppercase">Assistant Notes & Edits:</p>
                    <p className="italic whitespace-pre-line">{activeTaskToReview.submitDescription || 'Đã hoàn thành công việc, gửi Mangaka duyệt.'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">Feedback Comments (Required for Rejection)</label>
                  <textarea
                    placeholder="Provide feedback... Good points, details to modify..."
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2.5 justify-end pt-2 border-t border-border">
                  <button
                    onClick={() => handleRejectTask(activeTaskToReview)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center shadow-sm"
                  >
                    Reject (Revision Needed)
                  </button>
                  <button
                    onClick={() => handleApproveTask(activeTaskToReview)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center shadow-sm"
                  >
                    Approve & Sign-off
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. Submit Task Deliverable Modal (Assistant) */}
      {isSubmitWorkModalOpen && activeTaskToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" /> Submit Drawing Work
              </h3>
              <button
                onClick={() => {
                  setIsSubmitWorkModalOpen(false)
                  setActiveTaskToSubmit(null)
                  setSubmitWorkUrl('')
                  setSubmitComment('')
                  setSubmittedFiles([])
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div className="space-y-1.5 bg-muted/40 p-3.5 rounded-xl border border-border/50 text-xs">
                <p className="font-extrabold uppercase tracking-wider text-muted-foreground text-[9px]">
                  Manga: {getMangaTitleForTask(activeTaskToSubmit)}
                </p>
                <p className="font-bold text-foreground">Task: {activeTaskToSubmit.type} (Pages {activeTaskToSubmit.pages})</p>
                <p className="text-muted-foreground mt-0.5">{activeTaskToSubmit.description}</p>
              </div>

              {/* Upload area for submittedFiles */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-primary" /> Upload Work Files (Nộp file bản vẽ)
                </label>
                <div className="p-3 border-2 border-dashed border-primary/20 hover:border-primary/45 bg-primary/5 rounded-xl text-center transition-colors">
                  <p className="text-xs text-muted-foreground">Kéo thả file vẽ hoặc click để chọn</p>
                  <button
                    type="button"
                    onClick={handleAssistantMockUpload}
                    className="mt-1.5 inline-flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach Work File
                  </button>
                </div>
                {submittedFiles.length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                    {submittedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted/70 rounded-xl border border-border text-xs">
                        <span className="truncate max-w-[280px] font-medium text-foreground">🖼️ {file.name} ({file.size})</span>
                        <button
                          type="button"
                          onClick={() => removeAssistantSubmittedFile(idx)}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Work Image URL (For Preview)</label>
                <input
                  type="url"
                  placeholder="https://example.com/drawing.jpg (leave blank for sample image)"
                  value={submitWorkUrl}
                  onChange={(e) => setSubmitWorkUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Description & Comments for Mangaka (Mô tả chỉnh sửa)</label>
                <textarea
                  placeholder="Describe your edits: e.g., line art completed, shading applied, shadows adjusted..."
                  value={submitComment}
                  onChange={(e) => setSubmitComment(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitWorkModalOpen(false)
                    setActiveTaskToSubmit(null)
                    setSubmitWorkUrl('')
                    setSubmitComment('')
                    setSubmittedFiles([])
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Submit Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. View Task Details Modal (Read-only for Assistant/General) */}
      {isViewDetailModalOpen && activeTaskToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Task Detailed Information
              </h3>
              <button
                onClick={() => {
                  setIsViewDetailModalOpen(false)
                  setActiveTaskToView(null)
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Manga & Chapter Info */}
              <div className="p-3.5 bg-muted/40 border border-border rounded-xl space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manga Series</p>
                <p className="font-bold text-foreground text-base">{getMangaTitleForTask(activeTaskToView)}</p>
                <p className="text-xs text-muted-foreground font-semibold">{getChapterInfoForTask(activeTaskToView)}</p>
              </div>

              {/* Task Grid Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Task Types</p>
                  <p className="font-semibold text-foreground bg-primary/5 border border-primary/10 px-2.5 py-1.5 rounded-lg inline-block">
                    {activeTaskToView.type}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Pages Range</p>
                  <p className="font-semibold text-foreground bg-muted px-2.5 py-1.5 rounded-lg inline-block">
                    Pages {activeTaskToView.pages}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Due Date (Hạn nộp)</p>
                  <p className="font-semibold text-amber-600 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1.5 rounded-lg inline-block">
                    {activeTaskToView.dueDate || 'Không giới hạn'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Assigned Status</p>
                  <p className={`font-semibold px-2.5 py-1.5 rounded-lg inline-block text-xs ${getTaskStatusClass(activeTaskToView.status)}`}>
                    {activeTaskToView.status}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Instruction & Description</p>
                <div className="p-3 bg-muted/30 border border-border rounded-xl text-foreground whitespace-pre-line text-xs leading-relaxed">
                  {activeTaskToView.description}
                </div>
              </div>

              {/* Reference Files from Mangaka */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Attached Reference Files</p>
                {activeTaskToView.attachments && activeTaskToView.attachments.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeTaskToView.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-muted/60 rounded-xl border border-border text-xs">
                        <span className="font-medium text-foreground truncate max-w-[340px]">📄 {file.name}</span>
                        <span className="text-muted-foreground shrink-0 text-[10px] bg-muted px-1.5 py-0.5 rounded">{file.size}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Không có file đính kèm nào</p>
                )}
              </div>

              {/* Assistant Submission details if submitted/approved */}
              {activeTaskToView.submitDescription && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-bold text-muted-foreground">Assistant Submission Notes</p>
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-foreground text-xs leading-relaxed">
                    {activeTaskToView.submitDescription}
                  </div>
                </div>
              )}

              {activeTaskToView.submittedFiles && activeTaskToView.submittedFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground">Submitted Work Files</p>
                  {activeTaskToView.submittedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
                      <span className="font-medium text-emerald-800 dark:text-emerald-400 truncate max-w-[340px]">🖼️ {file.name}</span>
                      <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded">{file.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsViewDetailModalOpen(false)
                  setActiveTaskToView(null)
                }}
                className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
