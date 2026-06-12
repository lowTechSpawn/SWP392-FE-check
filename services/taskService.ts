import { fetchAPI } from "./api";

export interface TaskItem {
  id: string;
  chapterId: string;
  type: string;
  pages: string;
  description: string;
  assistantName: string;
  status: 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected';
}

export const taskService = {
  listTasks: async () => {
    return fetchAPI<any>("/api/page-tasks");
  },
  assignTask: async (data: any) => {
    return fetchAPI<any>("/api/page-tasks", {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
