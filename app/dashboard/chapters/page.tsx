'use client'

import { compareAny,extractImagesFromZip  } from '@/lib/imageCompare'
import { getSalaryByAssistant, formatVND } from '@/lib/salary'
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
  PencilLine,
  ScrollText,
  CalendarDays,
  Hash,
  AlertCircle,
  Info,
  Layers
} from 'lucide-react'
import {
  TASK_TYPE_SUGGESTIONS,
  type Chapter,
  type Task,
  type Assistant,
  type Series,
  type ChapterStatus,
  type TaskStatus
} from '@/lib/chapters-store'
import { fetchAPI } from '@/services/api'
import { seriesService } from '@/services/seriesService'
import { chapterService } from '@/services/chapterService'
import { userService } from '@/services/userService'
import { calculateChapterDeadline, calculateChapterProgress } from '@/lib/business-logic'

export default function ChaptersPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)
  const [mangakaId, setMangakaId] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.id) {
          setMangakaId(parsed.id)
        }
      } catch { }
    }
  }, [])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // --- State for Mangaka Role ---
  const [mangakaSeries, setMangakaSeries] = useState<Series[]>([])
  const [allChapters, setAllChapters] = useState<Chapter[]>([])
  const [allSeries, setAllSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [chapterTasks, setChapterTasks] = useState<Task[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])

  // Modal control states
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [activeTaskToReview, setActiveTaskToReview] = useState<Task | null>(null)
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false)
  const [activeTaskToView, setActiveTaskToView] = useState<Task | null>(null)
const [subCompareLoading, setSubCompareLoading] = useState(false)
  const [subCompareResult, setSubCompareResult] = useState<{ percent: number; diff?: string } | null>(null)
  const [subCompareError, setSubCompareError] = useState('')

  const handleCompareSubmissions = async () => {
    const cur = activeTaskToReview?.submittedWorkUrl
    const prev = activeTaskToReview?.prevSubmittedWorkUrl
    if (!cur || !prev) { setSubCompareError('Cần ít nhất 2 lần nộp để so sánh.'); setSubCompareResult(null); return }
    setSubCompareError(''); setSubCompareLoading(true); setSubCompareResult(null)
    try {
      const r = await compareAny(prev, cur)
      setSubCompareResult({ percent: r.diffPercent, diff: r.diffDataUrl })
    } catch (e: any) {
      setSubCompareError('Lỗi khi so sánh: ' + (e?.message || 'không đọc được file'))
    } finally { setSubCompareLoading(false) }
  }
  // Form states for creating chapter (Matching SubmitChapterPage.jsx)
  const [newChapterSeriesId, setNewChapterSeriesId] = useState('')
  const [newChapterNo, setNewChapterNo] = useState<string>('')
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [newChapterPages, setNewChapterPages] = useState<number>(24)
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false)
  const [editChapterId, setEditChapterId] = useState<string>('')
  const [editChapterTitle, setEditChapterTitle] = useState('')
  const [editChapterPages, setEditChapterPages] = useState<number>(0)
  const [editChapterPubDate, setEditChapterPubDate] = useState('')
  const [editChapterDeadline, setEditChapterDeadline] = useState('')
  const [newChapterPubDate, setNewChapterPubDate] = useState('')
  const [newChapterSynopsis, setNewChapterSynopsis] = useState('')
  const [newChapterNotes, setNewChapterNotes] = useState('')
  const [newChapterStoryboardFiles, setNewChapterStoryboardFiles] = useState<any[]>([])
  const [newChapterManuscriptFiles, setNewChapterManuscriptFiles] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form states for creating task
  const [newTaskType, setNewTaskType] = useState<string>('')
  const [newTaskPageStart, setNewTaskPageStart] = useState<number>(1)
  const [newTaskPageEnd, setNewTaskPageEnd] = useState<number>(3)
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskAssistantId, setNewTaskAssistantId] = useState('Unassigned')
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('')
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string>('')
  const [editTaskPageStart, setEditTaskPageStart] = useState<number>(1)
  const [editTaskPageEnd, setEditTaskPageEnd] = useState<number>(1)
  const [editTaskDescription, setEditTaskDescription] = useState<string>('')
  const [editTaskDueDate, setEditTaskDueDate] = useState<string>('')
  const [editTaskAssistantId, setEditTaskAssistantId] = useState('')
  const [isSubmitManuscriptOpen, setIsSubmitManuscriptOpen] = useState(false)
  const [submitManuscriptFile, setSubmitManuscriptFile] = useState<File | null>(null)
  const [submitManuscriptNotes, setSubmitManuscriptNotes] = useState<string>('')
  const [submitManuscriptUploading, setSubmitManuscriptUploading] = useState(false)
  const [newTaskAttachments, setNewTaskAttachments] = useState<any[]>([])

  // Review states (Approve / Reject)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [imagePins, setImagePins] = useState<{ x: number; y: number; note: string; page: number }[]>([])
  const [zipPages, setZipPages] = useState<{ name: string; dataUrl: string }[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [zipLoading, setZipLoading] = useState(false)
  const [pinOverlayOpen, setPinOverlayOpen] = useState(false)
  const openPinOverlay = async () => {
    const url = activeTaskToReview?.submittedWorkUrl
    if (!url) return
    setCurrentPage(0)
    setPinOverlayOpen(true)
    if (/\.zip(\?|$)/i.test(url)) {
      setZipLoading(true)
      try {
        const imgs = await extractImagesFromZip(url)
        setZipPages(imgs.length ? imgs : [])
      } catch {
        setZipPages([])
      } finally {
        setZipLoading(false)
      }
    } else {
      setZipPages([{ name: 'image', dataUrl: url }])
    }
  }
  // --- State for Assistant Role ---
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('A01') // Sato Takashi by default
  const [assistantTasks, setAssistantTasks] = useState<Task[]>([])
  const [isSubmitWorkModalOpen, setIsSubmitWorkModalOpen] = useState(false)
  const [activeTaskToSubmit, setActiveTaskToSubmit] = useState<Task | null>(null)
  const [submitWorkUrl, setSubmitWorkUrl] = useState('')
  const [submitWorkFile, setSubmitWorkFile] = useState<File | null>(null)
  const [submitWorkUploading, setSubmitWorkUploading] = useState(false)
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
  }, [role, selectedSeriesId, selectedChapterId, selectedAssistantId, mangakaId])

  const mapBackendTaskStatus = (status: any, submissions?: any[]): TaskStatus => {
    const statusStr = String(status).trim().toUpperCase();
    const latestSubmission = submissions && submissions.length > 0
      ? [...submissions].sort((a: any, b: any) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())[submissions.length - 1]
      : null;
    const latestSubStatus = latestSubmission
      ? String(latestSubmission.status).trim().toUpperCase()
      : '';

    if (statusStr === '3' || statusStr === 'APPROVED') {
      return 'Approved';
    }
    if (statusStr === '2' || statusStr === 'COMPLETED') {
      return 'Submitted';
    }
    if (statusStr === '1' || statusStr === 'INPROGRESS' || statusStr === 'IN-PROGRESS') {
      if (latestSubStatus === '2' || latestSubStatus === 'REJECTED') {
        return 'Rejected';
      }
      return 'In-Progress';
    }
    if (statusStr === '0' || statusStr === 'ASSIGNED') {
      return 'Pending';
    }
    return 'Pending';
  }

  const fetchTasks = async (chapterId?: string): Promise<Task[]> => {
    try {
      const activeRole = localStorage.getItem('user-role') || role
      let endpoint = '/api/page-tasks/mangaka'
      if (activeRole === 'Assistant') {
        endpoint = '/api/page-tasks/assistant'
      }
      const response = await fetchAPI<{ data: any[] }>(endpoint)
      const data = response.data || response || []

      if (Array.isArray(data)) {
        const mapped = data.map((t: any) => {
          const sortedSubs = (t.submissions || []).slice().sort((a: any, b: any) => {
            const da = new Date(a.submittedAt || a.createdAt || a.submittedDate || 0).getTime()
            const db = new Date(b.submittedAt || b.createdAt || b.submittedDate || 0).getTime()
            return da - db // cu -> moi
          })
          const latestSub = sortedSubs.length > 0 ? sortedSubs[sortedSubs.length - 1] : null;

          let uiStatus = mapBackendTaskStatus(t.status, t.submissions)
          if (uiStatus === 'Pending') {
            try {
              const started = JSON.parse(localStorage.getItem('started_tasks') || '[]')
              if (started.includes(t.pageTaskId || t.id)) {
                uiStatus = 'In-Progress'
              }
            } catch { }
          }

          return {
            id: t.pageTaskId || t.id,
            chapterId: t.chapterId,
            type: t.taskType,
            pages: `${t.pageStart}-${t.pageEnd}`,
            description: t.description || '',
            assistantId: t.assistantId || 'Unassigned',
            assistantName: t.assistantName || 'Assistant',
            status: uiStatus,
            dueDate: t.dueDate || undefined,
            pageStart: t.pageStart,
            pageEnd: t.pageEnd,
            submittedWorkUrl: latestSub?.submittedFileAssetUrl || undefined,
            prevSubmittedWorkUrl: sortedSubs.length >= 2 ? sortedSubs[sortedSubs.length - 2]?.submittedFileAssetUrl : undefined,
            submittedFileAssetId: latestSub?.submittedFileAssetId || undefined,
            submitDescription: latestSub?.note || undefined,
            submissionId: latestSub?.submissionId || latestSub?.id || undefined,
            feedback: latestSub?.feedback || latestSub?.rejectReason || undefined,
            createdAt: t.createdAt || '',
            referenceFiles: t.taskReferences || t.referenceFiles || []
          }
        })
        return chapterId ? mapped.filter(t => t.chapterId === chapterId) : mapped
      }
    } catch (error) {
      console.warn("fetchTasks failed:", error)
    }
    return []
  }

  const refreshData = async (preferredChapterId?: string) => {
    try {
      // 1. Fetch series and filter by active and mangaka ownership
      const allProposals = await seriesService.listSeries()
      const mappedProposals: Series[] = allProposals.map(p => ({
        id: p.id,
        title: p.title,
        mangakaId: p.mangakaId || '',
        coverColor: p.coverColor || 'from-emerald-400 to-teal-500',
        status: p.status
      }))
      setAllSeries(mappedProposals)

      const allChaps = await chapterService.listChapters()
      setAllChapters(allChaps)

      const activeSeries = mappedProposals.filter(p => p.status === 'Active' && p.mangakaId === mangakaId)
      setMangakaSeries(activeSeries)

      let currentSeriesId = selectedSeriesId
      if (!currentSeriesId && activeSeries.length > 0) {
        currentSeriesId = activeSeries[0].id
        setSelectedSeriesId(currentSeriesId)
      }

      // 2. Load Chapters for series
      if (currentSeriesId) {
        const chapterList = await chapterService.getChaptersBySeries(currentSeriesId)
        setChapters(chapterList)

        let currentChapterId = preferredChapterId || selectedChapterId
        if (!currentChapterId && chapterList.length > 0) {
          currentChapterId = chapterList[0].id
          setSelectedChapterId(currentChapterId)
        }

        if (currentChapterId) {
          const chap = chapterList.find(c => c.id === currentChapterId)
          setSelectedChapter(chap || null)

          // Load tasks from backend
          const backendTasks = await fetchTasks(currentChapterId)
          setChapterTasks(
            [...backendTasks].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          )
        } else {
          setSelectedChapter(null)
          setChapterTasks([])
        }
      } else {
        setChapters([])
        setSelectedChapter(null)
        setChapterTasks([])
      }

      // 3. Load Assistant list from backend
      const usersRes = await userService.getAssistants()
      const assistantsList = (usersRes.data || []).filter(u => u.roleName?.toLowerCase() === 'assistant')

      // Load all tasks to calculate active tasks per assistant
      const allTasksList = await fetchTasks()
      setAllTasks(allTasksList)
      const mappedAssistants = assistantsList.map(u => {
        const activeTasks = allTasksList.filter(
          t => t.assistantId === u.userId &&
            (t.status === 'Pending' || t.status === 'In-Progress' || t.status === 'Submitted' || t.status === 'Rejected')
        ).length
        return {
          id: u.userId,
          name: u.displayName || u.userName,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          specialty: 'Assistant',
          activeTasks
        }
      })
      setAssistants(mappedAssistants)

      // 4. Load tasks for assistant role
      if (role === 'Assistant' && selectedAssistantId) {
        const assTasks = allTasksList.filter(t => t.assistantId === selectedAssistantId)
        setAssistantTasks(
          [...assTasks].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        )
      }
    } catch (error) {
      console.error("refreshData failed:", error)
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
    const chapter = allChapters.find(c => c.id === task.chapterId)
    if (!chapter) return 'Unknown Manga'
    const series = allSeries.find(s => s.id === chapter.seriesId)
    return series ? series.title : 'Unknown Manga'
  }

  // Lấy thông tin số chương và tiêu đề chương tương ứng với task.chapterId
  const getChapterInfoForTask = (task: Task) => {
    const chapter = allChapters.find(c => c.id === task.chapterId)
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
 const openEditChapter = () => {
    const chap = chapters.find(c => c.id === selectedChapterId) as any
    if (!chap) {
      showToast('Chưa chọn chapter để sửa!', 'error')
      return
    }
    setEditChapterId(chap.id)
    setEditChapterTitle(chap.title || '')
    setEditChapterPages(chap.totalPages ?? chap.pages ?? 0)
    setEditChapterPubDate((chap.publicationDate || '').slice(0, 10))
    setEditChapterDeadline((chap.deadline || '').slice(0, 10))
    setIsEditChapterOpen(true)
  }

  const handleSaveEditChapter = async () => {
    if (!editChapterTitle.trim()) {
      showToast('Tiêu đề không được để trống!', 'error')
      return
    }
    try {
      await chapterService.updateChapter(editChapterId, {
        title: editChapterTitle.trim(),
        totalPages: editChapterPages,
        publicationDate: editChapterPubDate || undefined,
        deadline: editChapterDeadline || undefined
      })
      showToast('Đã cập nhật chapter!', 'success')
      setIsEditChapterOpen(false)
      refreshData()
    } catch {
      showToast('Cập nhật thất bại.', 'error')
    }
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
    if (selectedSeries && !canCreateChapter(mangakaId, selectedSeries)) {
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

    chapterService.createChapter({
      seriesId: newChapterSeriesId,
      number: parseInt(newChapterNo) || 0,
      title: newChapterTitle,
      totalPages: newChapterPages,
      publicationDate: newChapterPubDate,
      deadline: deadlineString
    }).then(async (res: any) => {
      const created = res.data || res
      const newChapterId = created.chapterId || created.id
      const realFiles = [...newChapterManuscriptFiles, ...newChapterStoryboardFiles].filter((f: any) => f instanceof File)
      if (newChapterId && realFiles.length > 0) {
        const formData = new FormData()
        formData.append('category', 'ChapterReference')
        realFiles.forEach((f: File) => formData.append('files', f))
        const uploadRes = await fetchAPI<{ data: { files: { fileAssetId: string }[] } }>('/api/files', { method: 'POST', body: formData })
        const fileAssetIds = uploadRes.data.files.map(f => f.fileAssetId)
        if (fileAssetIds.length > 0) {
          await fetchAPI(`/api/chapters/${newChapterId}/reference-files`, { method: 'POST', body: JSON.stringify({ fileAssetIds }) })
        }
      }
      showToast(`Đã tạo thành công Chapter ${created.chapterNo || created.number || newChapterNo}: ${created.title || newChapterTitle}!`)
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

      setSelectedChapterId(created.chapterId || created.id)
      refreshData(created.chapterId || created.id)
    }).catch((err: any) => {
      const msg = err?.message || ''
      if (msg.includes('Conflict') || msg.includes('already exists') || msg.includes('409')) {
        showToast('Số chương này đã tồn tại trong tác phẩm. Vui lòng chọn số chương khác.', 'error')
      } else {
        showToast(msg || 'Tạo chapter thất bại.', 'error')
      }
    })
  }
const openEditTask = (task: Task) => {
    setEditTaskId(task.id)
    setEditTaskPageStart(task.pageStart || 1)
    setEditTaskPageEnd(task.pageEnd || 1)
    setEditTaskDescription(task.description || '')
    setEditTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
    setEditTaskAssistantId(task.assistantId || '')
    setIsEditTaskOpen(true)
  }

  const handleSaveEditTask = async () => {
    if (editTaskPageStart > editTaskPageEnd) {
      showToast('Trang bắt đầu phải nhỏ hơn hoặc bằng trang kết thúc.', 'error')
      return
    }
    try {
      await fetchAPI(`/api/page-tasks/${editTaskId}`, {
        method: 'PUT',
       body: JSON.stringify({
          pageStart: editTaskPageStart,
          pageEnd: editTaskPageEnd,
          description: editTaskDescription,
          dueDate: editTaskDueDate,
          assistantId: editTaskAssistantId || undefined,
        })
      })
      showToast('Đã cập nhật task!')
      setIsEditTaskOpen(false)
      refreshData()
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Conflict') || msg.includes('overlap') || msg.includes('409')) {
        showToast('Khoảng trang này đã được giao cho task khác. Vui lòng chọn khoảng trang khác.', 'error')
      } else {
        showToast(msg || 'Cập nhật task thất bại.', 'error')
      }
    }
  }
  const handleSubmitManuscript = async () => {
    if (!submitManuscriptFile) {
      showToast('Vui lòng chọn file bản thảo.', 'error')
      return
    }
    try {
      setSubmitManuscriptUploading(true)
      const formData = new FormData()
      formData.append('category', 'Generic')
      formData.append('files', submitManuscriptFile)
      const uploadRes = await fetchAPI<{ data: { files: { publicUrl?: string }[] } }>('/api/files', { method: 'POST', body: formData })
      const fileUrl = uploadRes?.data?.files?.[0]?.publicUrl
      if (!fileUrl) { showToast('Upload file thất bại.', 'error'); return }
      await fetchAPI('/api/manuscripts', {
        method: 'POST',
        body: JSON.stringify({ chapterId: selectedChapterId, fileUrl, notes: submitManuscriptNotes })
      })
      showToast('Đã gửi bản thảo cho Editor (tạo version mới)!')
      setIsSubmitManuscriptOpen(false)
      setSubmitManuscriptFile(null)
      setSubmitManuscriptNotes('')
      refreshData()
    } catch (err: any) {
      const msg = err?.message || ''
      showToast(msg || 'Gửi thất bại (có thể chưa duyệt hết task).', 'error')
    } finally {
      setSubmitManuscriptUploading(false)
    }
  }
  // 2. Tạo Task & Giao việc cho Assistant
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newTaskPageStart > newTaskPageEnd) {
      showToast('Trang bắt đầu không thể lớn hơn trang kết thúc!', 'error')
      return
    }
    if (!newTaskDesc.trim()) {
      showToast('Vui lòng nhập mô tả công việc!', 'error')
      return
    }
    if (!newTaskAssistantId || newTaskAssistantId === 'Unassigned') {
      showToast('Vui lòng chọn một assistant để giao việc!', 'error')
      return
    }
    // Fetch latest manuscript for chapter
    fetchAPI<{ data: any[] } | any[]>(`/api/chapters/${selectedChapterId}/manuscripts`).then((res) => {
      const list = (res as any).data || res
      const latestManuscript = Array.isArray(list) && list.length > 0 ? list[0] : null
      const manuscriptId = latestManuscript?.manuscriptId || latestManuscript?.id || '77777777-7777-7777-7777-777777777777'

      const payload = {
        chapterId: selectedChapterId,
        assistantId: newTaskAssistantId,
        pageStart: newTaskPageStart,
        pageEnd: newTaskPageEnd,
        taskType: newTaskType.trim(),
        description: newTaskDesc,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null
      }

      return fetchAPI('/api/page-tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    }).then(async (taskRes: any) => {
      const created = (taskRes as any)?.data || taskRes
      const newTaskId = created?.pageTaskId || created?.id
      const realFiles = newTaskAttachments.filter((f: any) => f instanceof File)
      if (newTaskId && realFiles.length > 0) {
        const formData = new FormData()
        formData.append('category', 'TaskReference')
        realFiles.forEach((f: File) => formData.append('files', f))
        const uploadRes = await fetchAPI<{ data: { files: { fileAssetId: string }[] } }>('/api/files', { method: 'POST', body: formData })
        const fileAssetIds = uploadRes.data.files.map(f => f.fileAssetId)
        if (fileAssetIds.length > 0) {
          await fetchAPI(`/api/page-tasks/${newTaskId}/reference-files`, { method: 'POST', body: JSON.stringify({ fileAssetIds }) })
        }
      }
      showToast(`Đã tạo task và giao việc thành công!`)
      setNewTaskAttachments([])
      setIsTaskModalOpen(false)
      setNewTaskDesc('')
      setNewTaskType('Line Art')
      setNewTaskPageStart(1)
      setNewTaskPageEnd(3)
      setNewTaskDueDate('')
      setNewTaskAttachments([])

      // Update chapter status to 'In Progress' if it is 'Draft'
      if (selectedChapter && selectedChapter.status === 'Draft') {
        chapterService.updateChapter(selectedChapterId, { status: 'In Progress' }).finally(() => {
          refreshData()
        })
      } else {
        refreshData()
      }
    }).catch((err: any) => {
      const msg = err?.message || ''
      if (msg.includes('Conflict') || msg.includes('overlap') || msg.includes('409')) {
        showToast('Khoảng trang này đã được giao cho task khác. Vui lòng chọn khoảng trang khác.', 'error')
      } else {
        showToast(msg || 'Giao task thất bại.', 'error')
      }
    })
  }

  // 3. Duyệt Task của Assistant (Approve)
  const handleApproveTask = (task: Task) => {
    if (!task.submissionId) {
      showToast('Không tìm thấy bản nộp để phê duyệt.', 'error')
      return
    }
    fetchAPI(`/api/page-tasks/submissions/${task.submissionId}/approve`, {
      method: 'POST'
    }).then(() => {
      showToast(`Đã phê duyệt công việc của ${task.assistantName}!`)
      setIsReviewModalOpen(false)
      setActiveTaskToReview(null)
      setReviewFeedback('')
      refreshData()
    }).catch((err: any) => {
      showToast(err.message || 'Failed to approve submission.', 'error')
    })
  }

  // 4. Từ chối Task của Assistant (Reject)
  const handleRejectTask = (task: Task) => {
    if (!task.submissionId) {
      showToast('Không tìm thấy bản nộp để từ chối.', 'error')
      return
    }
    const pinNotes = imagePins
      .filter(p => p.note.trim())
      .map((p, i) => `${i + 1}. (Trang ${p.page + 1}) ${p.note.trim()}`)
      .join(' | ')
    const fullFeedback = [reviewFeedback.trim(), pinNotes ? `[Góp ý trên ảnh] ${pinNotes}` : '']
      .filter(Boolean).join(' — ')
    if (!fullFeedback.trim()) {
      showToast('Vui lòng điền phản hồi hoặc góp ý trên ảnh!', 'error')
      return
    }
    fetchAPI(`/api/page-tasks/submissions/${task.submissionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason: fullFeedback, feedback: fullFeedback })
    }).then(() => {
      showToast(`Đã từ chối và gửi phản hồi yêu cầu sửa đổi!`, 'error')
      setIsReviewModalOpen(false)
      setActiveTaskToReview(null)
      setReviewFeedback('')
      setImagePins([])
      setZipPages([])
      setCurrentPage(0)
      refreshData()
    }).catch((err: any) => {
      showToast(err.message || 'Failed to reject submission.', 'error')
    })
  }

  // --- Action Handlers for Assistant ---

  // 1. Nhận việc / Bắt đầu làm (In-Progress)
  const handleStartTask = (taskId: string) => {
    showToast('Đã chuyển trạng thái sang Đang làm việc (In-Progress)!')
    try {
      const started = JSON.parse(localStorage.getItem('started_tasks') || '[]')
      if (!started.includes(taskId)) {
        started.push(taskId)
        localStorage.setItem('started_tasks', JSON.stringify(started))
      }
    } catch { }
    refreshData()
  }

  // 2. Nộp bài làm (Submit Work)
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTaskToSubmit) return
    if (!submitWorkFile) {
      showToast('Vui lòng chọn file để nộp.', 'error')
      return
    }
    try {
      setSubmitWorkUploading(true)
      const formData = new FormData()
      formData.append('category', 'TaskSubmission')
      formData.append('files', submitWorkFile)
      const uploadRes = await fetchAPI<{ data: { files: { fileAssetId: string }[] } }>('/api/files', {
        method: 'POST',
        body: formData
      })
      const fileAssetId = uploadRes.data.files[0].fileAssetId

      await fetchAPI(`/api/page-tasks/${activeTaskToSubmit.id}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          submittedFileAssetId: fileAssetId,
          note: submitComment || 'Đã hoàn thành công việc, gửi Mangaka duyệt.'
        })
      })
      showToast('Đã nộp kết quả công việc thành công! Chờ Mangaka phê duyệt.')
      setIsSubmitWorkModalOpen(false)
      setActiveTaskToSubmit(null)
      setSubmitWorkUrl('')
      setSubmitComment('')
      setSubmittedFiles([])
      setSubmitWorkFile(null)
      refreshData()
    } catch (err: any) {
      showToast(err.message || 'Failed to submit work.', 'error')
    } finally {
      setSubmitWorkUploading(false)
    }
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

  const getChapterStatusLabel = (status: ChapterStatus) => {
    switch (status) {
      case 'Draft': return 'Bản nháp'
      case 'In Progress': return 'Đang thực hiện'
      case 'Ready for Editor': return 'Chờ Biên tập viên'
      case 'Published': return 'Đã xuất bản'
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

  const getTaskStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'Unassigned': return 'Chưa phân công'
      case 'Pending': return 'Chờ nhận việc'
      case 'In-Progress': return 'Đang thực hiện'
      case 'Submitted': return 'Đã nộp bài'
      case 'Approved': return 'Đã duyệt'
      case 'Rejected': return 'Cần sửa lại'
    }
  }

  // Tính phần trăm tiến độ của chapter hiện tại
 // Task "outdated" = quá hạn mà chưa Approved/Submitted → coi như bỏ, không tính vào tiến độ
  const isOutdatedTask = (t: Task) =>
    !!t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Approved' && t.status !== 'Submitted'
  const countableTasks = chapterTasks.filter(t => !isOutdatedTask(t))
  const salaryByAssistant = getSalaryByAssistant(chapterTasks)
  const totalTasksOfChapter = countableTasks.length
  const approvedTasksOfChapter = countableTasks.filter(t => t.status === 'Approved').length
  const progressPercent = totalTasksOfChapter > 0
    ? Math.round((approvedTasksOfChapter / totalTasksOfChapter) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-bold shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success'
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
                      {s.title}
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
            <button
              type="button"
              onClick={openEditChapter}
              className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-secondary/80 transition-all cursor-pointer"
            >
              <FileEdit className="w-4 h-4" /> Edit Chapter
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
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted/30'
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
                    
                    {selectedChapter.referenceFiles && selectedChapter.referenceFiles.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground">📎 Tài liệu tham khảo</p>
                        {selectedChapter.referenceFiles.map((f: any) => (
                          <a key={f.fileAssetId} href={f.publicUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">
                            📄 {f.originalFileName}
                          </a>
                        ))}
                      </div>
                    )}
                    {/* Progress tracking */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Task progress (Approved by Mangaka)</span>
                        <span className="text-primary font-bold">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic text-right">
                       {approvedTasksOfChapter} of {totalTasksOfChapter} tasks completed and approved
                      </p>
                    </div>

                    {/* Change chapter status logic */}
                    <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
                      <span className="text-xs text-muted-foreground font-semibold">Manage Chapter Status:</span>
                      <div className="flex items-center gap-2">
                        {selectedChapter.status === 'Draft' && (
                          <button
                            onClick={() => {
                              chapterService.updateChapter(selectedChapterId, { status: 'In Progress' }).then(() => {
                                refreshData()
                                showToast('Chapter status updated to In Progress')
                              })
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Set In Progress
                          </button>
                        )}
                      
                       {progressPercent >= 100 && selectedChapter.status !== 'Submitted' && selectedChapter.status !== 'Ready for Editor' && selectedChapter.status !== 'Published' && (
                          <button
                            type="button"
                            onClick={() => setIsSubmitManuscriptOpen(true)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Gửi bản thảo
                          </button>
                        )}
                        {false && selectedChapter?.status === 'Published' && (
                          <button
                            onClick={() => {
                              chapterService.updateChapter(selectedChapterId, { status: 'Published' }).then(() => {
                                refreshData()
                                showToast('Chapter successfully Published!')
                              })
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
                              {task.status !== 'Submitted' && task.status !== 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => openEditTask(task)}
                                  className="inline-flex items-center gap-1.5 border border-border hover:bg-muted text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                  Sửa
                                </button>
                              )}
                              {task.status === 'Submitted' && (
                                <button
                                  onClick={async () => {
                                    setActiveTaskToReview(task)
                                    setIsReviewModalOpen(true)
                                    if (task.submittedFileAssetId) {
                                      try {
                                        const res = await fetchAPI<{ data: { publicUrl?: string } }>(`/api/files/${task.submittedFileAssetId}`)
                                        const url = res?.data?.publicUrl
                                        if (url) setActiveTaskToReview(prev => prev ? { ...prev, submittedWorkUrl: url } : prev)
                                      } catch (e) { /* ignore */ }
                                    }
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

                      {salaryByAssistant.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-bold mb-3 text-foreground">Lương phải trả cho trợ lý</h4>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-muted-foreground border-b border-border">
                                <th className="py-1.5 font-bold">Trợ lý</th>
                                <th className="py-1.5 font-bold text-center">Số task</th>
                                <th className="py-1.5 font-bold text-center">Số trang</th>
                                <th className="py-1.5 font-bold text-right">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salaryByAssistant.map((s) => (
                                <tr key={s.assistantName} className="border-b border-border/50">
                                  <td className="py-1.5 font-semibold">{s.assistantName}</td>
                                  <td className="py-1.5 text-center">{s.taskCount}</td>
                                  <td className="py-1.5 text-center">{s.totalPages}</td>
                                  <td className="py-1.5 text-right font-bold text-green-600">{formatVND(s.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Chọn hồ sơ Trợ lý hoạt động (Kiểm thử)</label>
                <select
                  value={selectedAssistantId}
                  onChange={(e) => setSelectedAssistantId(e.target.value)}
                  className="bg-transparent text-foreground font-bold text-base pr-6 cursor-pointer focus:outline-none mt-0.5"
                >
                  {assistants.map((a) => (
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
                <ClipboardList className="w-4 h-4 text-primary" /> Nhiệm vụ được giao của tôi
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {assistantTasks.length} Nhiệm vụ đang hoạt động
              </span>
            </div>

            <div className="divide-y divide-border">
              {assistantTasks.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <h4 className="font-bold text-foreground">Bạn chưa có nhiệm vụ nào!</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Khi Mangaka phân công cho bạn vẽ nét, đi mực hoặc tô màu theo trang, nhiệm vụ sẽ xuất hiện ở đây.
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
                            {task.type} (Trang {task.pages})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTaskStatusClass(task.status)}`}>
                            {getTaskStatusLabel(task.status)}
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
                          <strong>Phản hồi từ Mangaka:</strong> {task.feedback}
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
                        <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                      </button>

                      {task.status === 'Pending' && (
                        <button
                          onClick={() => handleStartTask(task.id)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" /> Nhận việc & Bắt đầu
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
                          <ImageIcon className="w-3.5 h-3.5" /> Nộp sản phẩm hoàn thành
                        </button>
                      )}

                      {task.status === 'Submitted' && (
                        <span className="text-xs text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl font-bold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Đang chờ Mangaka duyệt
                        </span>
                      )}

                      {task.status === 'Approved' && (
                        <span className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Nhiệm vụ đã hoàn thành & đã duyệt
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
      {(role === 'TantouEditor' || role === 'EditorialBoard') && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Tổng quan Chương & Phát hành (Chế độ giám sát của Editor)
            </h3>
            <p className="text-xs text-muted-foreground">
              Bạn đang đăng nhập với vai trò {role}. Dưới đây là tiến độ hiện tại của các tác phẩm đang phát hành và mốc thời gian của từng chương.
            </p>
            <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
              {allChapters.map(c => {
                const tasksList = allTasks.filter(t => t.chapterId === c.id)
                const appPages = tasksList.filter(t => t.status === 'Approved').length
                const totPages = c.totalPages
                const progress = Math.round((appPages / (tasksList.length || 1)) * 100)

                return (
                  <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">Chương {c.number}: {c.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md ${getChapterStatusClass(c.status)}`}>
                          {getChapterStatusLabel(c.status)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Hạn chót: {c.deadline} | Ngày xuất bản dự kiến: {c.publicationDate}</p>
                    </div>
                    <div className="space-y-1 text-right sm:w-48 shrink-0">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">Nhiệm vụ đã giao:</span>
                        <span className="text-primary">{tasksList.length} Nhiệm vụ ({progress}% hoàn thành)</span>
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
      {/* Edit Chapter Modal */}
      {isEditChapterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-primary" /> Sửa Chapter
              </h3>
              <button
                type="button"
                onClick={() => setIsEditChapterOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Tiêu đề chapter</label>
              <input
                type="text"
                value={editChapterTitle}
                onChange={(e) => setEditChapterTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Nhập tiêu đề mới"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Tổng số trang</label>
              <input
                type="number"
               value={editChapterPages === 0 ? '' : editChapterPages}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setEditChapterPages(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Ngày xuất bản</label>
              <input
                type="date"
                value={editChapterPubDate}
                onChange={(e) => setEditChapterPubDate(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Deadline nộp</label>
              <input
                type="date"
                value={editChapterDeadline}
                onChange={(e) => setEditChapterDeadline(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditChapterOpen(false)}
                className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEditChapter}
                className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
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
                  <PencilLine className="w-3.5 h-3.5" /> Điền Dữ Liệu Mẫu
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
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.seriesId ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
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
                      className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.chapterNo ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
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
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.title ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
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
                    className={`w-full px-3 py-2 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground ${errors.publicationDate ? 'border-red-500 ring-2 ring-red-500/10' : 'border-border focus:border-primary'
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
                        Hạn chót nộp bản thảo hoàn chỉnh cho Editor:{' '}
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
                  <label className="mt-2 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
                    Chọn File (Browse)
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setNewChapterStoryboardFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                    />
                  </label>
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
                <div className={`p-5 border-2 border-dashed rounded-2xl text-center transition-colors ${errors.manuscriptFiles
                    ? 'border-red-500 bg-red-500/5'
                    : 'border-primary/20 hover:border-primary/40 bg-primary/5'
                  }`}>
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${errors.manuscriptFiles ? 'text-red-400' : 'text-primary'} opacity-65`} />
                  <p className="text-xs text-muted-foreground">Kéo thả bản thảo vào đây hoặc</p>
                  <label className="mt-2 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
                    Chọn File (Browse)
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setNewChapterManuscriptFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                    />
                  </label>
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
                <Plus className="w-5 h-5 text-primary" /> Phân công nhiệm vụ vẽ
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Task Type with Suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Loại nhiệm vụ (Task Type)</label>
                <input
                  type="text"
                  placeholder="Nhập loại task (VD: Line Art, Coloring...)"
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground font-semibold"
                />

                {/* Suggestions List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Gợi ý loại task (Click để chọn nhanh):</span>
                  <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto p-1 bg-muted/20 border border-border/50 rounded-xl">
                    {TASK_TYPE_SUGGESTIONS.map((suggestion) => {
                      const isSelected = newTaskType.toLowerCase() === suggestion.name.toLowerCase();
                      return (
                        <button
                          key={suggestion.name}
                          type="button"
                          onClick={() => {
                            setNewTaskType(suggestion.name);
                            const pagesText = `${newTaskPageStart}-${newTaskPageEnd}`;
                            setNewTaskDesc(suggestion.template.replace('{pages}', pagesText));
                          }}
                          className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 cursor-pointer ${isSelected
                              ? 'bg-primary/10 border-primary text-foreground'
                              : 'bg-muted/40 border-border/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{suggestion.name}</span>
                            {isSelected && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded font-bold">Đang chọn</span>}
                          </div>
                          <span className="text-[10px] opacity-80 leading-relaxed">{suggestion.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pages Range: Start & End */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Trang bắt đầu</label>
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
                  <label className="text-xs font-bold text-muted-foreground">Trang kết thúc</label>
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
                    <CalendarDays className="w-3.5 h-3.5 text-primary" /> Hạn nộp (Due Date)
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Chọn Trợ lý</label>
                  <select
                    value={newTaskAssistantId}
                    onChange={(e) => setNewTaskAssistantId(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                  >
                    <option value="Unassigned">Để trống (Chưa phân công)</option>
                    {assistants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.specialty}) — Số task đang làm: {a.activeTasks}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instructions / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Mô tả & Hướng dẫn chi tiết</label>
                <textarea
                  placeholder="Mô tả chi tiết: Vẽ nền chùa cổ, hướng ánh sáng từ bên phải, biểu cảm nhân vật lo lắng..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                  required
                />
              </div>

              {/* Attach Reference Files input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-primary" /> Tài liệu đính kèm (Reference Files)
                </label>
                <div className="p-3 border-2 border-dashed border-primary/20 hover:border-primary/45 bg-primary/5 rounded-xl text-center transition-colors">
                  <p className="text-xs text-muted-foreground">Đính kèm các file tài liệu hướng dẫn vẽ</p>
                  <label className="mt-1.5 inline-flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Chọn File
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setNewTaskAttachments(prev => [...prev, ...Array.from(e.target.files || [])])}
                    />
                  </label>
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
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Giao nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. Review Assistant Submission Modal (Mangaka) */}
      {isEditTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsEditTaskOpen(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Sửa Task</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Trang bắt đầu</label>
               <input type="number" value={editTaskPageStart === 0 ? '' : editTaskPageStart} onFocus={(e) => e.target.select()} onChange={(e) => setEditTaskPageStart(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Trang kết thúc</label>
               <input type="number" value={editTaskPageEnd === 0 ? '' : editTaskPageEnd} onFocus={(e) => e.target.select()} onChange={(e) => setEditTaskPageEnd(e.target.value === '' ? 0 : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Mô tả</label>
              <textarea value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Hạn nộp</label>
              <input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Giao cho (đổi trợ lý)</label>
              <select
                value={editTaskAssistantId}
                onChange={(e) => setEditTaskAssistantId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
              >
                <option value="">-- Chọn trợ lý --</option>
                {assistants.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">Đổi trợ lý để giao lại nhiệm vụ này cho người khác.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsEditTaskOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted">Hủy</button>
              <button type="button" onClick={handleSaveEditTask} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Lưu</button>
            </div>
          </div>
        </div>
      )}
      {pinOverlayOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col" onClick={() => setPinOverlayOpen(false)}>
          <div className="flex items-center justify-between p-3 text-white shrink-0">
            <span className="text-sm font-bold">
              Bấm lên ảnh để ghim góp ý
              {zipPages.length > 1 && ` — Trang ${currentPage + 1}/${zipPages.length}`}
              {` — ${imagePins.filter(p => p.page === currentPage).length} điểm`}
            </span>
            <button onClick={() => setPinOverlayOpen(false)} className="text-white text-xl px-3">✕</button>
          </div>

          {zipPages.length > 1 && (
            <div className="flex items-center justify-center gap-3 pb-2 text-white shrink-0" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-1 bg-white/20 rounded-lg disabled:opacity-30">‹ Trước</button>
              <span className="text-sm">Trang {currentPage + 1}/{zipPages.length}</span>
              <button onClick={() => setCurrentPage(p => Math.min(zipPages.length - 1, p + 1))} disabled={currentPage === zipPages.length - 1} className="px-3 py-1 bg-white/20 rounded-lg disabled:opacity-30">Sau ›</button>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div
              className="flex-1 relative flex items-center justify-center overflow-auto cursor-crosshair"
              onClick={(e) => {
                const img = (e.currentTarget.querySelector('img') as HTMLImageElement)
                if (!img) return
                const rect = img.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                if (x < 0 || x > 100 || y < 0 || y > 100) return
                setImagePins(prev => [...prev, { x, y, note: '', page: currentPage }])
              }}
            >
              {zipLoading ? (
                <p className="text-white text-sm">Đang giải nén zip...</p>
              ) : zipPages[currentPage] ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={zipPages[currentPage].dataUrl} alt="bai nop" className="max-h-[80vh] max-w-full object-contain pointer-events-none" />
                  {imagePins.map((pin, idx) => pin.page === currentPage && (
                    <div key={idx} className="absolute w-7 h-7 -ml-3.5 -mt-3.5 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
                      {idx + 1}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white text-sm">Không có ảnh để hiển thị.</p>
              )}
            </div>

            <div className="w-80 bg-background p-4 overflow-y-auto shrink-0 space-y-2">
              <h3 className="text-sm font-extrabold mb-2">Góp ý ({imagePins.length})</h3>
              {imagePins.length === 0 && <p className="text-xs text-muted-foreground">Bấm lên ảnh để thêm điểm góp ý.</p>}
              {imagePins.map((pin, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-1">{idx + 1}</span>
                  <div className="flex-1">
                    {zipPages.length > 1 && <span className="text-[10px] text-muted-foreground">Trang {pin.page + 1}</span>}
                    <textarea
                      value={pin.note}
                      onChange={(e) => setImagePins(prev => prev.map((p, i) => i === idx ? { ...p, note: e.target.value } : p))}
                      placeholder="Góp ý cho điểm này..."
                      className="w-full text-xs px-2 py-1.5 border border-border rounded-lg bg-background resize-none"
                      rows={2}
                    />
                  </div>
                  <button onClick={() => setImagePins(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-500 shrink-0 mt-1">✕</button>
                </div>
              ))}
              <button onClick={() => setPinOverlayOpen(false)} className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">Xong</button>
            </div>
          </div>
        </div>
      )}
      {isSubmitManuscriptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsSubmitManuscriptOpen(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Gửi bản thảo (Manuscript)</h3>
            <p className="text-xs text-muted-foreground">Mỗi lần gửi sẽ tạo một version mới.</p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">File bản thảo</label>
             <label className="flex items-center gap-3 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm cursor-pointer hover:bg-muted transition-colors">
                <span className="shrink-0 px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">Chọn file</span>
                <span className="text-muted-foreground truncate">
                  {submitManuscriptFile ? submitManuscriptFile.name : 'Chưa chọn tệp nào'}
                </span>
                <input
                  type="file"
                  onChange={(e) => setSubmitManuscriptFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Ghi chú</label>
              <textarea value={submitManuscriptNotes} onChange={(e) => setSubmitManuscriptNotes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsSubmitManuscriptOpen(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-muted">Hủy</button>
              <button type="button" disabled={submitManuscriptUploading} onClick={handleSubmitManuscript} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                {submitManuscriptUploading ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isReviewModalOpen && activeTaskToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" /> Duyệt bài làm của Trợ lý
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
                <label className="text-xs font-bold text-muted-foreground">Xem trước sản phẩm đã nộp</label>
               <div
                  className="relative border border-border rounded-xl overflow-hidden bg-muted min-h-[400px] max-h-[600px] flex items-center justify-center group shadow-inner cursor-crosshair"
                  onClick={() => { if (activeTaskToReview.submittedWorkUrl) openPinOverlay() }}
                >
                  {!activeTaskToReview.submittedWorkUrl ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                      <ImageIcon className="w-12 h-12" />
                      <span className="text-xs">Chưa có bài nộp</span>
                    </div>
                  ) : /\.zip(\?|$)/i.test(activeTaskToReview.submittedWorkUrl) ? (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground pointer-events-none">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl">📦</div>
                      <span className="text-sm font-bold text-foreground">File nén nhiều trang</span>
                      <span className="text-xs">Bấm vào đây để xem & góp ý từng trang</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeTaskToReview.submittedWorkUrl}
                      alt="Bài nộp"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  )}
                  {imagePins.map((pin, idx) => (
                    <div
                      key={idx}
                      className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>

            {activeTaskToReview.submittedWorkUrl && (
                  <button
                    onClick={openPinOverlay}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                  >
                    Mở to để góp ý chi tiết
                  </button>
                )}

                {imagePins.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">Góp ý trên ảnh ({imagePins.length})</label>
                    {imagePins.map((pin, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                        <input
                          value={pin.note}
                          onChange={(e) => setImagePins(prev => prev.map((p, i) => i === idx ? { ...p, note: e.target.value } : p))}
                          placeholder="Nhập góp ý cho điểm này..."
                          className="flex-1 text-xs px-2 py-1.5 border border-border rounded-lg bg-background"
                        />
                        <button onClick={() => setImagePins(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-500 shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {activeTaskToReview.prevSubmittedWorkUrl && (
                  <div className="space-y-2">
                   <button
                      onClick={handleCompareSubmissions}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      So sánh với lần nộp trước
                    </button>
                    {subCompareLoading && (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                        <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        Đang so sánh ảnh...
                      </div>
                    )}
                    {subCompareError && (
                      <div className="text-xs text-red-600 bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                        {subCompareError}
                      </div>
                    )}
                    {subCompareResult && (
                      <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">Mức thay đổi so với lần trước</span>
                          <span className={`text-sm font-extrabold ${subCompareResult.percent > 20 ? 'text-red-600' : subCompareResult.percent > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {subCompareResult.percent}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${subCompareResult.percent > 20 ? 'bg-red-500' : subCompareResult.percent > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(subCompareResult.percent, 100)}%` }}
                          />
                        </div>
                        {subCompareResult.diff && (
                          <div className="space-y-1">
                            <img src={subCompareResult.diff} alt="Vùng thay đổi" className="w-full border border-border rounded-lg" />
                            <p className="text-[10px] text-muted-foreground text-center">🔴 Vùng màu đỏ là chỗ có thay đổi so với lần nộp trước</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submitted Files List */}

                {/* Submitted Files List */}
                {activeTaskToReview.submittedFiles && activeTaskToReview.submittedFiles.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Tệp đã nộp ({activeTaskToReview.submittedFiles.length})</label>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {activeTaskToReview.submittedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
                          <span className="font-medium text-emerald-800 dark:text-emerald-400 truncate max-w-[200px]">🖼️ {file.name}</span>
                          <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded shrink-0">{file.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeTaskToReview.submittedWorkUrl ? (
                  <a href={activeTaskToReview.submittedWorkUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline bg-muted/40 p-2.5 rounded-xl border border-border">
                    📎 Mở file bài nộp trong tab mới
                  </a>
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
                      {activeTaskToReview.type} (Trang {activeTaskToReview.pages})
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground leading-snug">
                    {activeTaskToReview.description}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Người nộp: <strong>{activeTaskToReview.assistantName}</strong>
                  </p>

                  <div className="p-3 bg-muted/50 rounded-xl text-xs leading-relaxed text-foreground border border-border">
                    <p className="font-bold text-muted-foreground mb-1 text-[10px] uppercase">Ghi chú của Trợ lý:</p>
                    <p className="italic whitespace-pre-line">{activeTaskToReview.submitDescription || 'Đã hoàn thành công việc, gửi Mangaka duyệt.'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">Ý kiến phản hồi (Bắt buộc nếu Từ chối)</label>
                  <textarea
                    placeholder="Nhập phản hồi... Các điểm tốt cần giữ, chi tiết cụ thể cần chỉnh sửa..."
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
                    Yêu cầu sửa lại
                  </button>
                  <button
                    onClick={() => handleApproveTask(activeTaskToReview)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center shadow-sm"
                  >
                    Phê duyệt & Hoàn thành
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
                <ImageIcon className="w-5 h-5 text-primary" /> Nộp sản phẩm vẽ
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
                <p className="font-bold text-foreground">Nhiệm vụ: {activeTaskToSubmit.type} (Trang {activeTaskToSubmit.pages})</p>
                <p className="text-muted-foreground mt-0.5">{activeTaskToSubmit.description}</p>
              </div>

              {/* Upload area for submittedFiles */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-primary" /> Tải lên tệp bản vẽ (Upload Work Files)
                </label>
                <div className="p-3 border-2 border-dashed border-primary/20 hover:border-primary/45 bg-primary/5 rounded-xl text-center transition-colors">
                  <p className="text-xs text-muted-foreground">Kéo thả file vẽ hoặc click để chọn</p>
                  <button
                    type="button"
                    onClick={handleAssistantMockUpload}
                    className="mt-1.5 inline-flex items-center justify-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Đính kèm tệp bản vẽ
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
                <label className="text-xs font-bold text-muted-foreground">File bài nộp</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSubmitWorkFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Ghi chú & mô tả gửi cho Mangaka</label>
                <textarea
                  placeholder="Mô tả nội dung chỉnh sửa của bạn: VD: Hoàn thành line art trang 1-3, tô bóng trang 4, chỉnh lại đổ bóng nhân vật..."
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
                  Hủy
                </button>
                <button
                 type="submit"
                  disabled={submitWorkUploading}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitWorkUploading ? 'Đang nộp...' : 'Nộp sản phẩm'}
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
                <Info className="w-5 h-5 text-primary" /> Thông tin chi tiết Nhiệm vụ
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
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bộ Manga</p>
                <p className="font-bold text-foreground text-base">{getMangaTitleForTask(activeTaskToView)}</p>
                <p className="text-xs text-muted-foreground font-semibold">{getChapterInfoForTask(activeTaskToView)}</p>
              </div>

              {/* Task Grid Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Loại nhiệm vụ</p>
                  <p className="font-semibold text-foreground bg-primary/5 border border-primary/10 px-2.5 py-1.5 rounded-lg inline-block">
                    {activeTaskToView.type}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Phạm vi trang</p>
                  <p className="font-semibold text-foreground bg-muted px-2.5 py-1.5 rounded-lg inline-block">
                    Trang {activeTaskToView.pages}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Hạn nộp (Due Date)</p>
                  <p className="font-semibold text-amber-600 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1.5 rounded-lg inline-block">
                    {activeTaskToView.dueDate || 'Không giới hạn'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground">Trạng thái phân công</p>
                  <p className={`font-semibold px-2.5 py-1.5 rounded-lg inline-block text-xs ${getTaskStatusClass(activeTaskToView.status)}`}>
                    {getTaskStatusLabel(activeTaskToView.status)}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Mô tả & Hướng dẫn chi tiết</p>
                <div className="p-3 bg-muted/30 border border-border rounded-xl text-foreground whitespace-pre-line text-xs leading-relaxed">
                  {activeTaskToView.description}
                </div>
              </div>

              {/* Reference Files from Mangaka */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">Tài liệu hướng dẫn đính kèm</p>
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
                  <p className="text-xs font-bold text-muted-foreground">Ghi chú sản phẩm nộp của Trợ lý</p>
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-foreground text-xs leading-relaxed">
                    {activeTaskToView.submitDescription}
                  </div>
                </div>
              )}

              {activeTaskToView.submittedFiles && activeTaskToView.submittedFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-muted-foreground">Tệp sản phẩm đã nộp</p>
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
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
