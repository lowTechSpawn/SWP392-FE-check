'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seriesProposalSchema, type SeriesProposalInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, AlertCircle, BookOpen, FileText, Image as ImageIcon, Upload, X } from 'lucide-react'
import { API_BASE_URL } from '@/lib/constants'

const uploadSampleImagesToBackend = async (files: File[]): Promise<string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append('category', '2'); // 2 is ProposalSamplePage

  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/api/files`, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    }
  });

  if (!response.ok) {
    let errMsg = "Tải lên các trang mẫu thất bại.";
    try {
      const errRes = await response.json();
      if (errRes.message) errMsg = errRes.message;
    } catch {}
    throw new Error(errMsg);
  }

  const resData = await response.json();
  const fileAssetIds: string[] = (resData?.data?.files || []).map((f: any) => f.fileAssetId).filter(Boolean);
  
  if (fileAssetIds.length < 5) {
    throw new Error("Không đủ số lượng file asset ID trả về từ backend (yêu cầu tối thiểu 5 trang).");
  }
  
  return fileAssetIds.join(',');
};

const uploadSourceZipToBackend = async (file: File): Promise<string> => {
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
    let errMsg = "Tải lên tệp tin nguồn ZIP thất bại.";
    try {
      const errRes = await response.json();
      if (errRes.message) errMsg = errRes.message;
    } catch {}
    throw new Error(errMsg);
  }

  const resData = await response.json();
  const fileAssetIds: string[] = (resData?.data?.files || []).map((f: any) => f.fileAssetId).filter(Boolean);
  
  if (fileAssetIds.length === 0) {
    throw new Error("Không tìm thấy file asset ID trả về cho tệp tin nguồn ZIP.");
  }
  
  return fileAssetIds[0];
};

interface SeriesProposalFormProps {
  onSubmit: (data: SeriesProposalInput, action: 'draft' | 'submit') => Promise<void>
  isLoading?: boolean
  /** If provided, block both buttons and show warning (BR-19) */
  hasActivePendingProposal?: boolean
  defaultValues?: Partial<SeriesProposalInput>
}

const ALL_GENRES = [
  'Action', 'Adventure', 'Avant Garde', 'Boys Love',
  'Comedy', 'Demons', 'Drama', 'Ecchi',
  'Fantasy', 'Girls Love', 'Gourmet', 'Harem',
  'Horror', 'Isekai', 'Iyashikei', 'Josei',
  'Kids', 'Magic', 'Mahou Shoujo', 'Martial Arts',
  'Mecha', 'Military', 'Music', 'Mystery',
  'Parody', 'Psychological', 'Reverse Harem', 'Romance',
  'School', 'Sci-Fi', 'Seinen', 'Shoujo',
  'Shounen', 'Slice of Life', 'Space', 'Sports',
  'Super Power', 'Supernatural', 'Suspense', 'Thriller',
  'Vampire'
]

const SYNOPSIS_MIN = 200
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
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    defaultValues?.genre ? defaultValues.genre.split(', ').filter(Boolean) : []
  )
  const [sampleImages, setSampleImages] = useState<(File | null)[]>([null, null, null, null, null])
  const [samplePreviews, setSamplePreviews] = useState<(string | null)[]>([null, null, null, null, null])
  const [sourceZipFile, setSourceZipFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      samplePreviews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview)
      })
    }
  }, [samplePreviews])

  const handleSampleImageChange = (index: number, file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chỉ chọn các tệp tin hình ảnh (.jpg, .jpeg, .png, .gif, .webp).')
        return
      }
      
      const newImages = [...sampleImages]
      newImages[index] = file
      setSampleImages(newImages)

      const newPreviews = [...samplePreviews]
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]!)
      }
      newPreviews[index] = URL.createObjectURL(file)
      setSamplePreviews(newPreviews)

      const allFilled = newImages.every(img => img !== null)
      if (allFilled) {
        setValue('sampleFileUrl', 'ready', { shouldValidate: true })
      } else {
        setValue('sampleFileUrl', '')
      }
    } else {
      const newImages = [...sampleImages]
      newImages[index] = null
      setSampleImages(newImages)

      const newPreviews = [...samplePreviews]
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]!)
        newPreviews[index] = null
      }
      setSamplePreviews(newPreviews)
      setValue('sampleFileUrl', '')
    }
  }

  const synopsisValue = watch('synopsis') ?? ''
  const titleValue = watch('title') ?? ''

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
        const selectedCount = sampleImages.filter(Boolean).length
        if (selectedCount < 5 && !data.sampleFileUrl) {
          setError('Vui lòng chọn đủ 5 ảnh cho các trang truyện mẫu.')
          return
        }
      }

      setIsUploading(true)

      try {
        const filledImages = sampleImages.filter((img): img is File => img !== null)
        if (filledImages.length === 5) {
          const uploadedUrl = await uploadSampleImagesToBackend(filledImages)
          finalData.sampleFileUrl = uploadedUrl
          setValue('sampleFileUrl', uploadedUrl)
        }

        if (sourceZipFile) {
          const zipAssetId = await uploadSourceZipToBackend(sourceZipFile)
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
      setSampleImages([null, null, null, null, null])
      setSamplePreviews([null, null, null, null, null])
      setSourceZipFile(null)
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

      {/* BR-19 block banner */}
      {hasActivePendingProposal && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-600">Active proposal already exists</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              You already have a proposal in <span className="font-semibold">Pending Review</span> or{' '}
              <span className="font-semibold">Under Review</span>. You cannot submit or save another
              until the current one is resolved. (BR-19)
            </p>
          </div>
        </div>
      )}

      {/* API / network error */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title Field */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80">
              Title <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground font-mono">
              {titleValue.length}/100
            </span>
          </div>
          <input
            {...register('title')}
            placeholder="Enter series title..."
            maxLength={100}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            disabled={isLoading || hasActivePendingProposal}
          />
          {errors.title && (
            <span className="text-destructive text-xs font-semibold">{errors.title.message}</span>
          )}
        </div>

        {/* Genre Field (Custom Multi-select Popover) */}
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <label className="text-sm font-semibold text-foreground/80">
            Genre <span className="text-destructive">*</span>
          </label>

          {/* Hidden input to register genre with react-hook-form */}
          <input type="hidden" {...register('genre')} />

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-background border rounded-xl text-sm transition-all focus:outline-none ${isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:bg-muted/50'
              } ${hasActivePendingProposal || isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={isLoading || hasActivePendingProposal}
          >
            <span className="truncate text-foreground/90">
              {selectedGenres.length > 0 ? selectedGenres.join(', ') : 'Select genres…'}
            </span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute left-0 right-0 md:left-auto md:w-[560px] z-50 mt-1 bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 max-h-[220px] overflow-y-auto pr-1">
                {ALL_GENRES.map((g) => {
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
            Publication Type <span className="text-destructive">*</span>
          </label>
          <select
            {...register('publicationType')}
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
            disabled={isLoading || hasActivePendingProposal}
          >
            <option value="Weekly">Weekly</option>
            <option value="Bi-Weekly">Bi-Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="One-Shot">One-Shot</option>
          </select>
          {errors.publicationType && (
            <span className="text-destructive text-xs font-semibold">{errors.publicationType.message}</span>
          )}
        </div>
      </div>

      {/* Synopsis — BR-15: 200–2000 chars */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground/80">
            Synopsis <span className="text-destructive">*</span>
          </label>
          <span className={`text-[11px] font-mono font-semibold ${synopsisReady ? 'text-emerald-600' : 'text-amber-500'}`}>
            {synopsisLen}/{SYNOPSIS_MAX}
            {!synopsisReady && ` (min ${SYNOPSIS_MIN})`}
          </span>
        </div>
        <textarea
          {...register('synopsis')}
          placeholder="Describe your series story arc, main characters, themes, and target audience…"
          rows={6}
          className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 resize-none"
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

      {/* 5 Sample Pages Area (Required) */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-primary" />
          Manga Sample Pages (Trang mẫu) <span className="text-destructive">*</span>
          <span className="text-[11px] text-muted-foreground font-normal ml-1">(Bắt buộc tải lên đủ 5 trang truyện định dạng ảnh: .jpg, .jpeg, .png, .gif, .webp)</span>
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((index) => {
            const preview = samplePreviews[index]
            return (
              <div 
                key={index} 
                className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all overflow-hidden bg-muted/30 group flex flex-col items-center justify-center p-2 text-center"
              >
                {preview ? (
                  <>
                    <img src={preview} alt={`Trang ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById(`sample-image-input-${index}`)
                          fileInput?.click()
                        }}
                        className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg text-xs font-semibold backdrop-blur-sm transition-colors cursor-pointer"
                      >
                        Thay đổi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSampleImageChange(index, null)}
                        className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-bold rounded">
                      Trang {index + 1}
                    </span>
                  </>
                ) : (
                  <label 
                    htmlFor={`sample-image-input-${index}`} 
                    className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      Trang {index + 1}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">Tải ảnh lên</span>
                  </label>
                )}
                <input
                  type="file"
                  id={`sample-image-input-${index}`}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    handleSampleImageChange(index, file)
                  }}
                  className="hidden"
                  disabled={isLoading || isUploading || hasActivePendingProposal}
                />
              </div>
            )
          })}
        </div>
        
        {/* Hidden input to register sampleFileUrl validation */}
        <input type="hidden" {...register('sampleFileUrl')} />
        
        {errors.sampleFileUrl && (
          <span className="text-destructive text-xs font-semibold block">{errors.sampleFileUrl.message}</span>
        )}
      </div>

      {/* Source ZIP File & Cover Image URL Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source ZIP File Input (Optional) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Source Manuscript File (ZIP)
            <span className="text-[10px] text-muted-foreground font-normal ml-1">(Optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              id="sourceZipFile"
              accept=".zip"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setSourceZipFile(file)
              }}
              className="hidden"
              disabled={isLoading || isUploading || hasActivePendingProposal}
            />
            <label
              htmlFor="sourceZipFile"
              className={`px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold cursor-pointer hover:bg-muted/50 transition-colors ${
                isLoading || isUploading || hasActivePendingProposal ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Choose ZIP File
            </label>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {sourceZipFile ? sourceZipFile.name : (watch('sourceZipFileAssetId') ? 'ZIP uploaded' : 'No file chosen')}
            </span>
          </div>
          {errors.sourceZipFileAssetId && (
            <span className="text-destructive text-xs font-semibold block">{errors.sourceZipFileAssetId.message}</span>
          )}
        </div>

        {/* Cover Image URL (optional) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Cover Image URL
            <span className="text-[10px] text-muted-foreground font-normal ml-1">(optional)</span>
          </label>
          <input
            {...register('coverImageUrl')}
            placeholder="https://example.com/cover.jpg"
            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            disabled={isLoading || isUploading || hasActivePendingProposal}
          />
          {errors.coverImageUrl && (
            <span className="text-destructive text-xs font-semibold">{errors.coverImageUrl.message}</span>
          )}
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
            if (!watch('sampleFileUrl') && sampleImages.filter(Boolean).length === 0) {
              setValue('sampleFileUrl', 'draft-placeholder')
            }
          }}
          disabled={isLoading || isUploading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-semibold rounded-xl border-border"
        >
          {isLoading || isUploading ? 'Processing…' : 'Save as Draft'}
        </Button>

        {/* Submit for Review */}
        <Button
          type="submit"
          onClick={() => {
            setAction('submit')
            if (watch('sampleFileUrl') === 'draft-placeholder') {
              setValue('sampleFileUrl', '')
            }
          }}
          disabled={isLoading || isUploading || hasActivePendingProposal}
          className="flex-1 py-2.5 font-bold rounded-xl shadow-sm"
        >
          {isLoading || isUploading ? 'Processing…' : 'Submit for Review'}
        </Button>
      </div>
    </form>
  )
}
