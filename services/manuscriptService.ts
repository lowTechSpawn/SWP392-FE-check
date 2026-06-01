import { fetchWithFallback } from "./api";

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

export const MOCK_MANUSCRIPTS: ManuscriptItem[] = [
  {
    id: 'M01',
    seriesId: 'S01',
    seriesTitle: 'Demon Slayer: Chronicles',
    chapterNumber: 15,
    chapterTitle: 'Iron Will',
    latestVersion: 'v1',
    status: 'APPROVED',
    progress: 100,
  },
  {
    id: 'M02',
    seriesId: 'S02',
    seriesTitle: 'Spy x Family: Secret Mission',
    chapterNumber: 22,
    chapterTitle: 'Shadows of the Past',
    latestVersion: 'v1',
    status: 'APPROVED',
    progress: 100,
  },
  {
    id: 'M03',
    seriesId: 'S03',
    seriesTitle: 'Chainsaw Man: Part 2',
    chapterNumber: 9,
    chapterTitle: 'Final Hack',
    latestVersion: 'v1',
    status: 'SUBMITTED',
    progress: 0,
  }
];

export const manuscriptService = {
  listManuscripts: async () => {
    return fetchWithFallback<ManuscriptItem[]>("/api/manuscripts", MOCK_MANUSCRIPTS);
  },
  getManuscriptById: async (id: string) => {
    const found = MOCK_MANUSCRIPTS.find(m => m.id === id) || MOCK_MANUSCRIPTS[0];
    return fetchWithFallback<ManuscriptItem>(`/api/manuscripts/${id}`, found);
  },
  submitManuscript: async (data: any) => {
    return fetchWithFallback<any>("/api/manuscripts", { success: true, data });
  }
};
