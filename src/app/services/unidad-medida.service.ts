import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnidadMed } from '../models/unidad-medida.model';

@Injectable({
  providedIn: 'root'
})
export class UnidadMedService {
  private apiUrl = 'http://localhost:8080/api/unidades-medida';

  constructor(private http: HttpClient) {}

  listar(): Observable<UnidadMed[]> {
    return this.http.get<UnidadMed[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<UnidadMed> {
    return this.http.get<UnidadMed>(`${this.apiUrl}/${id}`);
  }

  crear(unidad: UnidadMed): Observable<UnidadMed> {
    return this.http.post<UnidadMed>(this.apiUrl, unidad);
  }

  actualizar(id: number, unidad: UnidadMed): Observable<UnidadMed> {
    return this.http.put<UnidadMed>(`${this.apiUrl}/${id}`, unidad);
  }


  eliminar(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
}

}
