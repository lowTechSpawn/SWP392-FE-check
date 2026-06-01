import { fetchWithFallback } from "./api";

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

export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'CH01',
    seriesId: 'S01',
    number: 1,
    title: 'The Resonance of Blades',
    status: 'Published',
    totalPages: 19,
    publicationDate: '2026-05-15',
    deadline: '2026-05-01',
    createdAt: '2026-04-20T10:00:00Z',
  },
  {
    id: 'CH02',
    seriesId: 'S01',
    number: 2,
    title: 'Cherry Blossom Magitech',
    status: 'In Progress',
    totalPages: 18,
    publicationDate: '2026-06-15',
    deadline: '2026-06-01',
    createdAt: '2026-05-15T09:00:00Z',
  },
  {
    id: 'CH03',
    seriesId: 'S02',
    number: 1,
    title: 'The Spy\'s Family',
    status: 'Published',
    totalPages: 24,
    publicationDate: '2026-05-10',
    deadline: '2026-04-26',
    createdAt: '2026-04-10T08:00:00Z',
  },
  {
    id: 'CH04',
    seriesId: 'S05',
    number: 1044,
    title: 'Warrior of Liberation',
    status: 'Published',
    totalPages: 17,
    publicationDate: '2026-05-01',
    deadline: '2026-04-17',
    createdAt: '2026-04-01T07:00:00Z',
  }
];

export const chapterService = {
  listChapters: async () => {
    return fetchWithFallback<Chapter[]>("/api/chapters", MOCK_CHAPTERS);
  },
  getChaptersBySeries: async (seriesId: string) => {
    const list = MOCK_CHAPTERS.filter(c => c.seriesId === seriesId);
    return fetchWithFallback<Chapter[]>(`/api/chapters/series/${seriesId}`, list);
  },
  createChapter: async (chapterData: any) => {
    return fetchWithFallback<any>("/api/chapters", { success: true, data: chapterData });
  },
  updateChapter: async (id: string, chapterData: any) => {
    return fetchWithFallback<any>(`/api/chapters/${id}`, { success: true, data: chapterData });
  }
};
