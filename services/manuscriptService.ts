import { fetchAPI } from "./api";

export interface ManuscriptItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  latestVersion: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REVISION REQUIRED';
  progress: number;
}

export const manuscriptService = {
  getManuscriptById: async (id: string): Promise<ManuscriptItem> => {
    const res = await fetchAPI<{ data: any }>(`/api/manuscripts/${id}`);
    const m = res.data || res;
    return {
      id: m.manuscriptId || m.id,
      seriesId: m.seriesId || '',
      seriesTitle: m.seriesTitle || '',
      chapterNumber: m.chapterNo || m.chapterNumber || 1,
      chapterTitle: m.chapterTitle || '',
      latestVersion: m.versionLabel || `v${m.versionNo || 1}`,
      status: m.status === 'Approved' ? 'APPROVED' : m.status === 'RevisionRequired' || m.status === 'Rejected' ? 'REVISION REQUIRED' : 'SUBMITTED',
      progress: m.progress || 100
    };
  },

  submitManuscript: async (data: { chapterId: string; fileUrl: string; notes?: string }) => {
    const payload = {
      chapterId: data.chapterId,
      fileUrl: data.fileUrl,
      notes: data.notes || "Bản thảo mới nộp"
    };
    return fetchAPI<any>("/api/manuscripts", {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
