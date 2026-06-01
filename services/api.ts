// API service utilities
import { API_BASE_URL } from "@/lib/constants";

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Gọi API từ Backend. 
 * Nếu API chưa tồn tại (404), Backend sập, hoặc gặp lỗi kết nối,
 * hàm sẽ tự động trả về mockData để giao diện FE không bị lỗi và tiếp tục hoạt động.
 */
export async function fetchWithFallback<T>(
  endpoint: string,
  mockData: T,
  options?: RequestInit
): Promise<T> {
  try {
    const data = await fetchAPI<T>(endpoint, options);
    return data;
  } catch (error) {
    console.warn(
      `[API Fallback Warning] Gọi API tới "${endpoint}" thất bại. Sử dụng Mock Data thay thế.`,
      error
    );
    return mockData;
  }
}
