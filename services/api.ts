// API service utilities
import { API_BASE_URL } from "@/lib/constants";

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

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
      if (endpoint.includes("/api/auth/login")) {
        throw new Error("Tài khoản hoặc mật khẩu không chính xác.");
      } else {
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

