export interface CompraDTO {
  idVenta: number;
  idCliente: number;
  nombreCliente: string;
  emailCliente: string;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  tipoDocumento: string;
  fechaVenta: Date;
  estado: boolean;
}

export interface ResumenComprasCliente {
  idCliente: number;
  nombreCliente: string;
  totalCompras: number;
  montoTotalGastado: number;
  fechaUltimaCompra: Date;
  comprasUltimas30Dias: number;
  montoUltimos30Dias: number;
}

export interface DetalleVenta {
  idVenta: number;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fechaVenta: Date;
}
