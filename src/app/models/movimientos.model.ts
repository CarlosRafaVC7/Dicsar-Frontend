import { Producto } from './producto.model';

export interface Movimiento {
  idMovimiento?: number;
  producto: Producto;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  descripcion?: string;
  usuario?: {
    idUsuario?: number;
    username: string;
    nombreCompleto: string;
  };
  fechaMovimiento?: string;
}
