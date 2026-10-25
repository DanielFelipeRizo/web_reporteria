import api from '@/lib/api';

export interface AuditLog {
  id:            number;
  inserted_date: string;
  username:      string;
  application:   string;
  action:        string;
  ip_user:       string;
  creator:       string;
  description:   string;
}

export interface AuditFilters {
  username?:    string;
  application?: string;
  action?:      string;
  from?:        string;
  to?:          string;
  page?:        number;
  limit?:       number;
}

export interface AuditResponse {
  data: AuditLog[];
  meta: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

export interface AuditUser {
  login: string;
  name:  string | null;
}

export const auditService = {
  /** Usuarios con registros de auditoría (incluye eliminados), para el filtro */
  findUsers: async (): Promise<AuditUser[]> => {
    const { data } = await api.get<AuditUser[]>('/audit/users');
    return data;
  },

  findAll: async (filters: AuditFilters): Promise<AuditResponse> => {
    // Limpiar campos vacíos
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null && v !== '')
    );
    const { data } = await api.get<AuditResponse>('/audit', { params });
    return data;
  },
};
