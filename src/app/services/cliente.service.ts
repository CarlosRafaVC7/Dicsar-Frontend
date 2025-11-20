import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteDTO } from '../models/cliente.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiBaseUrl}/clientes`;

  constructor(private http: HttpClient) { }

  // ========== CAMBIAR ESTADO ==========
  cambiarEstado(id: number, estado: boolean): Observable<ClienteDTO> {
    return this.http.post<ClienteDTO>(`${this.apiUrl}/${id}/cambiar-estado`, { estado });
  }

  buscarPorCedula(cedula: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<ClienteDTO>> {
    const params = new HttpParams()
      .set('numeroDocumento', cedula)
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ClienteDTO>>(
      `${this.apiUrl}/buscar/cedula`,
      { params }
    );
  }

  obtenerPorEmail(email: string): Observable<ClienteDTO> {
    return this.http.get<ClienteDTO>(`${this.apiUrl}/buscar/email/${email}`);
  }

  // ========== LISTADO ==========
  listar(page: number = 0, size: number = 10): Observable<PaginatedResponse<ClienteDTO>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ClienteDTO>>(
      `${this.apiUrl}/pagina/todas`,
      { params }
    );
  }

  // ========== BÚSQUEDAS ==========
  buscarPorNombre(nombre: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<ClienteDTO>> {
    const params = new HttpParams()
      .set('nombre', nombre)
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ClienteDTO>>(
      `${this.apiUrl}/buscar/nombre`,
      { params }
    );
  }

  buscarPorEmail(email: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<ClienteDTO>> {
    const params = new HttpParams()
      .set('email', email)
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ClienteDTO>>(
      `${this.apiUrl}/buscar/email`,
      { params }
    );
  }

  buscarPorTelefono(telefono: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<ClienteDTO>> {
    const params = new HttpParams()
      .set('telefono', telefono)
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ClienteDTO>>(
      `${this.apiUrl}/buscar/telefono`,
      { params }
    );
  }

  // ========== FILTROS ==========
  filtrarPorTipo(esEmpresa: boolean, page: number = 0, size: number = 10): Observable<PaginatedResponse<ClienteDTO>> {
    const params = new HttpParams()
      .set('esEmpresa', esEmpresa.toString())
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ClienteDTO>>(
      `${this.apiUrl}/filtro/tipo`,
      { params }
    );
  }

  filtrarPorEstado(estado: boolean, page: number = 0, size: number = 10): Observable<PaginatedResponse<ClienteDTO>> {
    const params = new HttpParams()
      .set('estado', estado.toString())
      .set('pageNumber', page.toString())
      .set('pageSize', size.toString());
    return this.http.get<PaginatedResponse<ClienteDTO>>(
      `${this.apiUrl}/filtro/estado`,
      { params }
    );
  }

  // ========== CRUD ==========
  obtener(id: number): Observable<ClienteDTO> {
    return this.http.get<ClienteDTO>(`${this.apiUrl}/${id}`);
  }

  crear(cliente: ClienteDTO): Observable<ClienteDTO> {
    return this.http.post<ClienteDTO>(this.apiUrl, cliente);
  }

  actualizar(id: number, cliente: ClienteDTO): Observable<ClienteDTO> {
    return this.http.put<ClienteDTO>(`${this.apiUrl}/${id}`, cliente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ========== ESPECIALES ==========
  obtenerActivos(): Observable<ClienteDTO[]> {
    return this.http.get<ClienteDTO[]>(`${this.apiUrl}/activos`);
  }
}
