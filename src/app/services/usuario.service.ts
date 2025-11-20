import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  idUsuario?: number;
  usuario: string;
  password?: string;
  email?: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'USUARIO' | 'CLIENTE';
  activo: boolean;
  fechaCreacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiBaseUrl}/usuarios`;

  constructor(private http: HttpClient) { }

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  crear(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  actualizar(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cambiar-password`, {
      passwordActual,
      passwordNueva
    });
  }

  // ========== DESACTIVAR / ACTIVAR ==========
  desactivarUsuario(id: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarUsuario(id: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${id}/activar`, {});
  }
}
