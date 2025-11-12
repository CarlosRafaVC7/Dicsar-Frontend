export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  nombreCompleto: string;
  rol: 'ADMIN' | 'VENDEDOR';
}

export interface Usuario {
  idUsuario?: number;
  username: string;
  password?: string;
  nombreCompleto: string;
  rol: 'ADMIN' | 'VENDEDOR';
  activo?: boolean;
}
