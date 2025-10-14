import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:8080/api/productos';

  constructor(private http: HttpClient) {}

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(res => {
        console.log('📦 Productos desde backend:', res);
        return res.map(p => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          descripcion: p.descripcion,
          codigo: p.codigo,
          precioBase: p.precio,
          stockActual: p.stockActual,
          stockMinimo: p.stockMinimo,
          categoriaId: p.categoria?.idCategoria, // Para el formulario
          categoria: p.categoria, // Objeto completo para mostrar
          unidadMedidaId: p.unidadMedida?.idUnidadMed, // Para el formulario
          unidadMedida: p.unidadMedida, // Objeto completo para mostrar
          proveedorId: p.proveedor?.idProveedor, // Para el formulario
          proveedor: p.proveedor, // Objeto completo para mostrar
          precioCompra: p.precioCompra,
          fechaVencimiento: p.fechaVencimiento
        }));
      })
    );
  }

  crear(producto: Producto): Observable<any> {
    const productoFormateado = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      codigo: producto.codigo,
      precioBase: producto.precioBase,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
      categoriaId: producto.categoriaId,
      unidadMedidaId: producto.unidadMedidaId,
      proveedorId: producto.proveedorId || null,
      precioCompra: producto.precioCompra,
      fechaVencimiento: producto.fechaVencimiento ? 
        `${producto.fechaVencimiento}T00:00:00` : null
    };

    return this.http.post<any>(this.apiUrl, productoFormateado).pipe(
      map(res => res.producto)
    );
  }

  actualizar(id: number, producto: Producto): Observable<any> {
    const productoFormateado = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      codigo: producto.codigo,
      precioBase: producto.precioBase,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
      categoriaId: producto.categoriaId,
      unidadMedidaId: producto.unidadMedidaId,
      proveedorId: producto.proveedorId || null,
      precioCompra: producto.precioCompra,
      fechaVencimiento: producto.fechaVencimiento ? 
        `${producto.fechaVencimiento}T00:00:00` : null
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, productoFormateado).pipe(
      map(res => res.producto)
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}