/**
 * Client-side chapters and tasks store backed by localStorage.
 * Powers the Mangaka Chapter Creation, Assistant Task Assignment, and Approval workflow.
 */

import { fetchAPI } from '@/services/api'

export type ChapterStatus = 'Draft' | 'In Progress' | 'Ready for Editor' | 'Published'

export type TaskStatus = 'Unassigned' | 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected'

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
  status?: string // Added to support BR-40 validation
}

export interface Task {
  id: string
  chapterId: string
  type: string // e.g. "Line Art", "Coloring", "Backgrounds", "Toning"
  pages: string // e.g. "1-3", "4-7", "8"
  description: string
  assistantId: string // "Unassigned" if not assigned yet
  assistantName: string
  status: TaskStatus
  submittedWorkUrl?: string // Mock image url submitted by assistant
  feedback?: string // Feedback comments from Mangaka
  assignedAt?: string
  updatedAt?: string
  dueDate?: string // Ngày hạn chót nộp task để Mangaka theo dõi tiến độ
  pageStart?: number // Số trang bắt đầu vẽ
  pageEnd?: number // Số trang kết thúc vẽ
  attachments?: { name: string; size: string; type: string }[] // Tài liệu hướng dẫn đính kèm từ Mangaka
  submittedFiles?: { name: string; size: string; type: string }[] // Các file hình ảnh/sản phẩm Assistant đã nộp
  submitDescription?: string // Lời nhắn hoặc mô tả chỉnh sửa từ Assistant khi nộp bài
  submissionId?: string // to support backend approve/reject calls
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

const STORAGE_CHAPTERS_KEY = 'mangaflow_chapters'
const STORAGE_TASKS_KEY = 'mangaflow_tasks'

export const SEED_ASSISTANTS: Assistant[] = []

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

const SEED_SERIES: Series[] = []
const SEED_CHAPTERS: Chapter[] = []
const SEED_TASKS: Task[] = []

// ---------- Storage Helpers ----------
function loadChapters(): Chapter[] {
  if (typeof window === 'undefined') return SEED_CHAPTERS
  try {
    const raw = localStorage.getItem(STORAGE_CHAPTERS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_CHAPTERS_KEY, JSON.stringify(SEED_CHAPTERS))
      return SEED_CHAPTERS
    }
    const parsed = JSON.parse(raw) as Chapter[]
    // Filter out mock chapters based on seriesId length
    return parsed.filter(c => c.seriesId.length > 3)
  } catch {
    return SEED_CHAPTERS
  }
}

function saveChapters(chapters: Chapter[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_CHAPTERS_KEY, JSON.stringify(chapters))
}

function loadTasks(): Task[] {
  if (typeof window === 'undefined') return SEED_TASKS
  try {
    const raw = localStorage.getItem(STORAGE_TASKS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(SEED_TASKS))
      return SEED_TASKS
    }
    const parsed = JSON.parse(raw) as Task[]
    // Filter out mock tasks based on assistantId length or assignment state
    return parsed.filter(t => t.assistantId.length > 3 || t.assistantId === 'Unassigned')
  } catch {
    return SEED_TASKS
  }
}

function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks))
}

// ---------- Public Store API ----------

// Dynamically load approved proposals as active series to sync dashboard flows
function loadSeries(): Series[] {
  const list = [...SEED_SERIES]
  if (typeof window === 'undefined') return list
  try {
    const rawProposals = localStorage.getItem('mangaflow_proposals')
    if (rawProposals) {
      const proposals = JSON.parse(rawProposals)
      proposals.forEach((p: any) => {
        if (p.status === 'Approved') {
          const exists = list.some(s => s.id === p.id || s.title.toLowerCase() === p.title.toLowerCase())
          if (!exists) {
            list.push({
              id: p.id,
              title: p.title,
              mangakaId: p.mangakaId,
              coverColor: 'from-emerald-400 to-teal-500',
              status: 'Active'
            })
          }
        }
      })
    }
  } catch (e) {
    console.error("Failed to load proposals dynamically in chapters-store", e)
  }
  return list
}

export function getSeries(): Series[] {
  return loadSeries()
}

export function getSeriesByMangaka(mangakaId: string): Series[] {
  return loadSeries().filter(s => s.mangakaId === mangakaId)
}

export function getChapters(seriesId?: string): Chapter[] {
  const all = loadChapters()
  if (seriesId) {
    return all.filter(c => c.seriesId === seriesId)
  }
  return all
}

export function getChapterById(id: string): Chapter | undefined {
  return loadChapters().find(c => c.id === id)
}

export function createChapter(data: Omit<Chapter, 'id' | 'createdAt'>): Chapter {
  const chapters = loadChapters()
  
  // Enforce sequential numbering unless manually set to a valid positive number
  const existingInSeries = chapters.filter(c => c.seriesId === data.seriesId)
  const finalNumber = data.number > 0 ? data.number : (
    existingInSeries.length > 0
      ? Math.max(...existingInSeries.map(c => c.number)) + 1
      : 1
  )

  const newChapter: Chapter = {
    ...data,
    id: `CH${String(chapters.length + 1).padStart(2, '0')}`,
    number: finalNumber,
    createdAt: new Date().toISOString()
  }

  chapters.push(newChapter)
  saveChapters(chapters)
  return newChapter
}

export function updateChapterStatus(id: string, status: ChapterStatus): boolean {
  const chapters = loadChapters()
  const idx = chapters.findIndex(c => c.id === id)
  if (idx === -1) return false
  chapters[idx].status = status
  saveChapters(chapters)
  return true
}

export function getTasks(chapterId?: string): Task[] {
  const all = loadTasks()
  if (chapterId) {
    return all.filter(t => t.chapterId === chapterId)
  }
  return all
}

export function getTaskById(id: string): Task | undefined {
  return loadTasks().find(t => t.id === id)
}

export function getTasksByAssistant(assistantId: string): Task[] {
  return loadTasks().filter(t => t.assistantId === assistantId)
}

export function createTask(data: Omit<Task, 'id' | 'status' | 'assistantName'>): Task {
  const tasks = loadTasks()
  const assistants = getAssistants()
  const assistant = assistants.find(a => a.id === data.assistantId)
  const assistantName = assistant ? assistant.name : 'Unassigned'
  
  const newTask: Task = {
    ...data,
    id: `T${String(tasks.length + 1).padStart(2, '0')}`,
    assistantName,
    status: data.assistantId === 'Unassigned' ? 'Unassigned' : 'Pending',
    assignedAt: data.assistantId === 'Unassigned' ? undefined : new Date().toISOString()
  }

  tasks.push(newTask)
  saveTasks(tasks)

  // Background API call to backend
  if (typeof window !== 'undefined') {
    const defaultManuscriptId = '77777777-7777-7777-7777-777777777777' // Seeded manuscript ID
    
    const payload = {
      chapterId: data.chapterId,
      manuscriptId: defaultManuscriptId,
      assistantId: data.assistantId === 'Unassigned' ? '00000000-0000-0000-0000-000000000000' : data.assistantId,
      pageStart: data.pageStart || 1,
      pageEnd: data.pageEnd || 3,
      taskType: data.type,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
    }

    fetchAPI<{ data: any }>('/api/page-tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then((res: any) => {
      if (res && res.data) {
        const currentTasks = loadTasks()
        const foundIdx = currentTasks.findIndex(t => t.id === newTask.id)
        if (foundIdx !== -1) {
          currentTasks[foundIdx].id = res.data.pageTaskId || res.data.id
          saveTasks(currentTasks)
        }
      }
    }).catch(err => {
      console.warn("Failed to create task on backend:", err)
    })
  }

  // Update assistant active task count
  if (data.assistantId !== 'Unassigned') {
    updateAssistantTaskCount(data.assistantId, 1)
  }

  return newTask
}

/**
 * Cập nhật trạng thái và các dữ liệu liên quan của một Task.
 * Hàm này hỗ trợ cả luồng của Mangaka (phê duyệt/từ chối, ghi feedback)
 * và luồng của Assistant (nộp bài, gửi danh sách file và lời nhắn mô tả).
 */
export function updateTaskStatus(
  taskId: string, 
  status: TaskStatus, 
  feedback?: string, 
  submittedWorkUrl?: string,
  submitDescription?: string,
  submittedFiles?: { name: string; size: string; type: string }[]
): boolean {
  const tasks = loadTasks()
  const idx = tasks.findIndex(t => t.id === taskId)
  if (idx === -1) return false
  
  const oldTask = tasks[idx]
  const oldStatus = oldTask.status

  // Tạo đối tượng Task mới kế thừa dữ liệu cũ và ghi đè bằng các thuộc tính mới nhận được
  tasks[idx] = {
    ...oldTask,
    status,
    feedback: feedback !== undefined ? feedback : oldTask.feedback,
    submittedWorkUrl: submittedWorkUrl !== undefined ? submittedWorkUrl : oldTask.submittedWorkUrl,
    submitDescription: submitDescription !== undefined ? submitDescription : oldTask.submitDescription,
    submittedFiles: submittedFiles !== undefined ? submittedFiles : oldTask.submittedFiles,
    updatedAt: new Date().toISOString()
  }
  
  saveTasks(tasks)

  // Background API calls to backend
  if (typeof window !== 'undefined') {
    // 1. Assistant submits task work
    if (status === 'Submitted' && oldStatus !== 'Submitted') {
      const payload = {
        pageTaskId: taskId,
        versionNo: 1,
        submittedFileAssetId: '88888888-8888-8888-8888-888888888888', // Default file asset ID
        note: submitDescription || 'Nộp trang vẽ'
      }
      fetchAPI<any>('/api/submissions', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then(res => {
        const data = res.data || res;
        if (data) {
          const currentTasks = loadTasks()
          const foundIdx = currentTasks.findIndex(t => t.id === taskId)
          if (foundIdx !== -1) {
            currentTasks[foundIdx].submissionId = data.submissionId || data.id
            saveTasks(currentTasks)
          }
        }
      }).catch(err => {
        console.warn("Failed to submit task work to backend:", err)
      })
    }
    // 2. Mangaka approves drawing task submission
    else if (status === 'Approved' && oldTask.submissionId) {
      const payload = {
        status: 'Approved'
      }
      fetchAPI<any>(`/api/submissions/${oldTask.submissionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => {
        console.log("Approved submission on backend successfully", res)
      }).catch(err => {
        console.warn("Failed to approve submission on backend:", err)
      })
    }
    // 3. Mangaka rejects drawing task submission
    else if (status === 'Rejected' && oldTask.submissionId) {
      const payload = {
        status: 'Rejected',
        rejectReason: feedback || 'Cần vẽ lại chi tiết hơn.'
      }
      fetchAPI<any>(`/api/submissions/${oldTask.submissionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then(res => {
        console.log("Rejected submission on backend successfully", res)
      }).catch(err => {
        console.warn("Failed to reject submission on backend:", err)
      })
    }
  }

  // Manage assistant active task counts
  if (oldTask.assistantId !== 'Unassigned') {
    // If completed/approved, decrease task count
    if (status === 'Approved' && oldStatus !== 'Approved') {
      updateAssistantTaskCount(oldTask.assistantId, -1)
    } 
    // If returned to working state from approved, increase it (safety)
    else if (oldStatus === 'Approved' && status !== 'Approved') {
      updateAssistantTaskCount(oldTask.assistantId, 1)
    }
  }

  return true
}

export function assignTask(taskId: string, assistantId: string): boolean {
  const tasks = loadTasks()
  const idx = tasks.findIndex(t => t.id === taskId)
  if (idx === -1) return false
  
  const task = tasks[idx]
  const oldAssistantId = task.assistantId

  if (oldAssistantId === assistantId) return true

  const assistants = getAssistants()
  const newAssistant = assistants.find(a => a.id === assistantId)
  const assistantName = newAssistant ? newAssistant.name : 'Unassigned'

  tasks[idx] = {
    ...task,
    assistantId,
    assistantName,
    status: assistantId === 'Unassigned' ? 'Unassigned' : 'Pending',
    assignedAt: assistantId === 'Unassigned' ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  saveTasks(tasks)

  // Adjust active task counts
  if (oldAssistantId !== 'Unassigned') {
    updateAssistantTaskCount(oldAssistantId, -1)
  }
  if (assistantId !== 'Unassigned') {
    updateAssistantTaskCount(assistantId, 1)
  }

  return true
}

export function getAssistants(): Assistant[] {
  // We can load active task counts dynamically by looking at loadTasks()
  const tasks = loadTasks()
  const users: any[] = []
  return users.map(u => {
    const activeTasks = tasks.filter(
      t => t.assistantId === u.id && 
      (t.status === 'Pending' || t.status === 'In-Progress' || t.status === 'Submitted' || t.status === 'Rejected')
    ).length
    return {
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      specialty: 'Assistant',
      activeTasks
    }
  })
}

export function getAssistantById(id: string): Assistant | undefined {
  return getAssistants().find(a => a.id === id)
}

function updateAssistantTaskCount(assistantId: string, diff: number) {
  // Seed assistants is memory-only, but we dynamically recalculate activeTasks inside getAssistants()
  // based on active tasks in the tasks store, so no write needed.
}

// ---------- Async Backend Synchronizers ----------

export async function syncTasksFromBackend(chapterId?: string): Promise<Task[]> {
  try {
    const role = typeof window !== 'undefined' ? localStorage.getItem('user-role') : null
    let endpoint = '/api/page-tasks/mangaka'
    if (role === 'Assistant') {
      endpoint = '/api/page-tasks/assistant'
    }
    const response = await fetchAPI<{ data: any[] }>(endpoint)
    if (response && response.data) {
      const backendTasks: Task[] = response.data.map(t => {
        const assistants = getAssistants()
        const assistant = assistants.find(a => a.id === t.assistantId || a.name === t.assistantName)
        const assistantName = t.assistantName || (assistant ? assistant.name : 'Unassigned')
        
        return {
          id: t.pageTaskId || t.id,
          chapterId: t.chapterId,
          type: t.taskType,
          pages: `${t.pageStart}-${t.pageEnd}`,
          description: t.description || '',
          assistantId: t.assistantId || 'Unassigned',
          assistantName,
          status: t.status as TaskStatus,
          dueDate: t.dueDate || undefined,
          pageStart: t.pageStart,
          pageEnd: t.pageEnd,
          submittedWorkUrl: t.submissions && t.submissions.length > 0 
            ? t.submissions[0].submittedFileAssetUrl || 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=800' 
            : undefined,
          submitDescription: t.submissions && t.submissions.length > 0 ? t.submissions[0].note : undefined,
          submissionId: t.submissions && t.submissions.length > 0 ? t.submissions[0].submissionId : undefined,
        }
      })

      const localTasks = loadTasks()
      const merged = [...localTasks]
      backendTasks.forEach(bt => {
        const idx = merged.findIndex(lt => lt.id === bt.id)
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...bt }
        } else {
          merged.push(bt)
        }
      })
      saveTasks(merged)
      return chapterId ? merged.filter(t => t.chapterId === chapterId) : merged
    }
  } catch (error) {
    console.warn("syncTasksFromBackend failed, using offline data:", error)
  }
  return getTasks(chapterId)
}
