import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movimiento } from '../models/movimientos.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {

  private baseUrl = `${environment.apiBaseUrl}/movimientos`;

  constructor(private http: HttpClient) { }

  /**
   * 📦 Lista todos los movimientos registrados.
   */
  listar(): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(this.baseUrl);
  }

  /**
   * 📦 Lista solo movimientos filtrados por tipo (ENTRADA, SALIDA, AJUSTE).
   */
  listarPorTipo(tipo: string): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.baseUrl}/tipo/${encodeURIComponent(tipo)}`);
  }

  /**
   * 🔍 Lista movimientos de un producto específico.
   */
  listarPorProducto(idProducto: number): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.baseUrl}/producto/${idProducto}`);
  }

  /**
   * ➕ Crea un nuevo movimiento.
   * @param movimiento Datos del movimiento
   */
  crear(movimiento: Movimiento): Observable<Movimiento> {
    return this.http.post<Movimiento>(this.baseUrl, movimiento);
  }

  /**
   * 🗑️ Elimina un movimiento.
   */
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 💰 Obtiene el precio según el tipo de movimiento y producto.
   * @param idProducto ID del producto
   * @param tipo Tipo de movimiento (ENTRADA, SALIDA, AJUSTE)
   */
  obtenerPrecio(idProducto: number, tipo: string): Observable<any> {
    const params = new HttpParams()
      .set('idProducto', idProducto.toString())
      .set('tipo', tipo);
    return this.http.get<any>(`${this.baseUrl}/precio`, { params });
  }
}
