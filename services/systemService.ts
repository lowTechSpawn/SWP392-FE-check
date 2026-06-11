import { fetchAPI } from "./api";

export interface RoleResponse {
  roleId: string;
  roleName: string;
}

export interface GenreResponse {
  genreId: string;
  title: string;
  deletedAt: string | null;
}

export const systemService = {
  // Roles CRUD
  getRoles: async (): Promise<RoleResponse[]> => {
    const res = await fetchAPI<{ data: RoleResponse[]; message: string }>("/api/roles");
    return res.data || [];
  },

  createRole: async (roleName: string): Promise<RoleResponse> => {
    const res = await fetchAPI<{ data: RoleResponse; message: string }>("/api/roles", {
      method: "POST",
      body: JSON.stringify({ roleName }),
    });
    return res.data;
  },

  updateRole: async (roleId: string, roleName: string): Promise<RoleResponse> => {
    const res = await fetchAPI<{ data: RoleResponse; message: string }>(`/api/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify({ roleName }),
    });
    return res.data;
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await fetchAPI<{ message: string }>(`/api/roles/${roleId}/soft-delete`, {
      method: "DELETE",
    });
  },

  // Genres CRUD
  getGenres: async (): Promise<GenreResponse[]> => {
    const res = await fetchAPI<{ data: GenreResponse[]; message: string }>("/api/genres");
    return res.data || [];
  },

  createGenre: async (title: string): Promise<GenreResponse> => {
    const res = await fetchAPI<{ data: GenreResponse; message: string }>("/api/genres", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    return res.data;
  },

  updateGenre: async (genreId: string, title: string): Promise<GenreResponse> => {
    const res = await fetchAPI<{ data: GenreResponse; message: string }>(`/api/genres/${genreId}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    });
    return res.data;
  },

  deleteGenre: async (genreId: string): Promise<void> => {
    await fetchAPI<{ message: string }>(`/api/genres/${genreId}/soft-delete`, {
      method: "DELETE",
    });
  },
};
