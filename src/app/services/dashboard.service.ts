import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardMetricas {
  totalVentas: number;
  montoTotalVentas: number;
  totalClientes: number;
  totalProductos: number;
  productosAgotados: number;
  ventasHoy: number;
  ventasEstaSemana: number;
  ventasEsteMes: number;
}

export interface ProductoMasVendido {
  idProducto: number;
  nombreProducto: string;
  cantidadVendida: number;
  montoTotal: number;
}

export interface ClienteConMasCompras {
  idCliente: number;
  nombreCliente: string;
  cantidadVentas: number;
  montoTotal: number;
}

export interface VentaPorDia {
  fecha: string;
  cantidad: number;
  monto: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) { }

  obtenerMetricas(): Observable<DashboardMetricas> {
    return this.http.get<DashboardMetricas>(`${this.apiUrl}/metricas`);
  }

  productosAgotados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos-agotados`);
  }

  ventasPorDia(): Observable<VentaPorDia[]> {
    return this.http.get<VentaPorDia[]>(`${this.apiUrl}/ventas-por-dia`);
  }
}
