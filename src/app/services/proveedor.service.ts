import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../models/proveedor.model';
import { environment } from '../../environments/environment';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private apiUrl = `${environment.apiBaseUrl}/proveedores`;

  constructor(private http: HttpClient) { }

  listar(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  listarPaginado(
    buscar?: string,
    estado?: boolean,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'razonSocial',
    direction: string = 'ASC'
  ): Observable<PageResponse<Proveedor>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    if (buscar) {
      params = params.set('buscar', buscar);
    }
    if (estado !== undefined && estado !== null) {
      params = params.set('estado', estado.toString());
    }

    return this.http.get<PageResponse<Proveedor>>(`${this.apiUrl}/paginated`, { params });
  }

  listarActivos(buscar?: string, page: number = 0, size: number = 10): Observable<PageResponse<Proveedor>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (buscar) {
      params = params.set('buscar', buscar);
    }

    return this.http.get<PageResponse<Proveedor>>(`${this.apiUrl}/activos`, { params });
  }

  obtener(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  crear(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  actualizar(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, proveedor);
  }

  cambiarEstado(id: number, nuevoEstado: boolean): Observable<string> {
    return this.http.put(`${this.apiUrl}/${id}/estado?nuevoEstado=${nuevoEstado}`, {}, { responseType: 'text' });
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  obtenerProductosPorProveedor(id: number, nombre?: string, page: number = 0, size: number = 10): Observable<PageResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (nombre) {
      params = params.set('nombre', nombre);
    }

    return this.http.get<PageResponse<any>>(`${this.apiUrl}/${id}/productos`, { params });
  }
}
