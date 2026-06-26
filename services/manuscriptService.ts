import { fetchAPI } from '@/services/api'
import type { ManuscriptItem, Annotation, ManuscriptVersion } from '@/types/manuscript'

let memoryManuscripts: ManuscriptItem[] = []
let memoryAnnotations: Annotation[] = []

const mapBackendManuscriptStatus = (status: string): ManuscriptItem['status'] => {
  if (!status) return 'SUBMITTED'
  const clean = status.trim().toUpperCase()
  if (clean === 'APPROVED') return 'APPROVED'
  if (clean === 'PUBLISHED') return 'PUBLISHED'
  if (clean === 'REJECTED' || clean === 'REVISION REQUIRED' || clean === 'REVISIONREQUIRED') return 'REVISION REQUIRED'
  return 'SUBMITTED'
}

export const manuscriptService = {
  getManuscripts(): ManuscriptItem[] {
    return memoryManuscripts
  },

  getManuscriptById(id: string): ManuscriptItem | undefined {
    return memoryManuscripts.find(m => m.id === id)
  },

  getAnnotations(manuscriptId: string, versionName: string): Annotation[] {
    return memoryAnnotations.filter(a => a.manuscriptId === manuscriptId && a.versionName === versionName)
  },

  // BR-80: Manuscript Approval Lock / Status Transitions
  async updateManuscriptStatus(
    id: string,
    newStatus: ManuscriptItem['status'],
    feedbackText: string
  ): Promise<boolean> {
    const idx = memoryManuscripts.findIndex(m => m.id === id)
    if (idx !== -1) {
      memoryManuscripts[idx].status = newStatus
    }

    const backendStatus =
      newStatus === 'APPROVED'
        ? 'Approved'
        : newStatus === 'PUBLISHED'
          ? 'Published'
          : 'RevisionRequired'

    const defaultFeedback =
      newStatus === 'APPROVED'
        ? 'Manuscript approved.'
        : newStatus === 'PUBLISHED'
          ? 'Manuscript published.'
          : 'Revision required.'

    const payload = {
      status: backendStatus,
      feedback: feedbackText || defaultFeedback
    }

    try {
      await fetchAPI(`/api/manuscripts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      return true
    } catch (error) {
      console.error("Failed to update manuscript status on backend:", error)
      throw error
    }
  },

  // BR-78: Annotation Version Binding
  async addAnnotation(manuscriptId: string, versionName: string, text: string): Promise<Annotation> {
    const payload = {
      pageNo: 1, // Default page coordinate fallback
      positionX: 50.00,
      positionY: 50.00,
      content: text
    }

    try {
      const res = await fetchAPI<{ id: string; annotationId: string }>(`/api/manuscripts/${manuscriptId}/annotations`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const newAnn: Annotation = {
        id: res.id || res.annotationId || `A${Date.now()}`,
        manuscriptId,
        versionName,
        text,
        createdAt: new Date().toISOString()
      }

      memoryAnnotations.push(newAnn)
      return newAnn
    } catch (error) {
      console.error("Failed to create annotation on backend:", error)
      throw error
    }
  },

  async syncManuscriptsFromBackend(): Promise<ManuscriptItem[]> {
    try {
      const chaptersRes = await fetchAPI<{ data: any[] } | any[]>('/api/chapters')
      const chaptersList = (chaptersRes as any).data || chaptersRes || []

      // Fetch all series to resolve correct series titles (e.g. mapping seriesId -> title)
      let seriesMap = new Map<string, string>()
      try {
        const seriesRes = await fetchAPI<{ data: any[] } | any[]>('/api/series')
        const seriesList = (seriesRes as any).data || seriesRes || []
        if (Array.isArray(seriesList)) {
          seriesList.forEach((s: any) => {
            const sId = s.seriesId || s.id || s.Id
            const sTitle = s.title || s.Title
            if (sId && sTitle) {
              seriesMap.set(sId, sTitle)
            }
          })
        }
      } catch (se) {
        console.warn("Failed to fetch series list for manuscript title mapping:", se)
      }

      if (Array.isArray(chaptersList)) {
        const allManuscripts: any[] = []

        await Promise.all(
          chaptersList.map(async (ch: any) => {
            try {
              const chId = ch.chapterId || ch.id
              const mRes = await fetchAPI<{ data: any[] } | any[]>(`/api/chapters/${chId}/manuscripts`)
              const mList = (mRes as any).data || mRes || []
              if (Array.isArray(mList)) {
                mList.forEach((m: any) => {
                  allManuscripts.push({
                    ...m,
                    chapterId: chId,
                    chapterNumber: ch.chapterNo || ch.number || 1,
                    chapterTitle: ch.title || 'Chương mới',
                    seriesId: ch.seriesId || 'S01'
                  })
                })
              }
            } catch (e) {
              console.warn(`Failed to fetch manuscripts for chapter ${ch.id || ch.chapterId}:`, e)
            }
          })
        )

        const backendManuscripts: ManuscriptItem[] = allManuscripts.map(m => {
          const historyList: ManuscriptVersion[] = (m.history || []).map((h: any) => ({
            version: h.versionLabel || `v${h.versionNo}`,
            status: mapBackendManuscriptStatus(h.status),
            submittedAt: h.submittedAt || new Date().toISOString(),
            reviewedAt: h.reviewedAt || undefined,
            feedback: h.revisionNotes || h.feedback || undefined,
            revisionNumber: h.revisionCount || undefined,
            fileUrl: h.fileUrl || h.FileUrl || undefined
          }))

          if (historyList.length === 0) {
            historyList.push({
              version: m.versionLabel || `v${m.versionNo || 1}`,
              status: mapBackendManuscriptStatus(m.status),
              submittedAt: m.submittedAt || new Date().toISOString(),
              fileUrl: m.fileUrl || m.FileUrl || undefined
            })
          }

          return {
            id: m.manuscriptId || m.id,
            chapterId: m.chapterId,
            seriesId: m.seriesId || 'S01',
            seriesTitle: m.seriesTitle || seriesMap.get(m.seriesId) || 'Sakura Knights',
            chapterNumber: m.chapterNumber || 1,
            chapterTitle: m.chapterTitle || 'Chương mới',
            latestVersion: m.versionLabel || `v${m.versionNo || 1}`,
            status: mapBackendManuscriptStatus(m.status),
            progress: m.progress || 100,
            history: historyList,
            pages: ['Page 1', 'Page 2', 'Page 3', 'Page 4'],
            fileUrl: m.fileUrl || m.FileUrl || undefined
          }
        })

        memoryManuscripts = backendManuscripts
        return backendManuscripts
      }
    } catch (error) {
      console.error("syncManuscriptsFromBackend failed:", error)
    }
    return memoryManuscripts
  },

  async syncAnnotationsFromBackend(manuscriptId: string): Promise<Annotation[]> {
    try {
      const response = await fetchAPI<{ annotations: any[] } | any>(`/api/manuscripts/${manuscriptId}/annotations`)
      const rawAnns = response.annotations || (Array.isArray(response) ? response : [])
      if (Array.isArray(rawAnns)) {
        const backendAnns: Annotation[] = rawAnns.map(a => ({
          id: a.annotationId || a.id,
          manuscriptId: a.manuscriptId || manuscriptId,
          versionName: `v${a.versionNo || 1}`,
          text: a.content || a.text,
          createdAt: a.createdAt || new Date().toISOString()
        }))

        // Merge into memoryAnnotations
        memoryAnnotations = [
          ...memoryAnnotations.filter(la => la.manuscriptId !== manuscriptId),
          ...backendAnns
        ]
        return backendAnns
      }
    } catch (error) {
      console.error("syncAnnotationsFromBackend failed:", error)
    }
    return memoryAnnotations.filter(a => a.manuscriptId === manuscriptId)
  }
}
