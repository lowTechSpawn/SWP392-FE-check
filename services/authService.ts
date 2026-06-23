import { type User } from "@/types/user";
import { fetchAPI } from "./api";
import { tokenService } from "./tokenService";
const mapUserProfileToUser = (u: any): User => {
  if (!u) return {} as User;
  return {
    id: u.userId || u.id || '',
    name: u.displayName || u.name || '',
    email: u.email || '',
    role: u.roleName || u.role || 'Mangaka',
    avatarUrl: u.avatarUrl || undefined,
    username: u.userName || u.username || '',
    status: u.deletedAt === null ? 'Active' : 'Inactive',
    createdAt: u.createdAt,
    assignedEditorId: u.assignedEditorId || undefined,
    assignedEditorName: u.assignedEditorName || undefined
  };
};

export const authService = {
  login: async (credentials?: any) => {
    const response = await fetchAPI<{ data: { token: string; refreshToken: string; user: any }; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.data && response.data.token) {
      tokenService.setToken(response.data.token);
      if (response.data.refreshToken) {
        tokenService.setRefreshToken(response.data.refreshToken);
      }
      const mappedUser = mapUserProfileToUser(response.data.user);
      tokenService.setUserRole(mappedUser.role);
      tokenService.setUserInfo(mappedUser);
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
    const response = await fetchAPI<{ data: any; message: string }>('/api/auth/me');
    if (response.data) {
      const mappedUser = mapUserProfileToUser(response.data);
      tokenService.setUserRole(mappedUser.role);
      tokenService.setUserInfo(mappedUser);
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
    const response = await fetchAPI<{ data: any; message: string }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: profileData.displayName,
        email: profileData.email
      }),
    });

    const currentUser = tokenService.getUserInfo();
    if (currentUser) {
      tokenService.removeProfileOverrides();

      const mappedUser = mapUserProfileToUser(response.data || {
        ...currentUser,
        displayName: profileData.displayName,
        email: profileData.email
      });

      const updatedUser = {
        ...currentUser,
        ...mappedUser
      };
      tokenService.setUserInfo(updatedUser);

      return {
        data: updatedUser,
        message: response.message || "Cập nhật thông tin cá nhân thành công!"
      };
    } else {
      throw new Error("Không tìm thấy thông tin tài khoản hiện tại.");
    }
  },

  updateAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchAPI<{ data: any; message: string }>('/api/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
    if (response.data) {
      const mappedUser = mapUserProfileToUser(response.data);
      tokenService.setUserInfo(mappedUser);
      return {
        data: mappedUser,
        message: response.message || "Cập nhật ảnh đại diện thành công!"
      };
    } else {
      throw new Error("Không thể cập nhật ảnh đại diện từ phản hồi hệ thống.");
    }
  }
};
