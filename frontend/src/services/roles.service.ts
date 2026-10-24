import api from '@/lib/api';

export interface Role {
  group_id:    number;
  description: string;
}

export interface ModulePermission {
  app_name:    string;
  priv_access: string | null;
  priv_insert: string | null;
  priv_delete: string | null;
  priv_update: string | null;
  priv_export: string | null;
  priv_print:  string | null;
}

export const rolesService = {
  findAll: async (): Promise<Role[]> => {
    const { data } = await api.get<Role[]>('/roles');
    return data;
  },

  create: async (description: string): Promise<Role> => {
    const { data } = await api.post<Role>('/roles', { description });
    return data;
  },

  update: async (id: number, description: string): Promise<Role> => {
    const { data } = await api.patch<Role>(`/roles/${id}`, { description });
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  getPermissions: async (id: number): Promise<ModulePermission[]> => {
    const { data } = await api.get<ModulePermission[]>(`/roles/${id}/permissions`);
    return data;
  },

  updatePermissions: async (id: number, permissions: ModulePermission[]): Promise<void> => {
    await api.put(`/roles/${id}/permissions`, { permissions });
  },
};
