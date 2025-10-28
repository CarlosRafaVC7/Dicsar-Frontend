export interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion: string;
  codigo: string;
  precioBase: number;
  stockActual: number;
  stockMinimo: number;
  categoriaId: number;
  unidadMedidaId: number;
  proveedorId?: number | null;
  precioCompra: number;
  fechaVencimiento: string; 
  estado?: boolean;
}
