'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { SeriesProposalForm } from '@/components/forms/series-proposal-form'
import type { SeriesProposalInput } from '@/lib/validation'
import { proposalService } from '@/services/proposalService'
import type { Proposal } from '@/types/proposal'
import { useRole } from '@/context/RoleContext'
import { notificationStore } from '@/store/notificationStore'

const { hasPendingProposal, isTitleDuplicate, saveDraft, submitProposal, getProposalById, updateDraft } = proposalService

export default function NewProposalPage() {
  const router = useRouter()
  const { role } = useRole()
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editProposal, setEditProposal] = useState<Proposal | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const edit = params.get('edit')
      if (edit) {
        setEditId(edit)
        getProposalById(edit).then((p) => {
          if (p && p.status === 'Draft') {
            setEditProposal(p)
          }
        })
      }
    }
  }, [])

  const [mangakaName, setMangakaName] = useState('Mangaka')
  const [mangakaId, setMangakaId] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user-info')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed?.name) {
            setMangakaName(parsed.name)
          }
          if (parsed?.id) {
            setMangakaId(parsed.id)
          }
        } catch { }
      }
    }
  }, [])

  const [blockedByBR19, setBlockedByBR19] = useState(false)

  // check if mangaka already has an active pending proposal
  useEffect(() => {
    if (mangakaId) {
      hasPendingProposal(mangakaId).then(setBlockedByBR19)
    }
  }, [mangakaId])

  const handleSubmit = useCallback(
    async (data: SeriesProposalInput, action: 'draft' | 'submit') => {
      setIsLoading(true)

      try {
        if (action === 'draft') {
          if (editId) {
            await updateDraft(editId, {
              title: data.title,
              genre: data.genre,
              publicationType: data.publicationType,
              synopsis: data.synopsis,
              sampleFileUrl: data.sampleFileUrl,
              coverImageUrl: data.coverImageUrl,
              sourceZipFileAssetId: data.sourceZipFileAssetId,
            }, false)
          } else {
            // Draft: no validation, just save
            await saveDraft({
              title: data.title,
              genre: data.genre,
              publicationType: data.publicationType,
              synopsis: data.synopsis,
              sampleFileUrl: data.sampleFileUrl,
              mangakaId: mangakaId,
              coverImageUrl: data.coverImageUrl,
              sourceZipFileAssetId: data.sourceZipFileAssetId,
            })
          }
          setSuccessMessage('draft')
          setTimeout(() => router.push('/dashboard/series'), 1200)
          return
        }

        // Submit — run check
        if (await isTitleDuplicate(data.title, editId || undefined)) {
          throw new Error(`Title "${data.title}" is already used by an existing proposal or active series`)
        }

        if (editId) {
          await updateDraft(editId, {
            title: data.title,
            genre: data.genre,
            publicationType: data.publicationType,
            synopsis: data.synopsis,
            sampleFileUrl: data.sampleFileUrl,
            coverImageUrl: data.coverImageUrl,
            sourceZipFileAssetId: data.sourceZipFileAssetId,
          }, true)
        } else {
          await submitProposal({
            title: data.title,
            genre: data.genre,
            publicationType: data.publicationType,
            synopsis: data.synopsis,
            sampleFileUrl: data.sampleFileUrl,
            mangakaId: mangakaId,
            coverImageUrl: data.coverImageUrl,
            sourceZipFileAssetId: data.sourceZipFileAssetId,
          })
        }

        // Dispatch notifications to Mangaka, Editorial Board, and Editor-in-Chief
        notificationStore.addNotification(
          'Proposal Submitted',
          `Your proposal "${data.title}" has been successfully queued for review.`,
          'Mangaka',
          'success'
        )
        notificationStore.addNotification(
          'New Proposal Pending Review',
          `Mangaka ${mangakaName} has submitted a new proposal "${data.title}" for review.`,
          'EditorialBoard',
          'info'
        )
        notificationStore.addNotification(
          'New Proposal Pending Review',
          `Mangaka ${mangakaName} has submitted a new proposal "${data.title}" for review.`,
          'EditorInChief',
          'info'
        )

        setSuccessMessage('submitted')
        setTimeout(() => router.push('/dashboard/series'), 1800)
      } catch (err) {
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [router, mangakaId, mangakaName, editId],
  )

  // Only Mangaka can access this page
  if (role !== 'Mangaka') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <WifiOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Only <strong>Mangaka</strong> can create series proposals.
        </p>
        <Link
          href="/dashboard/manga-list"
          className="mt-2 text-sm font-semibold text-primary hover:underline"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <Link
          href="/dashboard/series"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Proposals
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">New Series Proposal</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below. Your proposal will be reviewed by the Editorial Board after submission.
        </p>
      </div>

      {/* Success overlay */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            {successMessage === 'submitted' ? (
              <>
                <p className="font-bold text-emerald-800 dark:text-emerald-300">Proposal submitted for review!</p>
                <p className="text-emerald-700/90 dark:text-emerald-400/95 text-xs mt-0.5">
                  The Editorial Board has been notified. Redirecting to My Proposals…
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-emerald-800 dark:text-emerald-300">Draft saved successfully!</p>
                <p className="text-emerald-700/90 dark:text-emerald-400/95 text-xs mt-0.5">Redirecting to My Proposals…</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
        {/* BR info callout */}
        <div className="mb-6 p-3 bg-primary/5 border border-primary/15 rounded-lg text-xs text-muted-foreground space-y-1">
          <p className="font-bold text-primary text-[11px] uppercase tracking-wide">Quy tắc nộp đề xuất</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Tiêu đề truyện: bắt buộc, tối đa 100 ký tự</li>
            <li>Thể loại: bắt buộc chọn ít nhất một thể loại</li>
            <li>Tóm tắt nội dung: từ 200 đến 2000 ký tự</li>
            <li>Bản thảo (ZIP): bắt buộc tải lên tệp tin ZIP khi nộp phê duyệt</li>
            <li>Tiêu đề truyện không được trùng lặp với tác phẩm đã hoạt động</li>
          </ul>
        </div>

        <SeriesProposalForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          hasActivePendingProposal={blockedByBR19}
          defaultValues={editProposal || undefined}
        />
      </div>
    </div>
  )
}
