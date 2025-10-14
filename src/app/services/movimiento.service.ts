import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movimiento } from '../models/movimientos.model';

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {

  private baseUrl = 'http://localhost:8080/api/movimientos';

  constructor(private http: HttpClient) {}

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
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<Movimiento[]>(`${this.baseUrl}/tipo`, { params });
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
   * @param usuario Usuario que realiza el movimiento
   */
  crear(movimiento: Movimiento, usuario: string = 'admin'): Observable<Movimiento> {
    const params = new HttpParams().set('usuario', usuario);
    return this.http.post<Movimiento>(this.baseUrl, movimiento, { params });
  }
}
