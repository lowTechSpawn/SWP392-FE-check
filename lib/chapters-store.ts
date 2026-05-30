/**
 * Client-side chapters and tasks store backed by localStorage.
 * Powers the Mangaka Chapter Creation, Assistant Task Assignment, and Approval workflow.
 */

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
}

const STORAGE_CHAPTERS_KEY = 'mangaflow_chapters'
const STORAGE_TASKS_KEY = 'mangaflow_tasks'

// Pre-seeded assistants list
export const SEED_ASSISTANTS: Assistant[] = [
  { id: 'A01', name: 'Sato Takashi', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', specialty: 'Background Art & Line Art', activeTasks: 1 },
  { id: 'A02', name: 'Suzuki Mei', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', specialty: 'Coloring & Lighting Effects', activeTasks: 1 },
  { id: 'A03', name: 'Watanabe Ren', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', specialty: 'Screentoning & Clean-up', activeTasks: 0 },
]

// Pre-seeded active series for Tanaka Yuki (U01) and Oda Kenji (U02)
const SEED_SERIES: Series[] = [
  { id: 'S01', title: 'Sakura Knights', mangakaId: 'U01', coverColor: 'from-pink-500 to-purple-600', status: 'Active' },
  { id: 'S02', title: 'Whispers of the Deep', mangakaId: 'U02', coverColor: 'from-sky-400 to-indigo-600', status: 'Active' }
]

const SEED_CHAPTERS: Chapter[] = [
  {
    id: 'CH01',
    seriesId: 'S01',
    number: 1,
    title: 'The Resonance of Blades',
    status: 'Published',
    totalPages: 10,
    publicationDate: '2026-05-15',
    deadline: '2026-05-01',
    createdAt: '2026-04-20T10:00:00.000Z',
  },
  {
    id: 'CH02',
    seriesId: 'S01',
    number: 2,
    title: 'Cherry Blossom Magitech',
    status: 'In Progress',
    totalPages: 12,
    publicationDate: '2026-06-15',
    deadline: '2026-06-01',
    createdAt: '2026-05-15T09:00:00.000Z',
  }
]

const SEED_TASKS: Task[] = [
  {
    id: 'T01',
    chapterId: 'CH02',
    type: 'Line Art',
    pages: '1-3',
    description: 'Sketch and ink the opening battle sequence in the Sakura Dojo.',
    assistantId: 'A01',
    assistantName: 'Sato Takashi',
    status: 'Approved',
    submittedWorkUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
    feedback: 'Amazing job on the dynamic lines! Ready for coloring.',
    assignedAt: '2026-05-16T10:00:00.000Z',
    updatedAt: '2026-05-18T14:30:00.000Z'
  },
  {
    id: 'T02',
    chapterId: 'CH02',
    type: 'Coloring',
    pages: '4-8',
    description: 'Apply pastel sakura tones and sunset glow for the romance scene.',
    assistantId: 'A02',
    assistantName: 'Suzuki Mei',
    status: 'Submitted',
    submittedWorkUrl: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=800',
    assignedAt: '2026-05-16T10:15:00.000Z',
    updatedAt: '2026-05-29T16:00:00.000Z'
  },
  {
    id: 'T03',
    chapterId: 'CH02',
    type: 'Background Art',
    pages: '9-12',
    description: 'Draw the detailed pagoda ruins and distant mountain range.',
    assistantId: 'A03',
    assistantName: 'Watanabe Ren',
    status: 'In-Progress',
    assignedAt: '2026-05-16T10:20:00.000Z',
    updatedAt: '2026-05-16T10:20:00.000Z'
  }
]

// ---------- Storage Helpers ----------
function loadChapters(): Chapter[] {
  if (typeof window === 'undefined') return SEED_CHAPTERS
  try {
    const raw = localStorage.getItem(STORAGE_CHAPTERS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_CHAPTERS_KEY, JSON.stringify(SEED_CHAPTERS))
      return SEED_CHAPTERS
    }
    return JSON.parse(raw) as Chapter[]
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
    return JSON.parse(raw) as Task[]
  } catch {
    return SEED_TASKS
  }
}

function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks))
}

// ---------- Public Store API ----------

export function getSeries(): Series[] {
  return SEED_SERIES
}

export function getSeriesByMangaka(mangakaId: string): Series[] {
  return SEED_SERIES.filter(s => s.mangakaId === mangakaId)
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

  // Update assistant active task count
  if (data.assistantId !== 'Unassigned') {
    updateAssistantTaskCount(data.assistantId, 1)
  }

  return newTask
}

export function updateTaskStatus(
  taskId: string, 
  status: TaskStatus, 
  feedback?: string, 
  submittedWorkUrl?: string
): boolean {
  const tasks = loadTasks()
  const idx = tasks.findIndex(t => t.id === taskId)
  if (idx === -1) return false
  
  const oldTask = tasks[idx]
  const oldStatus = oldTask.status

  tasks[idx] = {
    ...oldTask,
    status,
    feedback: feedback !== undefined ? feedback : oldTask.feedback,
    submittedWorkUrl: submittedWorkUrl !== undefined ? submittedWorkUrl : oldTask.submittedWorkUrl,
    updatedAt: new Date().toISOString()
  }
  
  saveTasks(tasks)

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
  return SEED_ASSISTANTS.map(assistant => {
    const activeTasks = tasks.filter(
      t => t.assistantId === assistant.id && 
      (t.status === 'Pending' || t.status === 'In-Progress' || t.status === 'Submitted' || t.status === 'Rejected')
    ).length
    return {
      ...assistant,
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
