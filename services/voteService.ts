import { fetchWithFallback } from "./api";

export interface VoteRecord {
  id: string;
  seriesId: string;
  votedAt: string;
}

export const voteService = {
  submitVote: async (seriesId: string) => {
    return fetchWithFallback<any>(`/api/votes/submit`, { success: true, seriesId });
  }
};
