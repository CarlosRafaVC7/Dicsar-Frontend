import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Venta {
  idVenta?: number;
  cliente: { idCliente: number };
  producto: { idProducto: number };
  cantidad: number;
  precioUnitario: number;
  total: number;
  tipoDocumento: string;
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
  private movimientosUrl = `${environment.apiBaseUrl}/movimientos`;

  constructor(private http: HttpClient) { }

  // Crear nueva venta
  crear(venta: Venta): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(this.apiUrl, venta);
  }

  // Listar todas las ventas
  listar(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.apiUrl);
  }

  // Listar ventas paginadas - INTEGRADO CON MOVIMIENTOS (SALIDAS)
  listarPaginado(pageNumber: number = 0, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('tipo', 'SALIDA');  // Filtrar solo salidas (ventas)

    // Usa endpoint de movimientos que SÍ tiene datos
    return this.http.get<any>(`${this.movimientosUrl}`, { params }).pipe(
      // Transformar respuesta para mantener compatibilidad
      map((response: any) => {
        if (Array.isArray(response)) {
          // Si es array directo, paginar manualmente
          const start = pageNumber * pageSize;
          const end = start + pageSize;
          return {
            content: response.slice(start, end),
            totalElements: response.length,
            totalPages: Math.ceil(response.length / pageSize),
            currentPage: pageNumber
          };
        }
        return response;
      })
    );
  }

  // Obtener ventas por cliente
  obtenerPorCliente(idCliente: number, pageNumber: number = 0, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/cliente/${idCliente}`, { params });
  }

  // Obtener productos más vendidos
  obtenerProductosMasVendidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos-mas-vendidos`).pipe(
      map(datos => {
        console.log('Raw API response (productos):', datos);
        return Array.isArray(datos) ? datos : [];
      })
    );
  }

  // Obtener clientes que más compran
  obtenerClientesTopCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas-por-cliente`).pipe(
      map(datos => {
        console.log('Raw API response (clientes):', datos);
        return Array.isArray(datos) ? datos : [];
      })
    );
  }

  // Obtener totales mensuales
  obtenerTotalesMensuales(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/totales-mensuales`).pipe(
      map(datos => {
        console.log('Raw API response (totales):', datos);
        return Array.isArray(datos) ? datos : [];
      })
    );
  }
}
