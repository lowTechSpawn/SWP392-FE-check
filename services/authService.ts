import { fetchWithFallback } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board' | 'Editor-in-Chief';
  avatarUrl: string;
}

export const MOCK_USER: User = {
  id: 'U01',
  name: 'Takeshi Obata',
  email: 'obata@mangaflow.com',
  role: 'Tantou Editor',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
};

export const authService = {
  login: async (credentials?: any) => {
    return fetchWithFallback<any>("/api/auth/login", { success: true, token: "mock_token", user: MOCK_USER });
  },
  logout: async () => {
    return fetchWithFallback<any>("/api/auth/logout", { success: true });
  },
  getCurrentUser: async () => {
    return fetchWithFallback<User>("/api/auth/me", MOCK_USER);
  }
};
