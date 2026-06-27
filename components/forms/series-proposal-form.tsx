'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seriesProposalSchema, type SeriesProposalInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertCircle, BookOpen, FileText, Upload, X } from 'lucide-react'
import { API_BASE_URL } from '@/lib/constants'
import { systemService } from '@/services/systemService'

const uploadSourceArchiveToBackend = async (file: File): Promise<string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append('category', '1'); // 1 is ProposalSource
  formData.append('files', file);

  const response = await fetch(`${API_BASE_URL}/api/files`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    }
  });

  if (!response.ok) {
    let errMsg = "Tải lên tệp tin nguồn ZIP/RAR thất bại.";
    try {
      const errRes = await response.json();
      if (errRes.message) errMsg = errRes.message;
    } catch { }
    throw new Error(errMsg);
  }

  const resData = await response.json();
  const fileAssetIds: string[] = (resData?.data?.files || []).map((f: any) => f.fileAssetId).filter(Boolean);

  if (fileAssetIds.length === 0) {
    throw new Error("Không tìm thấy file asset ID trả về cho tệp tin nguồn ZIP/RAR.");
  }

  return fileAssetIds[0];
};

const uploadCoverImageToBackend = async (file: File): Promise<string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append('category', '2'); // 2 is ProposalSamplePage (supports image formats)
  formData.append('files', file);

  const response = await fetch(`${API_BASE_URL}/api/files`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    }
  });

  if (!response.ok) {
    let errMsg = "Tải lên ảnh bìa thất bại.";
    try {
      const errRes = await response.json();
      if (errRes.message) errMsg = errRes.message;
    } catch { }
    throw new Error(errMsg);
  }

  const resData = await response.json();
  const fileAssetIds: string[] = (resData?.data?.files || []).map((f: any) => f.fileAssetId).filter(Boolean);

  if (fileAssetIds.length === 0) {
    throw new Error("Không tìm thấy file asset ID trả về cho ảnh bìa.");
  }

  return fileAssetIds[0];
};

interface SeriesProposalFormProps {
  onSubmit: (data: SeriesProposalInput, action: 'draft' | 'submit') => Promise<void>
  isLoading?: boolean
  /** If provided, block both buttons and show warning */
  hasActivePendingProposal?: boolean
  defaultValues?: Partial<SeriesProposalInput>
}

const SYNOPSIS_MIN = 100
const SYNOPSIS_MAX = 2000

export function SeriesProposalForm({
  onSubmit,
  isLoading,
  hasActivePendingProposal = false,
  defaultValues,
}: SeriesProposalFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'draft' | 'submit'>('submit')
  const [isOpen, setIsOpen] = useState(false)
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    defaultValues?.genre ? defaultValues.genre.split(', ').filter(Boolean) : []
  )
  const [sourceZipFile, setSourceZipFile] = useState<File | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>(
    defaultValues?.coverImageUrl ?? ''
  )
  const [isUploading, setIsUploading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    async function loadGenres() {
      try {
        const list = await systemService.getGenres()
        if (active) {
          const activeGenres = list.filter(g => !g.deletedAt).map(g => g.title)
          setGenres(activeGenres)
        }
      } catch (err) {
        console.error('Failed to load genres from API:', err)
      }
    }
    loadGenres()
    return () => {
      active = false
    }
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SeriesProposalInput>({
    resolver: zodResolver(seriesProposalSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      genre: defaultValues?.genre ?? '',
      publicationType: defaultValues?.publicationType ?? 'Weekly',
      synopsis: defaultValues?.synopsis ?? '',
      sampleFileUrl: defaultValues?.sampleFileUrl ?? '',
      coverImageUrl: defaultValues?.coverImageUrl ?? '',
      sourceZipFileAssetId: defaultValues?.sourceZipFileAssetId ?? null,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      reset({
        title: defaultValues.title ?? '',
        genre: defaultValues.genre ?? '',
        publicationType: defaultValues.publicationType ?? 'Weekly',
        synopsis: defaultValues.synopsis ?? '',
        sampleFileUrl: defaultValues.sampleFileUrl ?? '',
        coverImageUrl: defaultValues.coverImageUrl ?? '',
        sourceZipFileAssetId: defaultValues.sourceZipFileAssetId ?? null,
      })
      if (defaultValues.genre) {
        setSelectedGenres(defaultValues.genre.split(', ').filter(Boolean))
      }
      setCoverPreviewUrl(defaultValues.coverImageUrl ?? '')
    }
  }, [defaultValues, reset])

  useEffect(() => {
    return () => {
      if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl)
      }
    }
  }, [coverPreviewUrl])

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn tệp tin hình ảnh (PNG, JPG, JPEG).')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh bìa không được vượt quá 5MB.')
        return
      }
      setCoverImageFile(file)
      setError(null)
      const localUrl = URL.createObjectURL(file)
      setCoverPreviewUrl(localUrl)
    }
  }

  const handleRemoveCoverImage = () => {
    setCoverImageFile(null)
    if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl)
    }
    setCoverPreviewUrl('')
    setValue('coverImageUrl', '')
  }

  const synopsisValue = watch('synopsis') ?? ''
  const titleValue = watch('title') ?? ''
  const sourceZipFileAssetIdValue = watch('sourceZipFileAssetId') ?? null

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGenreToggle = (g: string) => {
    let nextGenres: string[]
    if (selectedGenres.includes(g)) {
      nextGenres = selectedGenres.filter((item) => item !== g)
    } else {
      nextGenres = [...selectedGenres, g]
    }
    setSelectedGenres(nextGenres)
    setValue('genre', nextGenres.join(', '), { shouldValidate: true })
  }

  const handleFormSubmit = async (data: SeriesProposalInput) => {
    try {
      setError(null)
      const finalData = { ...data }

      if (action === 'submit') {
        if (!sourceZipFile && !data.sourceZipFileAssetId) {
          setError('Vui lòng tải lên tệp tin bản thảo ZIP/RAR.')
          return
        }
      }

      setIsUploading(true)

      try {
        if (coverImageFile) {
          const coverAssetId = await uploadCoverImageToBackend(coverImageFile)
          const coverUrl = `${API_BASE_URL}/api/files/${coverAssetId}`
          finalData.coverImageUrl = coverUrl
          setValue('coverImageUrl', coverUrl)
        }

        if (sourceZipFile) {
          const zipAssetId = await uploadSourceArchiveToBackend(sourceZipFile)
          finalData.sourceZipFileAssetId = zipAssetId
          setValue('sourceZipFileAssetId', zipAssetId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tải lên tệp tin thất bại.')
        return
      } finally {
        setIsUploading(false)
      }

      await onSubmit(finalData, action)
      reset()
      setSourceZipFile(null)
      setCoverImageFile(null)
      setCoverPreviewUrl('')
      setSelectedGenres([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  // Synopsis progress colour
  const synopsisLen = synopsisValue.length
  const synopsisReady = synopsisLen >= SYNOPSIS_MIN
  const synopsisProgressPercent = Math.min((synopsisLen / SYNOPSIS_MAX) * 100, 100)

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

      {/* block banner */}
      {hasActivePendingProposal && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-600">Đã có đề xuất đang xử lý</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Bạn đã có đề xuất ở trạng thái <span className="font-semibold">Chờ duyệt</span> hoặc{' '}
              <span className="font-semibold">Đang duyệt</span>. Không thể gửi hoặc lưu đề xuất khác
              cho đến khi đề xuất hiện tại được xử lý.
            </p>
          </div>
        </div>
      )}

      {/* API / network error */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title Field */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80">
              Tên bộ truyện <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {titleValue.length}/100
            </span>
          </div>
          <input
            {...register('title')}
            placeholder="Nhập tên bộ truyện..."
            maxLength={100}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            disabled={isLoading || hasActivePendingProposal}
          />
          {errors.title && (
            <span className="text-destructive text-xs font-semibold">{errors.title.message}</span>
          )}
        </div>

        {/* Genre Field (Custom Multi-select Popover) */}
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <label className="text-sm font-semibold text-foreground/80">
             Thể loại <span className="text-destructive">*</span>
          </label>

          {/* Hidden input to register genre with react-hook-form */}
          <input type="hidden" {...register('genre')} />

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-background border rounded-lg text-sm transition-all focus:outline-none ${isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:bg-muted/50'
              } ${hasActivePendingProposal || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasActivePendingProposal}
          >
            <span className="truncate text-foreground/90">
              {selectedGenres.length > 0 ? selectedGenres.join(', ') : 'Chọn thể loại…'}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute left-0 right-0 md:left-auto md:w-[560px] z-50 mt-1 bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 max-h-[220px] overflow-y-auto pr-1">
                {genres.map((g) => {
                  const isChecked = selectedGenres.includes(g)
                  return (
                    <label
                      key={g}
                      className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer transition-colors text-xs select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleGenreToggle(g)}
                        className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 bg-background"
                      />
                      <span className={isChecked ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                        {g}
                      </span>
                    </label>
                  )
                })}
              </div>
              {selectedGenres.length > 0 && (
                <div className="border-t border-border pt-2 flex flex-wrap gap-1.5">
                  {selectedGenres.map((g) => (
                    <span
                      key={g}
                      onClick={() => handleGenreToggle(g)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      {g} ×
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {errors.genre && (
            <span className="text-destructive text-xs font-semibold block">{errors.genre.message}</span>
          )}
        </div>

        {/* Publication Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80">
            Hình thức xuất bản <span className="text-destructive">*</span>
          </label>
          <select
            {...register('publicationType')}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            disabled={isLoading || hasActivePendingProposal}
          >
            <option value="Weekly">Hàng tuần</option>
            <option value="Monthly">Hàng tháng</option>
            <option value="One-Shot">Truyện ngắn một kỳ</option>
          </select>
          {errors.publicationType && (
            <span className="text-destructive text-xs font-semibold">{errors.publicationType.message}</span>
          )}
        </div>
      </div>

      {/* Synopsis — 200–2000 chars */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground/80">
            Tóm tắt nội dung <span className="text-destructive">*</span>
          </label>
          <span className={`text-[11px] font-mono font-semibold ${synopsisReady ? 'text-emerald-600' : 'text-amber-500'}`}>
            {synopsisLen}/{SYNOPSIS_MAX}
            {!synopsisReady && ` (tối thiểu ${SYNOPSIS_MIN})`}
          </span>
        </div>
        <textarea
          {...register('synopsis')}
          placeholder="Mô tả mạch truyện, nhân vật chính, chủ đề và nhóm độc giả mục tiêu…"
          rows={6}
          className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 resize-none"
          disabled={isLoading || hasActivePendingProposal}
        />
        {/* Synopsis progress bar */}
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${synopsisReady ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${synopsisProgressPercent}%` }}
          />
        </div>
        {errors.synopsis && (
          <span className="text-destructive text-xs font-semibold">{errors.synopsis.message}</span>
        )}
      </div>

      {/* Source ZIP File & Cover Image URL Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source ZIP File Input (Required) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Tài liệu bản thảo tác phẩm (ZIP/RAR) <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              id="sourceZipFile"
              accept=".zip,.rar"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setSourceZipFile(file)
              }}
              className="hidden"
              disabled={isLoading || isUploading || hasActivePendingProposal}
            />
            <label
              htmlFor="sourceZipFile"
              className={`px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-semibold cursor-pointer hover:bg-muted/50 transition-colors ${isLoading || isUploading || hasActivePendingProposal ? 'opacity-60 cursor-not-allowed' : ''
                }`}
            >
              Chọn tệp ZIP/RAR
            </label>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {sourceZipFile ? sourceZipFile.name : (sourceZipFileAssetIdValue ? 'Đã tải lên tệp ZIP/RAR' : 'Chưa chọn tệp')}
            </span>
          </div>
          <input type="hidden" {...register('sourceZipFileAssetId')} />
          {errors.sourceZipFileAssetId && (
            <span className="text-destructive text-xs font-semibold block">{errors.sourceZipFileAssetId.message}</span>
          )}
        </div>

        {/* Cover Image Upload (optional) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Ảnh bìa truyện
            <span className="text-[10px] text-muted-foreground font-normal ml-1">(Tùy chọn)</span>
          </label>
          
          <div className="space-y-3">
            {coverPreviewUrl ? (
              <div className="relative w-40 aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreviewUrl}
                  alt="Ảnh bìa xem trước"
                  className="w-full h-full object-cover"
                />
                {!isLoading && !isUploading && !hasActivePendingProposal && (
                  <button
                    type="button"
                    onClick={handleRemoveCoverImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all hover:scale-105"
                    title="Xóa ảnh bìa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer bg-card hover:bg-muted/40 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold">Tải lên ảnh bìa truyện</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG, JPEG (Tối đa 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    disabled={isLoading || isUploading || hasActivePendingProposal}
                  />
                </label>
              </div>
            )}
            
            {/* Hidden input to keep React Hook Form synchronized */}
            <input type="hidden" {...register('coverImageUrl')} />
            
            {errors.coverImageUrl && (
              <span className="text-destructive text-xs font-semibold block">{errors.coverImageUrl.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Save Draft */}
        <Button
          type="submit"
          variant="outline"
          onClick={() => {
            setAction('draft')
          }}
          disabled={isLoading || isUploading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-semibold rounded-lg border-border"
        >
          {isLoading || isUploading ? 'Đang xử lý…' : 'Lưu bản nháp'}
        </Button>

        {/* Submit for Review */}
        <Button
          type="submit"
          onClick={() => {
            setAction('submit')
          }}
          disabled={isLoading || isUploading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-bold rounded-lg shadow-sm"
        >
          {isLoading || isUploading ? 'Đang xử lý…' : 'Gửi phê duyệt'}
        </Button>
      </div>
    </form>
  )
}
