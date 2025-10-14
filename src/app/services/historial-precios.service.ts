import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { HistorialPrecio } from '../models/historial-precios.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialPrecioService {

  private apiUrl = 'http://localhost:8080/api/historial-precios';

  constructor(private http: HttpClient) { }

  /**
   * Obtener historial de precios por producto
   */
  obtenerPorProducto(idProducto: number): Observable<HistorialPrecio[]> {
    if (!idProducto) {
      return throwError(() => new Error('ID de producto es requerido'));
    }

    return this.http.get<HistorialPrecio[]>(`${this.apiUrl}/producto/${idProducto}`)
      .pipe(
        catchError(this.manejarError)
      );
  }

  /**
   * Obtener historial con filtros
   */
  obtenerConFiltros(filtros: {
    productoId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<HistorialPrecio[]> {
    
    let params = new HttpParams();
    
    if (filtros.productoId) {
      params = params.set('productoId', filtros.productoId.toString());
    }
    
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<HistorialPrecio[]>(`${this.apiUrl}/filtros`, { params })
      .pipe(
        catchError(this.manejarError)
      );
  }

  /**
   * Manejo centralizado de errores
   */
  private manejarError(error: HttpErrorResponse) {
    let mensajeError = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensajeError = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 404:
          mensajeError = 'No se encontró historial para este producto';
          break;
        case 500:
          mensajeError = 'Error interno del servidor';
          break;
        default:
          mensajeError = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error en HistorialPrecioService:', error);
    return throwError(() => new Error(mensajeError));
  }

  /**
   * Verificar si existe historial para un producto
   */
  existeHistorial(idProducto: number): Observable<boolean> {
    return this.obtenerPorProducto(idProducto)
      .pipe(
        catchError(() => [false]),
        // @ts-ignore - Ignorar tipo para esta transformación
        map(historial => Array.isArray(historial) && historial.length > 0)
      );
  }
}