import { fetchAPI } from "./api";

export interface Chapter {
  id: string;
  seriesId: string;
  number: number;
  title: string;
  status: 'Draft' | 'In Progress' | 'Ready for Editor' | 'Published';
  totalPages: number;
  publicationDate: string;
  deadline: string;
  createdAt: string;
}

export const chapterService = {
  listChapters: async (): Promise<Chapter[]> => {
    const res = await fetchAPI<{ data: any[] }>("/api/chapters", { suppressGlobalError: true } as any);
    const list = res.data || res || [];
    return list.map((c: any) => ({
      id: c.chapterId || c.id,
      seriesId: c.seriesId,
      number: c.chapterNo || c.number,
      title: c.title,
      status: c.status,
      totalPages: c.totalPages,
      publicationDate: c.publicationDate?.split('T')[0] || '',
      deadline: c.submissionDeadline?.split('T')[0] || c.deadline?.split('T')[0] || '',
      createdAt: c.createdAt || new Date().toISOString()
    }));
  },

  getChaptersBySeries: async (seriesId: string): Promise<Chapter[]> => {
    const res = await fetchAPI<{ data: any[] }>(`/api/series/${seriesId}/chapters`, { suppressGlobalError: true } as any);
    const list = res.data || res || [];
    return list.map((c: any) => ({
      id: c.chapterId || c.id,
      seriesId: c.seriesId,
      number: c.chapterNo || c.number,
      title: c.title,
      status: c.status,
      totalPages: c.totalPages,
      publicationDate: c.publicationDate?.split('T')[0] || '',
      deadline: c.submissionDeadline?.split('T')[0] || c.deadline?.split('T')[0] || '',
      createdAt: c.createdAt || new Date().toISOString()
    }));
  },

  createChapter: async (chapterData: any) => {
    const payload = {
      seriesId: chapterData.seriesId,
      chapterNo: Number(chapterData.number || chapterData.chapterNo || 1),
      title: chapterData.title,
      totalPages: Number(chapterData.totalPages || 20),
      publicationDate: chapterData.publicationDate ? new Date(chapterData.publicationDate).toISOString() : new Date().toISOString(),
      submissionDeadline: chapterData.deadline ? new Date(chapterData.deadline).toISOString() : new Date().toISOString()
    };
    return fetchAPI<any>("/api/chapters", {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateChapter: async (id: string, chapterData: any) => {
    const payload = {
      title: chapterData.title,
      totalPages: chapterData.totalPages ? Number(chapterData.totalPages) : undefined,
      publicationDate: chapterData.publicationDate ? new Date(chapterData.publicationDate).toISOString() : undefined,
      submissionDeadline: chapterData.deadline ? new Date(chapterData.deadline).toISOString() : undefined,
      status: chapterData.status
    };
    return fetchAPI<any>(`/api/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      suppressGlobalError: true
    } as any);
  }
};
