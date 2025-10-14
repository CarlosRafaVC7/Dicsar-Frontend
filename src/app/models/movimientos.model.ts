import { Producto } from './producto.model';

export interface Movimiento {
  idMovimiento?: number;
  producto: Producto;  // El producto asociado
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  descripcion?: string;
  usuarioMovimiento?: string;
  fechaMovimiento?: string;
}
