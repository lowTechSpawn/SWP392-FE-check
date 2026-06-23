import { type Role } from '@/lib/roles';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  username?: string;
  status?: 'Active' | 'Inactive';
  editorId?: string;
  assignedEditorId?: string;
  assignedEditorName?: string;
  assignedEditorEmail?: string;
  assignedMangakas?: { id: string; name: string; email: string }[];
  createdAt?: string;
}
