import { Producto } from './producto.model';
import { ClienteDTO } from './cliente.model';
import { Proveedor } from './proveedor.model';

export interface Movimiento {
  idMovimiento?: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  producto?: Producto;
  cliente?: ClienteDTO;
  proveedor?: Proveedor;
  cantidad: number;
  precio: number;
  motivo: string;
  observaciones?: string;
  referencia?: string;
  usuarioMovimiento?: string;
  fecha?: string;
  descripcion?: string;
  tipoMovimiento?: 'ENTRADA' | 'SALIDA' | 'AJUSTE'; // Para compatibilidad
  fechaMovimiento?: string; // Para compatibilidad
}
