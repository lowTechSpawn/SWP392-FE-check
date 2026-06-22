import { fetchAPI } from '@/services/api'
import type { ManuscriptItem, Annotation, ManuscriptVersion } from '@/types/manuscript'

let memoryManuscripts: ManuscriptItem[] = []
let memoryAnnotations: Annotation[] = []

const mapBackendManuscriptStatus = (status: string): 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED' => {
  if (!status) return 'SUBMITTED'
  const clean = status.trim().toUpperCase()
  if (clean === 'APPROVED') return 'APPROVED'
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
    newStatus: 'APPROVED' | 'REVISION REQUIRED',
    feedbackText: string
  ): Promise<boolean> {
    const idx = memoryManuscripts.findIndex(m => m.id === id)
    if (idx !== -1) {
      memoryManuscripts[idx].status = newStatus
    }

    const payload = {
      status: newStatus === 'APPROVED' ? 'Approved' : 'Rejected',
      feedback: feedbackText || (newStatus === 'APPROVED' ? 'Bản vẽ đã được phê duyệt.' : 'Cần sửa đổi bản vẽ.')
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
            revisionNumber: h.revisionCount || undefined
          }))

          if (historyList.length === 0) {
            historyList.push({
              version: m.versionLabel || `v${m.versionNo || 1}`,
              status: mapBackendManuscriptStatus(m.status),
              submittedAt: m.submittedAt || new Date().toISOString(),
            })
          }

          return {
            id: m.manuscriptId || m.id,
            seriesId: m.seriesId || 'S01',
            seriesTitle: m.seriesTitle || 'Sakura Knights',
            chapterNumber: m.chapterNumber || 1,
            chapterTitle: m.chapterTitle || 'Chương mới',
            latestVersion: m.versionLabel || `v${m.versionNo || 1}`,
            status: mapBackendManuscriptStatus(m.status),
            progress: m.progress || 100,
            history: historyList,
            pages: ['Page 1', 'Page 2', 'Page 3', 'Page 4']
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
