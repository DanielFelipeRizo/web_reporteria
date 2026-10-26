export interface User {
  login:       string;
  name:        string | null;
  email:       string | null;
  usr_active:  string | null;  // 'Y' | 'N'
  priv_admin:  string | null;
  usr_bloqueado_hasta?: string | null;  // bloqueo temporal por intentos fallidos
  groupIds?:   number[];
  roles?:      { group_id: number; description: string }[];
}

export interface CreateUserDto {
  login:      string;
  pswd:       string;
  name?:      string;
  email?:     string;
}

export interface UpdateUserDto {
  name?:       string;
  email?:      string;
  usr_active?: string;
}
