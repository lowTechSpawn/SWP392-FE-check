import { fetchAPI } from "./api";
import { tokenService } from "./tokenService";

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
    const response = await fetchAPI<{ data: { token: string; refreshToken: string; user: User }; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.data && response.data.token) {
      tokenService.setToken(response.data.token);
      if (response.data.refreshToken) {
        tokenService.setRefreshToken(response.data.refreshToken);
      }
      // Fallback avatarUrl if not provided by BE
      if (response.data.user && !response.data.user.avatarUrl) {
        const id = response.data.user.id || "default";
        const code = id.charCodeAt(id.length - 1) || 0;
        response.data.user.avatarUrl = `https://xsgames.co/randomusers/assets/avatars/${code % 2 === 0 ? 'male' : 'female'}/${code % 50}.jpg`;
      }
      tokenService.setUserRole(response.data.user.role);
      tokenService.setUserInfo(response.data.user);
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
    tokenService.clearAll();
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
      tokenService.setUserRole(response.data.role);
      tokenService.setUserInfo(response.data);
    }
    return tokenService.getUserInfo();
  },

  refreshToken: async () => {
    const response = await tokenService.refreshAccessToken();
    return { data: { token: response } };
  },

  changePassword: async (passwordData: any) => {
    return fetchAPI<any>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  updateProfile: async (profileData: { displayName: string; email: string }) => {
    tokenService.setProfileOverrides(profileData);
    const currentUser = tokenService.getUserInfo();
    if (currentUser) {
      tokenService.setUserInfo(currentUser);
      return {
        data: currentUser,
        message: "Cập nhật thông tin cá nhân thành công!"
      };
    } else {
      throw new Error("Không tìm thấy thông tin tài khoản hiện tại.");
    }
  }
};
