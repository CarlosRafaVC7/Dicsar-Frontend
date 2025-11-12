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
        console.log('🔍 RESPUESTA CRUDA DEL BACKEND:', res);
        console.log('🔍 PRIMER PRODUCTO DEL BACKEND:', res[0]);
        
        return res.map(p => {
          console.log(`🔍 Producto del backend: ${p.nombre}, estado original: ${p.estado} (${typeof p.estado})`);
          
          return {
            idProducto: p.idProducto,
            nombre: p.nombre,
            descripcion: p.descripcion,
            codigo: p.codigo,
            precioBase: p.precioBase || p.precio,
            precio: p.precioBase || p.precio,
            stockActual: p.stockActual,
            stockMinimo: p.stockMinimo,
            // Campos del DTO plano
            categoriaId: p.categoriaId || p.categoria?.idCategoria,
            categoriaNombre: p.categoriaNombre || p.categoria?.nombre,
            unidadMedidaId: p.unidadMedidaId || p.unidadMedida?.idUnidadMed,
            unidadMedidaNombre: p.unidadMedidaNombre || p.unidadMedida?.nombre,
            unidadMedidaAbreviatura: p.unidadMedidaAbreviatura || p.unidadMedida?.abreviatura,
            proveedorId: p.proveedorId || p.proveedor?.idProveedor,
            proveedorNombre: p.proveedorNombre || p.proveedor?.razonSocial,
            // Campos anidados (backward compatibility)
            categoria: p.categoria,
            unidadMedida: p.unidadMedida,
            proveedor: p.proveedor,
            precioCompra: p.precioCompra,
            fechaVencimiento: p.fechaVencimiento,
            fechaCreacion: p.fechaCreacion,
            fechaActualizacion: p.fechaActualizacion,
            estadoVencimiento: p.estadoVencimiento,
            estado: p.estado
          };
        });
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
        `${producto.fechaVencimiento}T00:00:00` : null,
      estado: producto.estado !== undefined ? producto.estado : true  // 🔧 AGREGADO: incluir estado
    };
    
    console.log('📤 ENVIANDO PRODUCTO AL BACKEND:', productoFormateado);
    
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
        `${producto.fechaVencimiento}T00:00:00` : null,
      estado: producto.estado !== undefined ? producto.estado : true  // 🔧 AGREGADO: incluir estado
    };
    
    console.log('📤 ACTUALIZANDO PRODUCTO EN BACKEND:', productoFormateado);
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, productoFormateado).pipe(
      map(res => res.producto)
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  actualizarPrecio(id: number, nuevoPrecio: number, usuario: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/precio?nuevoPrecio=${nuevoPrecio}&usuario=${usuario}`, 
      {},
      { responseType: 'text' }  // ¡CRUCIAL! El backend devuelve texto plano
    );
  }
  
  actualizarEstado(id: number, nuevoEstado: boolean, usuario: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/estado?nuevoEstado=${nuevoEstado}&usuario=${usuario}`, 
      {},
      { responseType: 'text' }  // ¡CRUCIAL! El backend devuelve texto plano
    );
  }

}
