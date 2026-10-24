import api from '@/lib/api';
import { User, CreateUserDto, UpdateUserDto } from '@/types/users.types';

export const usersService = {
  findAll: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users');
    return data;
  },

  create: async (dto: CreateUserDto): Promise<User> => {
    const { data } = await api.post<User>('/users', dto);
    return data;
  },

  update: async (login: string, dto: UpdateUserDto): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${login}`, dto);
    return data;
  },

  remove: async (login: string): Promise<void> => {
    await api.delete(`/users/${login}`);
  },

  assignRoles: async (login: string, groupIds: number[]): Promise<void> => {
    await api.put(`/users/${login}/roles`, { groupIds });
  },

  changePassword: async (login: string, newPassword: string): Promise<void> => {
    // El admin puede cambiar la contraseña de cualquier usuario
    await api.patch(`/users/${login}/password`, { newPassword });
  },
};
