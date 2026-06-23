import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReporteVentaDTO, ResumenVentas } from '../models/reporte-venta.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteVentaService {
  private apiUrl = `${environment.apiBaseUrl}/reportes-ventas`;

  constructor(private http: HttpClient) { }

  listar(page: number = 0, size: number = 10): Observable<PaginatedResponse<ReporteVentaDTO>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ReporteVentaDTO>>(
      `${this.apiUrl}/pagina`,
      { params }
    );
  }

  listarPaginado(page: number = 0, size: number = 10): Observable<PaginatedResponse<ReporteVentaDTO>> {
    return this.listar(page, size);
  }

  obtenerProductosMasVendidos(): Observable<any[]> {
    return this.productosMasVendidos();
  }

  obtenerClientesTopCompras(): Observable<any[]> {
    return this.ventasPorClienteResumen();
  }

  obtenerTotalesMensuales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/totales-mensuales`).pipe(
      map((datos: any) => {
        if (!Array.isArray(datos)) {
          return [];
        }
        return datos.map((item: any) => {
          if (Array.isArray(item)) {
            return {
              anio: item[0]?.substring(0, 4) || new Date().getFullYear(),
              mes: item[0]?.substring(5, 7) || new Date().getMonth() + 1,
              totalMensual: Number(item[1]) || 0
            };
          }
          if (typeof item === 'object') {
            return {
              anio: item.anio || item[0]?.substring(0, 4) || new Date().getFullYear(),
              mes: item.mes || item[0]?.substring(5, 7) || new Date().getMonth() + 1,
              totalMensual: Number(item.totalMensual || item.total || item[1] || 0)
            };
          }
          return item;
        });
      })
    );
  }

  ventasPorCliente(clienteId: number, page: number = 0, size: number = 10): Observable<PaginatedResponse<ReporteVentaDTO>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ReporteVentaDTO>>(
      `${this.apiUrl}/cliente/${clienteId}`,
      { params }
    );
  }

  ventasPorRangoFechas(
    inicio: string,
    fin: string,
    page: number = 0,
    size: number = 10
  ): Observable<PaginatedResponse<ReporteVentaDTO>> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin)
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ReporteVentaDTO>>(
      `${this.apiUrl}/rango-fechas/pagina`,
      { params }
    );
  }

  productosMasVendidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos-mas-vendidos`).pipe(
      map((datos: any) => {
        if (!Array.isArray(datos)) {
          return [];
        }

        return datos.map((item: any) => {
          if (Array.isArray(item)) {
            return {
              idProducto: item[0],
              nombreProducto: item[1] || 'Sin nombre',
              cantidadVendida: item[2] || 0,
              montoTotal: Number(item[3]) || 0
            };
          }
          if (typeof item === 'object') {
            return {
              nombreProducto: item.nombreProducto || item.nombre || item[0] || 'Sin nombre',
              cantidadVendida: item.cantidadVendida || item.cantidad || item[1] || 0,
              montoTotal: Number(item.montoTotal || item.total || item[2] || 0)
            };
          }
          return item;
        });
      })
    );
  }

  ventasPorClienteResumen(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas-por-cliente`).pipe(
      map((datos: any) => {
        if (!Array.isArray(datos)) {
          return [];
        }

        return datos.map((item: any) => {
          if (Array.isArray(item)) {
            return {
              idCliente: item[0],
              nombreCliente: item[1] || 'Sin nombre',
              montoTotal: Number(item[2]) || 0,
              cantidadVentas: item[3] || 0
            };
          }
          if (typeof item === 'object') {
            return {
              nombreCliente: item.nombreCliente || item.nombre || item[0] || 'Sin nombre',
              cantidadVentas: item.cantidadVentas || item.cantidad || item[1] || 0,
              montoTotal: Number(item.montoTotal || item.total || item[2] || 0)
            };
          }
          return item;
        });
      })
    );
  }

  exportarTodasVentasCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/todas/csv`, {
      responseType: 'blob',
      headers: { Accept: 'text/csv' }
    });
  }

  exportarVentasClienteCSV(clienteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/cliente/${clienteId}/csv`, {
      responseType: 'blob',
      headers: { Accept: 'text/csv' }
    });
  }

  exportarVentasClienteExcel(clienteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/cliente/${clienteId}/excel`, {
      responseType: 'blob',
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    });
  }

  exportarVentasClientePDF(clienteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar/cliente/${clienteId}/pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' }
    });
  }

  exportarComprobantePDF(idVenta: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/exportar/comprobante/${idVenta}/pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' }
    });
  }

  descargarArchivo(blob: Blob, nombre: string): void {
    if (!blob || blob.size === 0) {
      console.error('Error: Blob vacío o inválido');
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  abrirPDF(blob: Blob, nombre: string): void {
    if (!blob || blob.size === 0) {
      console.error('Error: PDF vacío o inválido');
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const nuevaVentana = window.open(url, '_blank');
    if (nuevaVentana) {
      setTimeout(() => {
        nuevaVentana.print();
      }, 700);
    }
    window.URL.revokeObjectURL(url);
  }

  calcularSubtotal(total?: number): number {
    return total ? Number((total / 1.18).toFixed(2)) : 0;
  }

  calcularIgv(total?: number): number {
    return total ? Number((total - (total / 1.18)).toFixed(2)) : 0;
  }
}
