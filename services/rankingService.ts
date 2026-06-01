import { fetchWithFallback } from "./api";

export interface RankingItem {
  id: string;
  seriesTitle: string;
  genre: string;
  votes: number;
  readers: number;
  score: number;
  status: string;
  rank: number;
}

export const MOCK_RANKING: RankingItem[] = [
  { id: 'S01', seriesTitle: 'Demon Slayer: Chronicles', genre: 'Action, Fantasy', votes: 12000, readers: 15000, score: 82.08, status: 'TOP 3', rank: 1 },
  { id: 'S05', seriesTitle: 'One Piece: Wano Arc', genre: 'Action, Adventure', votes: 11800, readers: 14900, score: 79.19, status: 'TOP 3', rank: 2 },
  { id: 'S02', seriesTitle: 'Spy x Family: Secret Mission', genre: 'Action, Comedy', votes: 11000, readers: 14000, score: 78.57, status: 'TOP 3', rank: 3 },
  { id: 'S03', seriesTitle: 'Chainsaw Man: Part 2', genre: 'Action, Horror', votes: 9800, readers: 13000, score: 75.38, status: '', rank: 4 },
  { id: 'S04', seriesTitle: 'Frieren: Beyond Journey\'s End', genre: 'Fantasy, Drama', votes: 8500, readers: 11000, score: 77.27, status: '', rank: 5 }
];

export const rankingService = {
  getRankingList: async () => {
    return fetchWithFallback<RankingItem[]>("/api/ranking", MOCK_RANKING);
  },
  confirmRanking: async (quarter: string) => {
    return fetchWithFallback<any>("/api/ranking/confirm", { success: true, quarter });
  }
};
