import { fetchAPI } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board' | 'Editor-in-Chief';
  avatarUrl: string;
  assignedEditorId?: string;
  assignedEditorName?: string;
  assignedEditorEmail?: string;
  assignedMangakas?: { id: string; name: string; email: string }[];
}

export const authService = {
  login: async (credentials?: any) => {
    const response = await fetchAPI<{ data: { token: string; refreshToken: string; user: User }; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      // Fallback avatarUrl if not provided by BE
      if (response.data.user && !response.data.user.avatarUrl) {
        const id = response.data.user.id || "default";
        const code = id.charCodeAt(id.length - 1) || 0;
        response.data.user.avatarUrl = `https://xsgames.co/randomusers/assets/avatars/${code % 2 === 0 ? 'male' : 'female'}/${code % 50}.jpg`;
      }
      localStorage.setItem('user-role', response.data.user.role);
      localStorage.setItem('user-info', JSON.stringify(response.data.user));
    }
    return response;
  },

  register: async (userData: any) => {
    return fetchAPI<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user-role');
    localStorage.removeItem('user-info');
    try {
      await fetchAPI<any>('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn("Logout endpoint failed on backend, local session cleared", err);
    }
  },


  getCurrentUser: async () => {
    const response = await fetchAPI<{ data: User; message: string }>('/api/auth/me');
    if (response.data && !response.data.avatarUrl) {
      const id = response.data.id || "default";
      const code = id.charCodeAt(id.length - 1) || 0;
      response.data.avatarUrl = `https://xsgames.co/randomusers/assets/avatars/${code % 2 === 0 ? 'male' : 'female'}/${code % 50}.jpg`;
    }
    if (response.data) {
      localStorage.setItem('user-info', JSON.stringify(response.data));
    }
    return response.data;
  },

  refreshToken: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      throw new Error("No refresh token found");
    }
    const response = await fetchAPI<{ data: { token: string; refreshToken: string }; message: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    return response;
  },

  changePassword: async (passwordData: any) => {
    return fetchAPI<any>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }
};
