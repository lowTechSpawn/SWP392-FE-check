import { fetchWithFallback } from "./api";

export interface TaskItem {
  id: string;
  chapterId: string;
  type: string;
  pages: string;
  description: string;
  assistantName: string;
  status: 'Pending' | 'In-Progress' | 'Submitted' | 'Approved' | 'Rejected';
}

export const MOCK_TASKS: TaskItem[] = [
  { id: 'T01', chapterId: 'CH02', type: 'Line Art', pages: '1-3', description: 'Sketch and ink the opening battle', assistantName: 'Sato Takashi', status: 'Approved' },
  { id: 'T02', chapterId: 'CH02', type: 'Coloring', pages: '4-8', description: 'Apply sunset glow colors', assistantName: 'Suzuki Mei', status: 'Submitted' }
];

export const taskService = {
  listTasks: async () => {
    return fetchWithFallback<TaskItem[]>("/api/tasks", MOCK_TASKS);
  },
  assignTask: async (data: any) => {
    return fetchWithFallback<any>("/api/tasks/assign", { success: true, data });
  }
};
