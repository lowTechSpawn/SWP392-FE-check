import { fetchAPI } from "./api";

/**
 * LƯU Ý VỀ CHIỀU QUAN HỆ TRONG DATABASE (USER ASSIGNMENTS):
 * 1. Trong database, quan hệ UserAssignment được lưu dưới dạng:
 *    - FromUserId: Người giám sát / người giao việc (ví dụ: Tantou Editor hoặc Mangaka).
 *    - ToUserId: Đối tượng được phân công (ví dụ: Mangaka hoặc Assistant).
 * 2. Lưu ý về API Endpoints trên Backend:
 *    - `/api/user-assignments/from-me` (dành cho Mangaka): Trả về danh sách Editor phụ trách Mangaka đó 
 *      (Thực tế câu SQL bên dưới truy vấn `ToUserId == mangakaId`, nghĩa là Mangaka là ToUser chứ không phải FromUser).
 *    - `/api/user-assignments/to-me` (dành cho Tantou Editor): Trả về danh sách Mangaka mà Editor phụ trách
 *      (Thực tế câu SQL bên dưới truy vấn `FromUserId == editorId`, nghĩa là Editor là FromUser chứ không phải ToUser).
 */
export interface UserProfileResponse {
  userId: string;
  userName: string;
  email: string;
  displayName: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
  assignedEditorId?: string;
  assignedEditorName?: string;
}

export interface UserAssignmentResponse {
  assignmentId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  toUserEmail?: string;
  assignedAt: string;
  unassignedAt?: string | null;
}

export const userService = {
  getAssistants: async () => {
    const res = await fetchAPI<{ data: UserProfileResponse[]; message: string }>("/api/users/assistants");
    return res;
  },
  getUsers: async () => {
    const res = await fetchAPI<{ data: UserProfileResponse[]; message: string }>("/api/users");
    return res;
  },

  deleteUser: async (id: string) => {
    return fetchAPI<{ message: string }>(`/api/users/${id}/soft-delete`, {
      method: "DELETE",
    });
  },

  updateUser: async (id: string, updateData: { userName?: string; email?: string; displayName?: string; roleId?: string; newPassword?: string }) => {
    return fetchAPI<{ data: any; message: string }>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  getMyAssignment: async (userId?: string): Promise<UserAssignmentResponse[]> => {
    const endpoint = userId
      ? `/api/user-assignments/${encodeURIComponent(userId)}`
      : "/api/user-assignments/from-me";
    const res = await fetchAPI<{ data: UserAssignmentResponse | UserAssignmentResponse[]; message: string }>(endpoint);
    if (!res.data) return [];
    return Array.isArray(res.data) ? res.data : [res.data];
  },

  assignEditorToMangaka: async (mangakaId: string, editorId: string, assignmentId: string) => {
    return fetchAPI<{ data?: any; message: string }>("/api/reassign", {
      method: "POST",
      body: JSON.stringify({ assignmentId, mangakaId, fromUserId: editorId }),
    });
  },

  getMyMangakas: async () => {
    // Call the existing backend UserAssignments to-me endpoint
    const res = await fetchAPI<{ data: any[]; message: string }>("/api/user-assignments/to-me");

    // Map UserAssignmentResponse structure to UserProfileResponse structure
    const mappedData = (res.data || []).map(item => ({
      userId: item.toUserId,
      userName: item.toUserName,
      displayName: item.toUserName,
      email: item.toUserEmail || "",
      roleName: 'Mangaka',
      isActive: true,
      createdAt: item.assignedAt,
      lastLoginAt: null,
      deletedAt: null,
      assignedEditorId: item.fromUserId,
      assignedEditorName: item.fromUserName
    }));

    return {
      data: mappedData,
      message: res.message
    };
  },
};
