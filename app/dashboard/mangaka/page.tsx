'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PencilLine,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileEdit,
  AlertTriangle,
  Layers,
  ClipboardList,
  Sparkles,
  TrendingUp,
  CalendarDays,
  Eye,
} from 'lucide-react'
import { proposalService } from '@/services/proposalService'
import type { Proposal, ProposalStatus } from '@/types/proposal'

const { getProposalsByMangaka, hasPendingProposal } = proposalService

const STATUS_CONFIG: Record<ProposalStatus, { label: string; className: string; icon: React.ElementType }> = {
  Draft: { label: 'Bản thảo', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: FileEdit },
  'Pending Review': { label: 'Chờ duyệt (cũ)', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  'Under Review': { label: 'Tantou đang xem xét', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Eye },
  'Board Voting': { label: 'Ban biên tập đang bỏ phiếu', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Eye },
  Approved: { label: 'Đã duyệt', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  Rejected: { label: 'Bị từ chối', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  Active: { label: 'Đã duyệt & Đang phát hành', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: CheckCircle2 },
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MangakaDashboardPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [mounted, setMounted] = useState(false)
  const [mangakaName, setMangakaName] = useState('Mangaka')
  const [mangakaId, setMangakaId] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [assignedEditor, setAssignedEditor] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('user-info')
    let currentId = ''
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed?.name) {
          setMangakaName(parsed.name)
        }
        if (parsed?.id) {
          setMangakaId(parsed.id)
          currentId = parsed.id
        }
        if (parsed?.assignedEditorName) {
          setAssignedEditor({
            name: parsed.assignedEditorName,
            email: parsed.assignedEditorEmail || ''
          })
        }
      } catch { }
    }

    if (currentId) {
      getProposalsByMangaka(currentId).then((list) => {
        setProposals(list)
        hasPendingProposal(currentId).then((blocked) => {
          setIsBlocked(blocked)
          setMounted(true)
        })
      })
    } else {
      setMounted(true)
    }
  }, [])

  if (!mounted) return null

  const recent = [...proposals].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3)

  const counts = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'Draft').length,
    pending: proposals.filter(p => p.status === 'Under Review' || p.status === 'Board Voting' || p.status === 'Pending Review').length,
    approved: proposals.filter(p => p.status === 'Approved' || p.status === 'Active').length,
    rejected: proposals.filter(p => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-8">

      {/* Welcome header */}
      <div className="relative overflow-hidden border-primary/15 rounded-2xl p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Chào mừng quay trở lại, {mangakaName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Quản lý các đề xuất tác phẩm mới và theo dõi trạng thái duyệt của bạn.
            </p>
            {assignedEditor && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-xs font-medium text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Editor phụ trách: <strong className="text-foreground">{assignedEditor.name}</strong> {assignedEditor.email ? `(${assignedEditor.email})` : ''}</span>
              </div>
            )}
          </div>

          {isBlocked ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs font-semibold text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
              Đang có đề xuất chờ duyệt — tạm khóa tạo đề xuất mới
            </div>
          ) : (
            <Link
              href="/dashboard/series/new"
              className="inline-flex items-center gap-2 shrink-0 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-lg shadow-sm shadow-primary/15 hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Đề xuất mới
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số đề xuất', value: counts.total, icon: PencilLine, color: 'text-foreground' },
          { label: 'Đang duyệt', value: counts.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'Đã duyệt', value: counts.approved, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Bị từ chối', value: counts.rejected, icon: XCircle, color: 'text-red-500', },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-6.5 h-6.5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Proposals */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm">Đề xuất gần đây</h2>
            </div>
            <Link
              href="/dashboard/series"
              className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recent.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <PencilLine className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Chưa có đề xuất nào</p>
                <Link
                  href="/dashboard/series/new"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo đề xuất đầu tiên của bạn
                </Link>
              </div>
            ) : (
              recent.map((p) => {
                const config = STATUS_CONFIG[p.status]
                const StatusIcon = config.icon
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    {/* Left accent */}
                    <div className={`w-1 h-10 rounded-full shrink-0 ${p.status === 'Approved' ? 'bg-emerald-500' :
                      p.status === 'Rejected' ? 'bg-red-500' :
                        p.status === 'Under Review' ? 'bg-blue-500' :
                          p.status === 'Pending Review' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
                        <span className="text-muted-foreground/30">•</span>
                        <CalendarDays className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateShort(p.submittedAt ?? p.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${config.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
