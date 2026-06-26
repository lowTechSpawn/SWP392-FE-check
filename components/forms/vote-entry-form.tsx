'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { voteEntrySchema, type VoteEntryInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'

interface VoteEntryFormProps {
  series: { id: string; title: string }[]
  chapters: { id: string; title: string; seriesId: string }[]
  onSubmit: (data: VoteEntryInput) => Promise<void>
  isLoading?: boolean
}

export function VoteEntryForm({ series, chapters, onSubmit, isLoading }: VoteEntryFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<VoteEntryInput>({
    resolver: zodResolver(voteEntrySchema),
  })

  const readerCount = watch('readerCount')
  const voteCount = watch('voteCount')

  const filteredChapters = selectedSeriesId ? chapters.filter((ch) => ch.seriesId === selectedSeriesId) : []

  const handleFormSubmit = async (data: VoteEntryInput) => {
    try {
      setError(null)
      await onSubmit(data)
      reset()
      setSelectedSeriesId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi dữ liệu bình chọn.')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Nhập dữ liệu bình chọn độc giả</h2>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Bộ truyện</label>
        <select
          {...register('seriesId')}
          onChange={(e) => setSelectedSeriesId(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Chọn bộ truyện</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        {errors.seriesId && <span className="text-red-600 text-sm">{errors.seriesId.message}</span>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Chương</label>
        <select {...register('chapterId')} className="w-full px-3 py-2 border rounded">
          <option value="">Chọn chương</option>
          {filteredChapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>
        {errors.chapterId && <span className="text-red-600 text-sm">{errors.chapterId.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tổng độc giả</label>
          <input
            {...register('readerCount', { valueAsNumber: true })}
            type="number"
            min="0"
            className="w-full px-3 py-2 border rounded"
          />
          {errors.readerCount && <span className="text-red-600 text-sm">{errors.readerCount.message}</span>}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Tổng lượt bình chọn</label>
          <input
            {...register('voteCount', { valueAsNumber: true })}
            type="number"
            min="0"
            max={readerCount || undefined}
            className="w-full px-3 py-2 border rounded"
          />
          {errors.voteCount && <span className="text-red-600 text-sm">{errors.voteCount.message}</span>}
        </div>
      </div>

      {readerCount > 0 && (
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm font-medium">Điểm bình chọn</p>
          <p className="text-2xl font-bold text-blue-600">{((voteCount / readerCount) * 100).toFixed(2)}%</p>
          <p className="text-xs text-gray-600 mt-2">Tính theo công thức (lượt bình chọn ÷ độc giả) × 100</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Đang gửi...' : 'Gửi dữ liệu bình chọn'}
      </Button>
    </form>
  )
}
