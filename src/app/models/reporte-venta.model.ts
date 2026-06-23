export interface ReporteVentaDTO {
  idVenta: number;
  idCliente: number;
  nombreCliente: string;
  apellidosCliente?: string;
  emailCliente: string;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  igv?: number;
  total: number;
  tipoDocumento: string;
  comprobanteNumero?: number;
  fechaVenta: Date;
  estado: boolean;
}

export interface ResumenVentas {
  totalVentas: number;
  montoTotal: number;
  productosMasVendidos: ProductoVendido[];
  ventasPorCliente: VentasCliente[];
}

export interface ProductoVendido {
  idProducto: number;
  nombreProducto: string;
  cantidadVendida: number;
  montoTotal: number;
}

export interface VentasCliente {
  idCliente: number;
  nombreCliente: string;
  cantidadVentas: number;
  montoTotal: number;
}
