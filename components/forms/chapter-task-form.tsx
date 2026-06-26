'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { chapterTaskSchema, type ChapterTaskInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'

interface ChapterTaskFormProps {
  chapters: { id: string; title: string }[]
  assistants: { id: string; name: string }[]
  onSubmit: (data: ChapterTaskInput) => Promise<void>
  isLoading?: boolean
}

export function ChapterTaskForm({ chapters, assistants, onSubmit, isLoading }: ChapterTaskFormProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChapterTaskInput>({
    resolver: zodResolver(chapterTaskSchema),
  })

  const pageStart = watch('pageStart')

  const handleFormSubmit = async (data: ChapterTaskInput) => {
    try {
      setError(null)
      await onSubmit(data)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể giao nhiệm vụ.')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Giao nhiệm vụ chương</h2>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Chương</label>
        <select {...register('chapterId')} className="w-full px-3 py-2 border rounded">
          <option value="">Chọn chương</option>
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>
        {errors.chapterId && <span className="text-red-600 text-sm">{errors.chapterId.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Trang bắt đầu</label>
          <input {...register('pageStart', { valueAsNumber: true })} type="number" min="1" className="w-full px-3 py-2 border rounded" />
          {errors.pageStart && <span className="text-red-600 text-sm">{errors.pageStart.message}</span>}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Trang kết thúc</label>
          <input
            {...register('pageEnd', { valueAsNumber: true })}
            type="number"
            min={pageStart || 1}
            className="w-full px-3 py-2 border rounded"
          />
          {errors.pageEnd && <span className="text-red-600 text-sm">{errors.pageEnd.message}</span>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Giao cho trợ lý</label>
        <select {...register('assignedToId')} className="w-full px-3 py-2 border rounded">
          <option value="">Chọn trợ lý</option>
          {assistants.map((asst) => (
            <option key={asst.id} value={asst.id}>
              {asst.name}
            </option>
          ))}
        </select>
        {errors.assignedToId && <span className="text-red-600 text-sm">{errors.assignedToId.message}</span>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Hạn hoàn thành</label>
        <input {...register('deadline')} type="datetime-local" className="w-full px-3 py-2 border rounded" />
        <p className="text-xs text-gray-500">Khuyến nghị: trước ngày xuất bản 14 ngày</p>
        {errors.deadline && <span className="text-red-600 text-sm">{errors.deadline.message}</span>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Đang giao...' : 'Giao nhiệm vụ'}
      </Button>
    </form>
  )
}
