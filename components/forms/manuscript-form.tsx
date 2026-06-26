'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { manuscriptSchema, type ManuscriptInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'

interface ManuscriptFormProps {
  seriesId: string
  seriesTitle: string
  onSubmit: (data: ManuscriptInput) => Promise<void>
  isLoading?: boolean
}

export function ManuscriptForm({ seriesId, seriesTitle, onSubmit, isLoading }: ManuscriptFormProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ManuscriptInput>({
    resolver: zodResolver(manuscriptSchema),
    defaultValues: {
      seriesId,
    },
  })

  const handleFormSubmit = async (data: ManuscriptInput) => {
    try {
      setError(null)
      await onSubmit(data)
      reset({ seriesId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nộp bản thảo.')
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Nộp bản thảo</h2>
        <p className="text-gray-600">Bộ truyện: {seriesTitle}</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Đường dẫn tệp bản thảo</label>
        <input
          {...register('fileUrl')}
          placeholder="https://example.com/manuscript.pdf"
          className="w-full px-3 py-2 border rounded"
        />
        <p className="text-xs text-gray-500">Định dạng hỗ trợ: PDF, DOCX, ZIP</p>
        {errors.fileUrl && <span className="text-red-600 text-sm">{errors.fileUrl.message}</span>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Ghi chú (tùy chọn)</label>
        <textarea
          {...register('notes')}
          placeholder="Nhập ghi chú hoặc bối cảnh cho lần nộp này..."
          rows={4}
          className="w-full px-3 py-2 border rounded"
        />
        {errors.notes && <span className="text-red-600 text-sm">{errors.notes.message}</span>}
      </div>

      <div className="p-4 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm">
        <p>✓ Tất cả trang phải được duyệt trước khi nộp</p>
        <p>✓ Hệ thống sẽ tạo phiên bản mới để biên tập viên xem xét</p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Đang nộp...' : 'Nộp bản thảo'}
      </Button>
    </form>
  )
}
