import { API_BASE_URL } from "@/lib/constants";

let refreshPromise: Promise<string> | null = null;

export const tokenService = {
  getToken: () => {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  },
  setToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('token', token);
  },
  removeToken: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  },

  getRefreshToken: () => {
    return typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  },
  setRefreshToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('refreshToken', token);
  },
  removeRefreshToken: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('refreshToken');
  },

  getUserRole: () => {
    return typeof window !== 'undefined' ? localStorage.getItem('user-role') : null;
  },
  setUserRole: (role: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('user-role', role);
  },
  removeUserRole: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('user-role');
  },

  getUserInfo: () => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('user-info');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Merge overrides if present
      const overrides = tokenService.getProfileOverrides();
      if (overrides) {
        if (overrides.displayName) parsed.name = overrides.displayName;
        if (overrides.email) parsed.email = overrides.email;
      }
      return parsed;
    } catch {
      return null;
    }
  },
  setUserInfo: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-info', JSON.stringify(user));
    }
  },
  removeUserInfo: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('user-info');
  },

  getProfileOverrides: () => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('profile_overrides');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },
  setProfileOverrides: (overrides: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('profile_overrides', JSON.stringify(overrides));
    }
  },
  removeProfileOverrides: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('profile_overrides');
  },

  clearAll: () => {
    tokenService.removeToken();
    tokenService.removeRefreshToken();
    tokenService.removeUserRole();
    tokenService.removeUserInfo();
    tokenService.removeProfileOverrides();
  },

  refreshAccessToken: async (): Promise<string> => {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const url = `${API_BASE_URL}/api/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      tokenService.clearAll();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error("Refresh token expired");
    }

    const result = await response.json();
    if (result.data && result.data.token) {
      tokenService.setToken(result.data.token);
      if (result.data.refreshToken) {
        tokenService.setRefreshToken(result.data.refreshToken);
      }
      return result.data.token;
    }
    throw new Error("Failed to refresh token");
  },

  getOrTriggerRefresh: async (): Promise<string> => {
    if (!refreshPromise) {
      refreshPromise = tokenService.refreshAccessToken().then((newToken) => {
        refreshPromise = null;
        return newToken;
      }).catch((err) => {
        refreshPromise = null;
        throw err;
      });
    }
    return refreshPromise;
  }
};
