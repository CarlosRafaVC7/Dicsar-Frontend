export interface HistorialPrecio {
  idHistorial?: number;
  precioAnterior: number;
  precioNuevo: number;
  fechaCambio: string;
  usuario?: {
    idUsuario?: number;
    username: string;
    nombreCompleto: string;
  };
  producto?: {
    idProducto?: number;
    nombre?: string;
    codigo?: string;
  };
}

// Interface para el request de filtros (opcional)
export interface FiltroHistorialPrecio {
  productoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}