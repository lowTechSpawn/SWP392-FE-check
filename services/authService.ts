import { type User } from "@/types/user";
import { fetchAPI } from "./api";
import { tokenService } from "./tokenService";
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
    const response = await fetchAPI<{ data: { displayName: string; email: string }; message: string }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: profileData.displayName,
        email: profileData.email
      }),
    });

    const currentUser = tokenService.getUserInfo();
    if (currentUser) {
      // Clear profile overrides to ensure clean state
      tokenService.removeProfileOverrides();

      const updatedUser = {
        ...currentUser,
        name: response.data?.displayName || profileData.displayName,
        email: response.data?.email || profileData.email,
      };
      tokenService.setUserInfo(updatedUser);

      return {
        data: updatedUser,
        message: response.message || "Cập nhật thông tin cá nhân thành công!"
      };
    } else {
      throw new Error("Không tìm thấy thông tin tài khoản hiện tại.");
    }
  }
};
