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

  // ========== LISTADO ==========
  listar(page: number = 0, size: number = 10): Observable<PaginatedResponse<ReporteVentaDTO>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ReporteVentaDTO>>(
      `${this.apiUrl}/pagina`,
      { params }
    );
  }

  // ========== POR CLIENTE ==========
  ventasPorCliente(clienteId: number, page: number = 0, size: number = 10): Observable<PaginatedResponse<ReporteVentaDTO>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ReporteVentaDTO>>(
      `${this.apiUrl}/cliente/${clienteId}`,
      { params }
    );
  }

  // ========== POR RANGO DE FECHAS ==========
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

  // ========== RESÚMENES ==========
  /**
   * Obtiene productos más vendidos
   * Transforma arrays [nombre, cantidad] en objetos con propiedades claras
   */
  productosMasVendidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos-mas-vendidos`).pipe(
      map((datos: any) => {
        // Manejo de diferentes formatos de respuesta
        if (!Array.isArray(datos)) {
          return [];
        }

        return datos.map((item: any) => {
          // Si es un array simple [nombre, cantidad, total]
          if (Array.isArray(item)) {
            return {
              nombreProducto: item[0] || 'Sin nombre',
              cantidadVendida: item[1] || 0,
              montoTotal: Number(item[2]) || 0
            };
          }
          // Si ya es un objeto
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

  /**
   * Obtiene clientes con más compras
   * Transforma arrays [nombre, cantidad, total] en objetos con propiedades claras
   */
  ventasPorClienteResumen(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas-por-cliente`).pipe(
      map((datos: any) => {
        // Manejo de diferentes formatos de respuesta
        if (!Array.isArray(datos)) {
          return [];
        }

        return datos.map((item: any) => {
          // Si es un array simple [nombre, cantidad, total]
          if (Array.isArray(item)) {
            return {
              nombreCliente: item[0] || 'Sin nombre',
              cantidadVentas: item[1] || 0,
              montoTotal: Number(item[2]) || 0
            };
          }
          // Si ya es un objeto
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

  // ========== EXPORTACIÓN ==========
  exportarTodasVentasCSV(): Observable<Blob> {
    return this.http.get('http://localhost:8080/api/reportes-ventas/exportar/todas/csv', {
      responseType: 'blob',
      headers: { 'Accept': 'text/csv' }
    });
  }

  exportarVentasClienteCSV(clienteId: number): Observable<Blob> {
    return this.http.get(`http://localhost:8080/api/reportes-ventas/exportar/cliente/${clienteId}/csv`, {
      responseType: 'blob',
      headers: { 'Accept': 'text/csv' }
    });
  }

  // ========== HELPER: Descargar archivo ==========
  descargarArchivo(blob: Blob, nombre: string): void {
    // Validar que el blob sea válido
    if (!blob || blob.size === 0) {
      console.error('Error: Blob vacío o inválido');
      return;
    }

    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombre;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando archivo:', error);
    }
  }
}
