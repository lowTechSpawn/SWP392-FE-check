// API service utilities
import { API_BASE_URL } from "@/lib/constants";
import { tokenService } from "./tokenService";

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = tokenService.getToken();

  const isFormData = typeof window !== 'undefined' && options?.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options?.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (endpoint.includes("/api/auth/login") || endpoint.includes("/api/auth/refresh")) {
        if (endpoint.includes("/api/auth/login")) {
          throw new Error("Tài khoản hoặc mật khẩu không chính xác.");
        }
        tokenService.clearAll();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      // Try to refresh token and retry the request
      try {
        const newToken = await tokenService.getOrTriggerRefresh();

        const retryHeaders: HeadersInit = {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...options?.headers,
          "Authorization": `Bearer ${newToken}`,
        };

        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        if (!retryResponse.ok) {
          throw new Error(`API error after retry: ${retryResponse.statusText || retryResponse.status}`);
        }

        return retryResponse.json();
      } catch (refreshError) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    }

    let errorMessage = `API error: ${response.statusText || response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch { }
    throw new Error(errorMessage);
  }

  return response.json();
}
