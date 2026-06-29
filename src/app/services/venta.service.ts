import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../models/paginated-response.model';
import { ReporteVentaDTO } from '../models/reporte-venta.model';

export interface Venta {
  idVenta?: number;
  cliente: { idCliente: number };
  producto: { idProducto: number };
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  igv?: number;
  total: number;
  tipoDocumento: string;
  comprobanteNumero?: number;
  fechaVenta?: string;
  estado?: boolean;
}

export interface VentaResponse extends Venta {
  idVenta: number;
  cliente: any;
  producto: any;
  fechaVenta: string;
}

export interface ProductoMasVendido {
  nombre: string;
  cantidad: number;
  total: number;
}

export interface ClienteTopCompras {
  nombre: string;
  cantidadCompras: number;
  totalCompras: number;
}

export interface TotalMensual {
  mes: string;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = `${environment.apiBaseUrl}/reportes-ventas`;

  constructor(private http: HttpClient) { }

  crear(venta: Venta): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.apiUrl, venta);
  }

  listar(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.apiUrl).pipe(
      map(ventas => ventas.map(venta => this.normalizarVenta(venta as any)))
    );
  }

  listarPaginado(pageNumber: number = 0, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PaginatedResponse<ReporteVentaDTO>>(`${this.apiUrl}/pagina`, { params }).pipe(
      map((response: PaginatedResponse<ReporteVentaDTO>) => ({
        ...response,
        content: response.content.map(venta => this.normalizarDTO(venta))
      }))
    );
  }

  obtenerPorCliente(idCliente: number, pageNumber: number = 0, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<ReporteVentaDTO>>(`${this.apiUrl}/cliente/${idCliente}`, { params }).pipe(
      map((response: PaginatedResponse<ReporteVentaDTO>) => ({
        ...response,
        content: response.content.map(venta => this.normalizarDTO(venta))
      }))
    );
  }

  obtenerProductosMasVendidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos-mas-vendidos`).pipe(
      map(datos => Array.isArray(datos) ? datos.map(item => this.normalizarProductoMasVendido(item)) : [])
    );
  }

  obtenerClientesTopCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas-por-cliente`).pipe(
      map(datos => Array.isArray(datos) ? datos.map(item => this.normalizarClienteTopCompras(item)) : [])
    );
  }

  obtenerTotalesMensuales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/totales-mensuales`).pipe(
      map(datos => Array.isArray(datos) ? datos.map(item => this.normalizarTotalMensual(item)) : [])
    );
  }

  private normalizarProductoMasVendido(item: any): any {
    if (!Array.isArray(item)) return item;
    return {
      idProducto: item[0],
      nombreProducto: item[1],
      cantidadVendida: Number(item[2]) || 0,
      montoTotal: Number(item[3]) || 0
    };
  }

  private normalizarClienteTopCompras(item: any): any {
    if (!Array.isArray(item)) return item;
    return {
      idCliente: item[0],
      nombreCliente: item[1],
      montoTotal: Number(item[2]) || 0,
      cantidadCompras: Number(item[3]) || 0
    };
  }

  private normalizarTotalMensual(item: any): any {
    if (!Array.isArray(item)) return item;
    return {
      anio: item[0],
      mes: item[1],
      totalMensual: Number(item[2]) || 0,
      cantidadVentas: Number(item[3]) || 0
    };
  }

  private normalizarVenta(venta: VentaResponse): VentaResponse {
    return this.normalizarDTO(venta as unknown as ReporteVentaDTO) as VentaResponse;
  }

  private normalizarDTO(venta: ReporteVentaDTO): any {
    const total = Number(venta.total || 0);
    const subtotal = Number(venta.subtotal ?? (total / 1.18).toFixed(2));
    const igv = Number(venta.igv ?? (total - subtotal).toFixed(2));

    return {
      idVenta: venta.idVenta,
      idCliente: venta.idCliente,
      cliente: {
        idCliente: venta.idCliente,
        nombre: venta.nombreCliente,
        email: venta.emailCliente
      },
      idProducto: venta.idProducto,
      producto: {
        idProducto: venta.idProducto,
        nombre: venta.nombreProducto
      },
      cantidad: venta.cantidad,
      precioUnitario: venta.precioUnitario,
      subtotal,
      igv,
      total,
      tipoDocumento: venta.tipoDocumento,
      comprobanteNumero: venta.comprobanteNumero,
      fechaVenta: venta.fechaVenta,
      estado: venta.estado ?? true
    };
  }
}
