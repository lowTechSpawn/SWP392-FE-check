'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { SeriesProposalForm } from '@/components/forms/series-proposal-form'
import type { SeriesProposalInput } from '@/lib/validation'
import {
  hasPendingProposal,
  isTitleDuplicate,
  saveDraft,
  submitProposal,
} from '@/lib/proposals-store'
import { useRole } from '@/context/RoleContext'
import { notificationStore } from '@/store/notificationStore'

const DEFAULT_MANGAKA_ID = 'U01'

export default function NewProposalPage() {
  const router = useRouter()
  const { role } = useRole()
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [mangakaName, setMangakaName] = useState('Mangaka')
  const [mangakaId, setMangakaId] = useState(DEFAULT_MANGAKA_ID)

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
        } catch {}
      }
    }
  }, [])

  const [blockedByBR19, setBlockedByBR19] = useState(false)

  // BR-19: check if mangaka already has an active pending proposal
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
          // Draft: no validation, just save
          await saveDraft({
            title: data.title,
            genre: data.genre,
            publicationType: data.publicationType,
            synopsis: data.synopsis,
            sampleFileUrl: data.sampleFileUrl,
            mangakaId: mangakaId,
            coverImageUrl: data.coverImageUrl,
          })
          setSuccessMessage('draft')
          setTimeout(() => router.push('/dashboard/series'), 1200)
          return
        }

        // Submit — run BR-17 check
        if (await isTitleDuplicate(data.title)) {
          throw new Error(`Title "${data.title}" is already used by an existing proposal or active series`)
        }

        await submitProposal({
          title: data.title,
          genre: data.genre,
          publicationType: data.publicationType,
          synopsis: data.synopsis,
          sampleFileUrl: data.sampleFileUrl,
          mangakaId: mangakaId,
          coverImageUrl: data.coverImageUrl,
        })

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
          'Editorial Board',
          'info'
        )
        notificationStore.addNotification(
          'New Proposal Pending Review',
          `Mangaka ${mangakaName} has submitted a new proposal "${data.title}" for review.`,
          'Editor-in-Chief',
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
    [router, mangakaId, mangakaName],
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
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            {successMessage === 'submitted' ? (
              <>
                <p className="font-bold text-slate-900 dark:text-slate-100">Proposal submitted for review!</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  The Editorial Board has been notified. Redirecting to My Proposals…
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-slate-900 dark:text-slate-100">Draft saved successfully!</p>
                <p className="text-muted-foreground text-xs mt-0.5">Redirecting to My Proposals…</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* BR info callout */}
        <div className="mb-6 p-3 bg-primary/5 border border-primary/15 rounded-xl text-xs text-muted-foreground space-y-1">
          <p className="font-bold text-primary text-[11px] uppercase tracking-wide">Validation Rules</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Title: required, max 100 characters (BR-15)</li>
            <li>Genre: at least one required (BR-15)</li>
            <li>Synopsis: 200–2000 characters (BR-15)</li>
            <li>Sample Pages: minimum 5 pages (BR-15)</li>
            <li>Title must not duplicate an existing active series (BR-17)</li>
          </ul>
        </div>

        <SeriesProposalForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          hasActivePendingProposal={blockedByBR19}
        />
      </div>
    </div>
  )
}
