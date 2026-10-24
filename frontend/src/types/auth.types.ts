// ── Tipos del payload del JWT ───────────────────────────────────────────────
export interface ModulePermissions {
  access:  boolean;
  insert?: boolean;
  update?: boolean;
  delete?: boolean;
  export?: boolean;
  print?:  boolean;
}

export interface UserPermissions {
  ventas?:                 { access: boolean; export: boolean; print: boolean };
  cierres?:                { access: boolean; export: boolean; print: boolean };
  reservas?:               { access: boolean; export: boolean };
  'seguridad.usuarios'?:   { access: boolean; insert: boolean; update: boolean; delete: boolean };
  'seguridad.roles'?:      { access: boolean; insert: boolean; update: boolean; delete: boolean };
  'seguridad.aplicaciones'?: { access: boolean };
  'seguridad.auditoria'?:  { access: boolean; export: boolean };
  [key: string]: ModulePermissions | undefined;
}

export interface AuthUser {
  sub:         string;
  username:    string;
  email:       string;
  isAdmin:     boolean;
  permissions: UserPermissions;
}

export interface LoginResponse {
  access_token: string;
  user:         AuthUser;
}
