export interface UsuarioDTO {
  idUsuario?: number;
  username: string;
  password?: string;
  nombreCompleto: string;
  rol: 'ADMIN' | 'VENDEDOR';
  activo: boolean;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}
