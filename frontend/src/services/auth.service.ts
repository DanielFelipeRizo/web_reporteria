import api from '@/lib/api';
import { LoginResponse } from '@/types/auth.types';

export const authService = {
  login: async (login: string, pswd: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { login, pswd });
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};
