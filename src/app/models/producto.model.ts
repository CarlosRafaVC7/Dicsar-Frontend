import { Categoria } from './categoria.model';
import { UnidadMed } from './unidad-medida.model';
import { Proveedor } from './proveedor.model';

export interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion: string;
  codigo: string;
  precio?: number;
  precioBase?: number;
  stockActual: number;
  stockMinimo: number;
  categoriaId?: number;
  unidadMedidaId?: number;
  proveedorId?: number | null;
  precioCompra?: number;
  fechaVencimiento?: string; 
  estado?: boolean;
  
  // Campos del DTO de respuesta (nombres directos)
  categoriaNombre?: string;
  unidadMedidaNombre?: string;
  unidadMedidaAbreviatura?: string;
  proveedorNombre?: string;
  
  // Relaciones completas (legacy - mantener por compatibilidad)
  categoria?: Categoria;
  unidadMedida?: UnidadMed;
  proveedor?: Proveedor;
}
