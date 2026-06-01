import { fetchWithFallback } from "./api";

export interface ProposalReview {
  id: string;
  seriesTitle: string;
  mangakaName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export const MOCK_REVIEWS: ProposalReview[] = [
  { id: 'R01', seriesTitle: 'Jujutsu Kaisen: Culling Game', mangakaName: 'Gege Akutami', status: 'PENDING', submittedAt: '2026-05-28T09:00:00Z' },
  { id: 'R02', seriesTitle: 'My Hero Academia: Final War', mangakaName: 'Kohei Horikoshi', status: 'PENDING', submittedAt: '2026-05-29T10:00:00Z' }
];

export const reviewService = {
  listReviews: async () => {
    return fetchWithFallback<ProposalReview[]>("/api/reviews", MOCK_REVIEWS);
  },
  submitReview: async (id: string, decision: 'APPROVED' | 'REJECTED', feedback: string) => {
    return fetchWithFallback<any>(`/api/reviews/${id}/decision`, { success: true, id, decision, feedback });
  }
};
