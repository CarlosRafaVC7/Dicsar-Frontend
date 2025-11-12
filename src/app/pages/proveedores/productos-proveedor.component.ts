import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProveedorService, PageResponse } from '../../services/proveedor.service';
import { ProductoService } from '../../services/producto.service';
import { Proveedor } from '../../models/proveedor.model';
import { Producto } from '../../models/producto.model';

@Component({
  selector: 'app-productos-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './productos-proveedor.component.html',
  styleUrls: ['./productos-proveedor.component.css']
})
export class ProductosProveedorComponent implements OnInit {
  // Tab activo
  tabActivo: 'productos-por-proveedor' | 'proveedores-por-producto' = 'productos-por-proveedor';

  // Productos por proveedor
  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor | null = null;
  productos: any[] = [];
  buscarProducto = '';

  // Proveedores por producto
  productosLista: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  proveedoresPorProducto: Proveedor[] = [];

  // Paginación
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(
    private proveedorService: ProveedorService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarProductos();
  }

  cambiarTab(tab: 'productos-por-proveedor' | 'proveedores-por-producto'): void {
    this.tabActivo = tab;
    this.limpiarSeleccion();
  }

  limpiarSeleccion(): void {
    this.proveedorSeleccionado = null;
    this.productos = [];
    this.productoSeleccionado = null;
    this.proveedoresPorProducto = [];
    this.buscarProducto = '';
    this.currentPage = 0;
  }

  cargarProveedores(): void {
    this.proveedorService.listar().subscribe({
      next: (data) => {
        this.proveedores = data.filter(p => p.estado);
      },
      error: (err: any) => console.error('Error al cargar proveedores:', err)
    });
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (data: Producto[]) => {
        this.productosLista = data.filter((p: Producto) => p.estado);
      },
      error: (err: any) => console.error('Error al cargar productos:', err)
    });
  }

  seleccionarProveedor(proveedor: Proveedor): void {
    this.proveedorSeleccionado = proveedor;
    this.currentPage = 0;
    this.cargarProductosDelProveedor();
  }

  cargarProductosDelProveedor(): void {
    if (!this.proveedorSeleccionado?.idProveedor) return;

    this.proveedorService.obtenerProductosPorProveedor(
      this.proveedorSeleccionado.idProveedor,
      this.buscarProducto || undefined,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (page: PageResponse<any>) => {
        this.productos = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.currentPage = page.number;
      },
      error: (err: any) => console.error('Error al cargar productos del proveedor:', err)
    });
  }

  buscarProductosProveedor(): void {
    this.currentPage = 0;
    this.cargarProductosDelProveedor();
  }

  seleccionarProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.cargarProveedoresDelProducto();
  }

  cargarProveedoresDelProducto(): void {
    if (!this.productoSeleccionado?.categoria?.idCategoria) {
      this.proveedoresPorProducto = [];
      return;
    }

    // Buscar todos los productos de la misma categoría y extraer sus proveedores
    this.productoService.listar().subscribe({
      next: (productos: Producto[]) => {
        const proveedoresIds = new Set(
          productos
            .filter(p => p.categoria?.idCategoria === this.productoSeleccionado?.categoria?.idCategoria)
            .map(p => p.proveedor?.idProveedor)
            .filter(id => id !== undefined && id !== null)
        );
        
        this.proveedoresPorProducto = this.proveedores.filter(
          prov => prov.idProveedor && proveedoresIds.has(prov.idProveedor)
        );
      },
      error: (err: any) => console.error('Error al cargar proveedores del producto:', err)
    });
  }

  cambiarPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      if (this.tabActivo === 'productos-por-proveedor') {
        this.cargarProductosDelProveedor();
      }
    }
  }

  get paginasMostrar(): number[] {
    const maxPaginas = 5;
    const mitad = Math.floor(maxPaginas / 2);
    let inicio = Math.max(0, this.currentPage - mitad);
    let fin = Math.min(this.totalPages - 1, inicio + maxPaginas - 1);
    
    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(0, fin - maxPaginas + 1);
    }
    
    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  }
}
