import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioDTO, CambiarPasswordRequest } from '../models/usuario.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiBaseUrl}/usuarios`;

  constructor(private http: HttpClient) { }

  // ========== CRUD ==========
  listar(): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(this.apiUrl);
  }

  obtener(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.apiUrl}/${id}`);
  }

  crear(usuario: UsuarioDTO): Observable<UsuarioDTO> {
    return this.http.post<UsuarioDTO>(this.apiUrl, usuario);
  }

  actualizar(id: number, usuario: UsuarioDTO): Observable<UsuarioDTO> {
    return this.http.put<UsuarioDTO>(`${this.apiUrl}/${id}`, usuario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ========== ESTADO ==========
  desactivar(id: number): Observable<UsuarioDTO> {
    return this.http.post<UsuarioDTO>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activar(id: number): Observable<UsuarioDTO> {
    return this.http.post<UsuarioDTO>(`${this.apiUrl}/${id}/activar`, {});
  }

  obtenerActivos(): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(`${this.apiUrl}/activos`);
  }

  // ========== SEGURIDAD ==========
  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<any> {
    const request: CambiarPasswordRequest = {
      passwordActual,
      passwordNueva
    };
    return this.http.post(`${this.apiUrl}/cambiar-password`, request);
  }
}
