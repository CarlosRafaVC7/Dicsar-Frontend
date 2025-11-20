import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReporteInventario {
  totalProductos: number;
  productosActivos: number;
  productosInactivos: number;
  productosConStockBajo: number;
  productosSinStock: number;
  valorTotalInventario: number;
  totalCategorias: number;
  stockTotalActual: number;
}

export interface ProveedorConMasProductos {
  idProveedor: number;
  razonSocial: string;
  ruc: string;
  cantidadProductos: number;
}

export interface ReporteProveedores {
  totalProveedores: number;
  proveedoresActivos: number;
  proveedoresInactivos: number;
  totalProductosPorProveedores: number;
  promedioProductosPorProveedor: number;
  proveedorConMasProductos: ProveedorConMasProductos | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = 'http://localhost:8080/api/reportes';

  constructor(private http: HttpClient) { }

  obtenerReporteInventario(): Observable<ReporteInventario> {
    return this.http.get<ReporteInventario>(`${this.apiUrl}/inventario`);
  }

  obtenerReporteProveedores(): Observable<ReporteProveedores> {
    return this.http.get<ReporteProveedores>(`${this.apiUrl}/proveedores`);
  }
}
