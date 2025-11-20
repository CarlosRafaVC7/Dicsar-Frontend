export interface Venta {
  idVenta?: number;
  cliente: {
    idCliente: number;
    nombre?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    estado?: boolean;
    fechaCreacion?: string;
    fechaActualizacion?: string;
  };
  producto: {
    idProducto: number;
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    precioCompra?: number;
    stockActual?: number;
    stockMinimo?: number;
    estado?: boolean;
  };
  cantidad: number;
  precioUnitario: number;
  total: number;
  tipoDocumento: string; // 'Factura' o 'Boleta'
  fechaVenta?: string;
  estado?: boolean;
}

export interface ProductoMasVendido {
  nombre: string;
  cantidadVendida: number;
  totalVentas: number;
}

export interface ClienteTopCompras {
  nombre: string;
  cantidadCompras: number;
  totalCompras: number;
}
