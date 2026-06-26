'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  Clock,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  User,
  Calendar,
  Layers,
  FileImage,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import {
  type Task,
  type TaskStatus,
  type Assistant
} from '@/lib/chapters-store'
import { fetchAPI } from '@/services/api'
import { API_BASE_URL } from '@/lib/constants'
import { userService } from '@/services/userService'
import { chapterService, type Chapter } from '@/services/chapterService'
import { seriesService } from '@/services/seriesService'
import { toast } from 'sonner'

export default function AssistantDashboardPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)

  // Simulation states
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [allChapters, setAllChapters] = useState<Chapter[]>([])
  const [allSeries, setAllSeries] = useState<any[]>([])

  // Submit modal states
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [activeTaskToSubmit, setActiveTaskToSubmit] = useState<Task | null>(null)
  const [submitDescription, setSubmitDescription] = useState('')
  const [submitUrl, setSubmitUrl] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: string }[]>([])

  // Task Detail Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [activeTaskToView, setActiveTaskToView] = useState<Task | null>(null)

  const getSubmissionStatus = (submission: any) => String(submission?.status).trim().toUpperCase()

  const getLatestSubmission = (submissions?: any[]) => {
    if (!Array.isArray(submissions) || submissions.length === 0) return null

    const sorted = [...submissions].sort((a, b) => {
      const bVersion = Number(b?.versionNo ?? b?.VersionNo ?? 0)
      const aVersion = Number(a?.versionNo ?? a?.VersionNo ?? 0)
      if (bVersion !== aVersion) return bVersion - aVersion

      const bSubmittedAt = new Date(b?.submittedAt ?? b?.SubmittedAt ?? 0).getTime()
      const aSubmittedAt = new Date(a?.submittedAt ?? a?.SubmittedAt ?? 0).getTime()
      return bSubmittedAt - aSubmittedAt
    })

    return sorted.find(s => {
      const status = getSubmissionStatus(s)
      return status === '0' || status === 'SUBMITTED'
    }) || sorted[0]
  }

  const getSubmissionFileUrl = (submission: any) => {
    const directUrl = submission?.submittedFileAssetUrl || submission?.publicUrl || submission?.PublicUrl
    if (directUrl) return directUrl

    const fileAssetId = submission?.submittedFileAssetId || submission?.SubmittedFileAssetId
    return fileAssetId ? `${API_BASE_URL}/api/files/${fileAssetId}` : undefined
  }

  const mapBackendTaskStatus = (status: any, submissions?: any[]): TaskStatus => {
    const statusStr = String(status).trim().toUpperCase();
    const latestSubmission = getLatestSubmission(submissions);
    const latestSubStatus = getSubmissionStatus(latestSubmission);

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

  const fetchTasks = async (): Promise<Task[]> => {
    try {
      const response = await fetchAPI<{ data: any[] }>('/api/page-tasks/assistant')
      const data = response.data || response || []

      if (Array.isArray(data)) {
        return data.map((t: any) => {
          const latestSub = getLatestSubmission(t.submissions);

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
            submittedWorkUrl: getSubmissionFileUrl(latestSub),
            submittedFileAssetId: latestSub?.submittedFileAssetId || latestSub?.SubmittedFileAssetId || undefined,
            submitDescription: latestSub?.note || undefined,
            submissionId: latestSub?.submissionId || latestSub?.id || undefined,
            feedback: latestSub?.rejectReason || undefined,
            referenceFiles: t.taskReferences || t.referenceFiles || []
          }
        })
      }
    } catch (error) {
      console.warn("fetchTasks failed:", error)
    }
    return []
  }

  const loadData = useCallback(() => {
    // Lấy id assistant đang đăng nhập từ localStorage (không phụ thuộc /api/users)
    if (typeof window !== 'undefined' && !selectedAssistantId) {
      const userInfo = localStorage.getItem('user-info')
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo)
          const myId = parsed?.id || parsed?.userId
          if (myId) setSelectedAssistantId(myId)
        } catch { }
      }
    }
    // Load static and dynamic assistant metadata
    userService.getUsers().then((res) => {
      const list = (res.data || []).filter(u => u.roleName?.toLowerCase() === 'assistant')
      const mapped = list.map(u => ({
        id: u.userId,
        name: u.displayName || u.userName,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        specialty: 'Trợ lý',
        activeTasks: 0
      }))
      setAssistants(mapped)

      // Auto-set the assistant ID to the logged in assistant if available, or first in the list
      if (typeof window !== 'undefined') {
        const userInfo = localStorage.getItem('user-info')
        if (userInfo) {
          try {
            const parsed = JSON.parse(userInfo)
            if (parsed.role?.toLowerCase() === 'assistant') {
              setSelectedAssistantId(parsed.id)
              return
            }
          } catch { }
        }
      }
      if (mapped.length > 0 && !selectedAssistantId) {
        setSelectedAssistantId(mapped[0].id)
      }
    }).catch(() => { })

    // Load helper lookups
    chapterService.listChapters().then((chaps) => setAllChapters(chaps)).catch(() => { })
    seriesService.listSeries().then((list) => setAllSeries(list)).catch(() => { })

    if (selectedAssistantId) {
      fetchTasks().then((res) => {
        setTasks(res)
      }).catch(() => { })
    }
  }, [selectedAssistantId])

  useEffect(() => {
    loadData()
    setMounted(true)
  }, [loadData])

  if (!mounted) return null

  // Role Guard
  if (role !== 'Assistant') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Từ chối truy cập</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Chỉ người dùng có vai trò <strong>Trợ lý</strong> mới được quyền truy cập bảng điều khiển này.
        </p>
        <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
          💡 <strong>Mẹo:</strong> Sử dụng bộ chuyển đổi vai trò ở thanh bên trái để đổi vai trò của bạn thành <strong>Assistant</strong>.
        </p>
        <Link
          href="/dashboard/manga-list"
          className="mt-2 text-sm font-semibold text-primary hover:underline"
        >
          Đi tới Danh sách truyện
        </Link>
      </div>
    )
  }

  const activeAssistant = assistants.find(a => a.id === selectedAssistantId)

  const getChapterInfo = (chapterId: string) => {
    const chapter = allChapters.find(c => c.id === chapterId)
    if (!chapter) return `Ref: ${chapterId}`
    const series = allSeries.find(s => s.id === chapter.seriesId)
    const seriesTitle = series ? series.title : 'Manga'
    return `${seriesTitle} - Ch. ${chapter.number || (chapter as any).chapterNo || 1}: ${chapter.title}`
  }

  // Handlers
  const handleStartTask = (taskId: string) => {
    toast.success('Đã bắt đầu công việc! Trạng thái được cập nhật thành Đang thực hiện.')
    try {
      const started = JSON.parse(localStorage.getItem('started_tasks') || '[]')
      if (!started.includes(taskId)) {
        started.push(taskId)
        localStorage.setItem('started_tasks', JSON.stringify(started))
      }
    } catch { }
    loadData()
  }

  const handleOpenSubmit = (taskId: string) => {
    setSubmittingTaskId(taskId)
    setSubmitDescription('')
    setSubmitFile(null)
  }

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submittingTaskId) return
    if (!submitFile) {
      toast.error('Vui lòng chọn file để nộp.')
      return
    }
    try {
      setUploading(true)
      // 1) Upload file thật, lấy fileAssetId
      const formData = new FormData()
      formData.append('category', 'TaskSubmission')
      formData.append('files', submitFile)
      const uploadRes = await fetchAPI<{ data: { files: { fileAssetId: string }[] } }>('/api/files', {
        method: 'POST',
        body: formData
      })
      const fileAssetId = uploadRes.data.files[0].fileAssetId

      // 2) Nộp bài với fileAssetId thật
      await fetchAPI(`/api/page-tasks/${submittingTaskId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          submittedFileAssetId: fileAssetId,
          note: submitDescription || 'Đã hoàn thành công việc, gửi Mangaka duyệt.'
        })
      })
      toast.success('Nộp bài thành công! Mangaka đã được thông báo.')
      setSubmittingTaskId(null)
      setSubmitFile(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Không thể nộp sản phẩm.')
    } finally {
      setUploading(false)
    }
  }
  // Task lists
  const pendingTasks = tasks.filter(t => t.status === 'Pending')
  const inProgressTasks = tasks.filter(t => t.status === 'In-Progress' || t.status === 'Rejected')
  const completedTasks = tasks.filter(t => t.status === 'Submitted' || t.status === 'Approved')

  const stats = {
    total: tasks.length,
    pending: pendingTasks.length,
    working: inProgressTasks.length,
    completed: completedTasks.length,
  }

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ bắt đầu</span>
      case 'In-Progress':
        return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Play className="w-3 h-3 animate-pulse" /> Đang thực hiện</span>
      case 'Submitted':
        return <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Send className="w-3 h-3" /> Đã nộp</span>
      case 'Approved':
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>
      case 'Rejected':
        return <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Yêu cầu sửa đổi</span>
      default:
        return <span className="bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 rounded-3xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Không gian làm việc Trợ lý
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Bảng điều khiển Trợ lý
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Quản lý và thực hiện các nhiệm vụ vẽ do tác giả giao. Bắt đầu làm việc, nộp các trang vẽ và xem phản hồi.
            </p>
          </div>

          {/* Interactive Simulation Switcher */}
          <div className="bg-card border border-border p-3.5 rounded-2xl shadow-sm space-y-2 shrink-0">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Mô phỏng tài khoản Trợ lý</p>
            <div className="flex flex-wrap gap-1.5">
              {assistants.map(ast => (
                <button
                  key={ast.id}
                  onClick={() => setSelectedAssistantId(ast.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedAssistantId === ast.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  {ast.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Profile Info */}
      {activeAssistant && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 text-primary w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
              {activeAssistant.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">{activeAssistant.name}</h2>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">Chuyên môn: {activeAssistant.specialty}</p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="text-muted-foreground font-semibold">Nhiệm vụ đang vẽ</p>
            <p className="text-base font-extrabold text-foreground mt-0.5">{activeAssistant.activeTasks} nhiệm vụ đang làm</p>
          </div>
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Nhiệm vụ được giao', value: stats.total, icon: ClipboardList, color: 'text-foreground', bg: 'bg-primary/10' },
          { label: 'Chờ bắt đầu', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Đang thực hiện', value: stats.working, icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Đã nộp / Hoàn thành', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:border-primary/10 transition-colors">
            <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Active & Pending Tasks */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Nhiệm vụ đang hoạt động của tôi ({stats.pending + stats.working})
            </h2>
          </div>

          <div className="space-y-4">
            {tasks.filter(t => t.status !== 'Approved' && t.status !== 'Submitted').length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
                <h3 className="font-bold text-sm text-foreground">Không có nhiệm vụ hoạt động nào</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Tất cả các nhiệm vụ được giao đã được hoàn thành. Hãy tiếp tục theo dõi các kịch bản phân công mới của tác giả.
                </p>
              </div>
            ) : (
              tasks.filter(t => t.status !== 'Approved' && t.status !== 'Submitted').map((task) => {
                const isWorking = task.status === 'In-Progress' || task.status === 'Rejected'

                return (
                  <div
                    key={task.id}
                    className={`bg-card border rounded-2xl p-5 transition-all space-y-4 ${task.status === 'Rejected'
                      ? 'border-red-500/30 bg-gradient-to-br from-card to-red-500/5'
                      : 'border-border hover:border-primary/20'
                      }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                            {task.id}
                          </span>
                          <h3 className="font-bold text-sm text-foreground">
                            {task.type} (Trang {task.pages})
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold mt-1">
                          {getChapterInfo(task.chapterId)}
                        </p>
                      </div>

                      {getStatusBadge(task.status)}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/40">
                      {task.description}
                    </p>
                    {task.referenceFiles && task.referenceFiles.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">📎 Tài liệu hướng dẫn</p>
                        {task.referenceFiles.map((f: any) => (
                          <a key={f.fileAssetId} href={f.publicUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">
                            📄 {f.originalFileName}
                          </a>
                        ))}
                      </div>
                    )}
                    {/* Rejections & Feedback Box */}
                    {task.status === 'Rejected' && task.feedback && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Phản hồi yêu cầu sửa đổi
                        </p>
                        <p className="italic">"{task.feedback}"</p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" /> Hạn chót: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Ngay lập tức'}
                      </span>

                      <div>
                        {!isWorking ? (
                          <button
                            onClick={() => handleStartTask(task.id)}
                            className="flex items-center gap-1 px-4.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all"
                          >
                            <Play className="w-3.5 h-3.5" /> Bắt đầu vẽ
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenSubmit(task.id)}
                            className="flex items-center gap-1 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                          >
                            <Send className="w-3.5 h-3.5" /> Nộp sản phẩm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Task Archives / Finished Work */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Đã nộp & Hoàn thành ({stats.completed})
          </h2>

          <div className="space-y-4">
            {completedTasks.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
                <Clock className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                <p className="text-xs text-muted-foreground">Chưa có nhiệm vụ hoàn thành nào</p>
              </div>
            ) : (
              completedTasks.map((task) => (
                <div key={task.id} className="bg-card border border-border/60 rounded-2xl p-4.5 space-y-3.5 hover:border-primary/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-xs text-foreground">{task.type} (Trang {task.pages})</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{getChapterInfo(task.chapterId)}</p>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>

                  {/* Submitted mockup file preview */}
                  {task.submittedWorkUrl && (
                    <div className="relative h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={task.submittedWorkUrl}
                        alt="Submitted Work"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <a
                          href={task.submittedWorkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-card rounded-lg text-foreground text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1"
                        >
                          <FileImage className="w-3.5 h-3.5" /> Xem toàn bộ
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Feedback summary */}
                  {task.status === 'Approved' && task.feedback && (
                    <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl p-2.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                      <span className="font-bold">Phản hồi của Tác giả: </span>
                      <span className="italic">"{task.feedback}"</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-muted-foreground font-semibold pt-1">
                    <span>Mã nhiệm vụ: {task.id}</span>
                    <span>Cập nhật: {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Submit Work Dialog Backdrop/Modal */}
      {submittingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSubmittingTaskId(null)} />

          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-500" /> Nộp sản phẩm hoàn thành
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Gửi sản phẩm và ghi chú bản vẽ cho tác giả. Họ sẽ xét duyệt để phê duyệt hoặc yêu cầu bạn điều chỉnh thêm.
            </p>

            <form onSubmit={handleSubmitWork} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Mô tả sản phẩm nộp</label>
                <textarea
                  required
                  placeholder="Ví dụ: Đã vẽ xong bối cảnh nền và screentone. Thêm chi tiết đổ nát ở trang 5."
                  value={submitDescription}
                  onChange={(e) => setSubmitDescription(e.target.value)}
                  className="w-full p-2.5 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-24 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">File bài nộp</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                  className="w-full p-2.5 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>



              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingTaskId(null)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
