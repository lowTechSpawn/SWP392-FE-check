import { fetchAPI } from "./api";
import { loadUsers, createUser } from "@/lib/users-store";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Mangaka' | 'Assistant' | 'TantouEditor' | 'EditorialBoard' | 'EditorInChief' | 'Admin';
  avatarUrl: string;
  assignedEditorId?: string;
  assignedEditorName?: string;
  assignedEditorEmail?: string;
  assignedMangakas?: { id: string; name: string; email: string }[];
}

export const authService = {
  login: async (credentials?: any) => {
    try {
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
    } catch (error) {
      console.warn("Backend login failed, attempting offline fallback...", error);
      // Offline fallback: check local storage users
      if (typeof window !== 'undefined') {
        const localUsers = loadUsers();
        const user = localUsers.find(u => u.email.toLowerCase() === credentials?.email?.toLowerCase());
        if (user) {
          localStorage.setItem('token', 'offline_mock_token');
          localStorage.setItem('user-role', user.role);
          localStorage.setItem('user-info', JSON.stringify(user));
          return { data: { token: 'offline_mock_token', user }, message: "Logged in offline successfully" };
        }
      }
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      return await fetchAPI<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.warn("Backend register failed, attempting offline fallback...", error);
      if (typeof window !== 'undefined') {
        try {
          const newUser = createUser({
            username: userData.username || userData.email.split('@')[0],
            name: userData.name,
            email: userData.email,
            role: userData.role
          });
          return { data: newUser, message: "Registered offline successfully" };
        } catch (err: any) {
          throw new Error(err.message || "Failed to register offline");
        }
      }
      throw error;
    }
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
      localStorage.setItem('user-role', response.data.role);
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
