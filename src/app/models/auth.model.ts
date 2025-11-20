export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  jwt: string;
  username: string;
  nombreCompleto: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'USUARIO' | 'CLIENTE';
  token?: string; // para compatibilidad hacia atrás
}

export interface Usuario {
  idUsuario?: number;
  username: string;
  password?: string;
  nombreCompleto: string;
  rol: 'ADMIN' | 'VENDEDOR';
  activo?: boolean;
}
