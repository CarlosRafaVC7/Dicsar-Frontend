import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion?: string;
  categoria: Categoria;
}

export interface Notificacion {
  id: number;
  producto: Producto;
  tipo: string; // ADVERTENCIA, CRITICA, INFORMACION
  descripcion: string;
  usuario: string;
  fechaHora: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private baseUrl = `${environment.apiBaseUrl}/notificaciones`;

  constructor(private http: HttpClient) { }

  listar(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.baseUrl);
  }

  listarPorProducto(idProducto: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.baseUrl}/producto/${idProducto}`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
