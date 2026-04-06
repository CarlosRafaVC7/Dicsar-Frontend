import { Producto } from './producto.model';
import { ClienteDTO } from './cliente.model';
import { Proveedor } from './proveedor.model';

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
