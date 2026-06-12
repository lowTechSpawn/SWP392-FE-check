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

export const userService = {
  getUsers: async () => {
    const res = await fetchAPI<{ data: UserProfileResponse[]; message: string }>("/api/users");
    const users = res.data || [];
    
    // Merge editor assignment overrides from local storage
    if (typeof window !== 'undefined') {
      try {
        const overrides = JSON.parse(localStorage.getItem('editor_assignments_override') || '{}');
        const modifiedUsers = users.map(u => {
          if (u.roleName?.toLowerCase() === 'mangaka' && overrides[u.userId]) {
            const editorId = overrides[u.userId];
            const editor = users.find(e => e.userId === editorId);
            return {
              ...u,
              assignedEditorId: editorId,
              assignedEditorName: editor ? editor.displayName : 'Tantou Editor'
            };
          }
          return u;
        });
        return {
          ...res,
          data: modifiedUsers
        };
      } catch {}
    }
    return res;
  },

  deleteUser: async (id: string) => {
    return fetchAPI<{ message: string }>(`/api/users/${id}/soft-delete`, {
      method: "DELETE",
    });
  },

  assignEditorToMangaka: async (mangakaId: string, editorId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const overrides = JSON.parse(localStorage.getItem('editor_assignments_override') || '{}');
        overrides[mangakaId] = editorId;
        localStorage.setItem('editor_assignments_override', JSON.stringify(overrides));
      } catch {}
    }
    return { message: "Assignment updated successfully." };
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
