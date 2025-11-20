import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RolDTO } from '../models/rol.model';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private apiUrl = `${environment.apiBaseUrl}/roles`;

  constructor(private http: HttpClient) { }

  listar(): Observable<RolDTO[]> {
    return this.http.get<RolDTO[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<RolDTO> {
    return this.http.get<RolDTO>(`${this.apiUrl}/${id}`);
  }

  crear(rol: RolDTO): Observable<RolDTO> {
    return this.http.post<RolDTO>(this.apiUrl, rol);
  }

  actualizar(id: number, rol: Partial<RolDTO>): Observable<RolDTO> {
    return this.http.put<RolDTO>(`${this.apiUrl}/${id}`, rol);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
