import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../models/categoria.model';
import { UnidadMed } from '../../models/unidad-medida.model';
import { Producto } from '../../models/producto.model';
import { CategoriaService } from '../../services/categoria.service';
import { UnidadMedService } from '../../services/unidad-medida.service';
import { ProductoService } from '../../services/producto.service';
import { Proveedor } from '../../models/proveedor.model';
import { ProveedorService } from '../../services/proveedor.service';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {

  // === 🧭 CONTROL DE TABS ===
  activeTab: 'productos' | 'categorias' | 'unidades' = 'productos';

  // === 📂 CATEGORÍAS ===
  categorias: Categoria[] = [];
  nuevaCategoria: Categoria = { nombre: '', descripcion: '' };
  editandoCategoria: Categoria | null = null;

  // === ⚖️ UNIDADES DE MEDIDA ===
  unidades: UnidadMed[] = [];
  nuevaUnidad: UnidadMed = { nombre: '', abreviatura: '' };
  editandoUnidad: UnidadMed | null = null;

  // === 🛒 PRODUCTOS ===
  productos: any[] = [];
  nuevoProducto: Producto = this.resetProducto();
  editandoProducto: any = null;

  proveedores: Proveedor[] = [];
 // === 🔍 FILTRO DE CATEGORÍAS ===
  categoriaSeleccionada: number | 'todas' = 'todas';

  // === 📂 MODAL UNIDADES ===
  mostrarModalUnidad = false;

  // === 📂 MODAL PRODUCTO ===
  mostrarModalProducto = false;

  // === 📁 IMPORTAR CSV ===
  @ViewChild('inputCSV') inputCSV!: ElementRef<HTMLInputElement>;

  // === ⚠️ ALERTAS ===
  alertaVisible = false;
  alertaMensaje = '';
  alertaTipo: 'exito' | 'error' | 'info' = 'info';

  // NUEVAS PROPIEDADES (búsqueda, filtro por nombre de categoría y edición inline)
  search: string = '';
  selectedCategory: string = 'Todas las categorías';

  editingPriceId: number | null = null;
  draftPrice: number | null = null;

  constructor(
    private categoriaService: CategoriaService,
    private unidadMedService: UnidadMedService,
    private productoService: ProductoService,
    private proveedorService: ProveedorService,
  ) {}

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarUnidades();
    this.cargarProveedores();
    this.cargarProductos();
  }

  cargarProveedores() {
    this.proveedorService.listar().subscribe({
      next: data => this.proveedores = data,
      error: () => this.mostrarAlerta('Error al cargar proveedores', 'error')
    });
  }

  // ==================== ALERTAS ====================
  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info') {
    this.alertaVisible = true;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    setTimeout(() => (this.alertaVisible = false), 3500);
  }

  // ==================== CAMBIO DE TABS ====================
  cambiarTab(tab: 'productos' | 'categorias' | 'unidades') {
    this.activeTab = tab;
    if (tab === 'categorias') this.cargarCategorias();
    if (tab === 'unidades') this.cargarUnidades();
    if (tab === 'productos') this.cargarProductos();
  }

  // ==================== CRUD CATEGORÍAS ====================
  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: data => this.categorias = data,
      error: () => this.mostrarAlerta('Error al cargar categorías', 'error')
    });
  }

  guardarCategoria(): void {
    if (this.editandoCategoria) {
      this.categoriaService.actualizar(this.editandoCategoria.idCategoria!, this.nuevaCategoria)
        .subscribe({
          next: () => {
            this.cargarCategorias();
            this.cancelarEdicionCategoria();
            this.mostrarAlerta('Categoría actualizada correctamente', 'exito');
          },
          error: err => this.mostrarAlerta(err.error || 'Error al actualizar categoría', 'error')
        });
    } else {
      this.categoriaService.crear(this.nuevaCategoria).subscribe({
        next: () => {
          this.cargarCategorias();
          this.nuevaCategoria = { nombre: '', descripcion: '' };
          this.mostrarAlerta('Categoría creada correctamente', 'exito');
        },
        error: err => this.mostrarAlerta(err.error || 'Error al crear categoría', 'error')
      });
    }
  }

  editarCategoria(c: Categoria) {
    this.editandoCategoria = c;
    this.nuevaCategoria = { ...c };
  }

  cancelarEdicionCategoria() {
    this.editandoCategoria = null;
    this.nuevaCategoria = { nombre: '', descripcion: '' };
  }

  eliminarCategoria(id: number) {
    if (confirm('¿Deseas eliminar esta categoría?')) {
      this.categoriaService.eliminar(id).subscribe({
        next: () => {
          this.cargarCategorias();
          this.mostrarAlerta('Categoría eliminada correctamente', 'exito');
        },
        error: () => this.mostrarAlerta('Error al eliminar categoría', 'error')
      });
    }
  }

  // ==================== CRUD UNIDADES ====================
  cargarUnidades() {
    this.unidadMedService.listar().subscribe({
      next: data => this.unidades = data,
      error: () => this.mostrarAlerta('Error al cargar unidades', 'error')
    });
  }

  guardarUnidad() {
    if (this.editandoUnidad) {
      this.unidadMedService.actualizar(this.editandoUnidad.idUnidadMed!, this.nuevaUnidad).subscribe({
        next: () => {
          this.cargarUnidades();
          this.cancelarEdicionUnidad();
          this.mostrarAlerta('Unidad actualizada correctamente', 'exito');
        },
        error: err => this.mostrarAlerta(err.error || 'Error al actualizar unidad', 'error')
      });
    } else {
      this.unidadMedService.crear(this.nuevaUnidad).subscribe({
        next: () => {
          this.cargarUnidades();
          this.nuevaUnidad = { nombre: '', abreviatura: '' };
          this.mostrarAlerta('Unidad creada correctamente', 'exito');
        },
        error: err => this.mostrarAlerta(err.error || 'Error al crear unidad', 'error')
      });
    }
  }

  editarUnidad(u: UnidadMed) {
    this.editandoUnidad = u;
    this.nuevaUnidad = { ...u };
  }

  cancelarEdicionUnidad() {
    this.editandoUnidad = null;
    this.nuevaUnidad = { nombre: '', abreviatura: '' };
  }

  eliminarUnidad(id: number) {
    if (confirm('¿Deseas eliminar esta unidad?')) {
      this.unidadMedService.eliminar(id).subscribe({
        next: () => this.mostrarAlerta('Unidad eliminada correctamente', 'exito'),
        error: () => this.mostrarAlerta('Error al eliminar unidad', 'error')
      });
    }
  }

  // ==================== CRUD PRODUCTOS ====================
  cargarProductos() {
    this.productoService.listar().subscribe({
      next: data => {
        console.log('📦 PRODUCTOS CARGADOS:', data);
        this.productos = data;
      },
      error: () => this.mostrarAlerta('Error al cargar productos', 'error')
    });
  }

  guardarProducto() {
    // Validación básica
    if (!this.nuevoProducto.categoriaId || !this.nuevoProducto.unidadMedidaId) {
      this.mostrarAlerta('Categoría y Unidad de Medida son obligatorios', 'error');
      return;
    }

    if (this.editandoProducto) {
      this.productoService.actualizar(this.editandoProducto.idProducto!, this.nuevoProducto)
        .subscribe({
          next: (productoActualizado) => {
            this.cargarProductos();
            this.cancelarEdicionProducto();
            this.mostrarAlerta('Producto actualizado correctamente', 'exito');
            // cerrar modal después de actualizar
            this.mostrarModalProducto = false;
          },
          error: (err) => {
            console.error('Error completo:', err);
            this.mostrarAlerta(
              err.error?.message || err.error?.error || 'Error al actualizar producto', 
              'error'
            );
          }
        });
    } else {
      this.productoService.crear(this.nuevoProducto).subscribe({
        next: (productoCreado) => {
          this.cargarProductos();
          this.nuevoProducto = this.resetProducto();
          this.mostrarAlerta('Producto creado correctamente', 'exito');
          // cerrar modal después de crear
          this.mostrarModalProducto = false;
        },
        error: (err) => {
          console.error('Error completo:', err);
          this.mostrarAlerta(
            err.error?.message || err.error?.error || 'Error al crear producto', 
            'error'
          );
        }
      });
    }
  }

  editarProducto(p: any) {
    this.editandoProducto = p;
    this.nuevoProducto = { 
      nombre: p.nombre,
      descripcion: p.descripcion,
      codigo: p.codigo,
      precioBase: p.precioBase,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      categoriaId: p.categoriaId,
      unidadMedidaId: p.unidadMedidaId,
      proveedorId: p.proveedorId,
      precioCompra: p.precioCompra,
      fechaVencimiento: p.fechaVencimiento ? p.fechaVencimiento.split('T')[0] : ''
    };
    // abrir la modal para edición
    this.abrirModalProducto();
  }

  cancelarEdicionProducto() {
    this.editandoProducto = null;
    this.nuevoProducto = this.resetProducto();
  }

  eliminarProducto(id: number) {
    if (confirm('¿Deseas eliminar este producto?')) {
      this.productoService.eliminar(id).subscribe({
        next: () => {
          this.cargarProductos();
          this.mostrarAlerta('Producto eliminado correctamente', 'exito');
        },
        error: () => this.mostrarAlerta('Error al eliminar producto', 'error')
      });
    }
  }

  // ==================== FILTRADO VISIBLE (combinado search + categoría) ====================
  get visibleProducts() {
    const q = (this.search || '').trim().toLowerCase();
    return (this.productos || []).filter((p: any) => {
      const catName = p.categoria?.nombre || '';
      const matchesCategory =
        this.selectedCategory === 'Todas las categorías' || catName === this.selectedCategory;
      const matchesSearch =
        !q ||
        (p.nombre || '').toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        (p.codigo || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }

  // ==================== CSV IMPORT (parse básico y anexar localmente) ====================
  abrirImportarCSV() {
    this.inputCSV.nativeElement.click();
  }

  importarCSV(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) {
      this.mostrarAlerta('No se seleccionó archivo', 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result as string;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      const newItems: any[] = [];
      let nextId = this.productos && this.productos.length ? Math.max(...this.productos.map((x:any)=>x.idProducto || 0)) + 1 : 1;
      for (const line of lines) {
        const cols = line.split(',').map(c => c.trim());
        // Si detecta encabezado, saltar
        if (/^name|nombre/i.test(cols[0]) && /category|categoria/i.test(cols[1])) continue;
        if (cols.length >= 4) {
          const price = Number(cols[3]) || 0;
          newItems.push({
            idProducto: nextId++,
            nombre: cols[0],
            categoria: { nombre: cols[1] },
            unidadMedida: { nombre: cols[2] },
            precioBase: price,
            stockActual: 0
          });
        } else if (cols.length === 3) {
          const price = Number(cols[2]) || 0;
          newItems.push({
            idProducto: nextId++,
            nombre: cols[0],
            categoria: { nombre: cols[1] },
            unidadMedida: { nombre: 'unidad' },
            precioBase: price,
            stockActual: 0
          });
        }
      }
      if (newItems.length) {
        this.productos = [...this.productos, ...newItems];
        this.mostrarAlerta(`Importados ${newItems.length} productos (local)`, 'exito');
      } else {
        this.mostrarAlerta('No se detectaron filas válidas en CSV', 'info');
      }
      // limpiar input
      this.inputCSV.nativeElement.value = '';
    };
    reader.readAsText(file);
  }

  // ==================== EDICIÓN INLINE DE PRECIO ====================
  startEditPrice(producto: any) {
    this.editingPriceId = producto.idProducto;
    this.draftPrice = Number(producto.precioBase) || 0;
  }

  confirmEditPrice(producto: any) {
    if (this.draftPrice === null || isNaN(this.draftPrice) || this.draftPrice < 0) {
      this.mostrarAlerta('Precio inválido', 'error');
      return;
    }
    this.productoService.actualizar(producto.idProducto, { ...producto, precioBase: this.draftPrice }).subscribe({
      next: () => {
        producto.precioBase = this.draftPrice;
        this.editingPriceId = null;
        this.draftPrice = null;
        this.mostrarAlerta('Precio actualizado correctamente', 'exito');
      },
      error: () => {
        producto.precioBase = this.draftPrice;
        this.editingPriceId = null;
        this.draftPrice = null;
        this.mostrarAlerta('Actualizado localmente (sin backend)', 'info');
      }
    });
  }

  cancelEditPrice() {
    this.editingPriceId = null;
    this.draftPrice = null;
  }

  // ==================== FILTRADO POR SELECT (mantener compatibilidad) ====================
  filtrarPorCategoria() {
    // El getter visibleProducts realiza el filtrado dinámico; aquí solo se asegura que la UI reevalúe.
    // Si se quería filtrar en backend, reemplazar por llamada a servicio.
  }

  // ==================== MODAL DE UNIDADES ====================
  abrirModalUnidad() {
    this.mostrarModalUnidad = true;
  }

  cerrarModalUnidad() {
    this.mostrarModalUnidad = false;
  }

  // Abrir/cerrar modal usando boolean (sin Angular Material)
  abrirModalProducto() {
    this.mostrarModalProducto = true;
  }

  cerrarModalProducto() {
    this.mostrarModalProducto = false;
  }

  // ==================== MÉTODOS AUXILIARES ====================
  private resetProducto(): Producto {
    return {
      nombre: '',
      descripcion: '',
      codigo: '',
      precioBase: 0,
      stockActual: 0,
      stockMinimo: 0,
      categoriaId: 0,
      unidadMedidaId: 0,
      proveedorId: null,
      precioCompra: 0,
      fechaVencimiento: ''
    };
  }
  
  esProductoVencido(fechaVencimiento: string): boolean {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    return vencimiento < hoy;
  }

  // Abre prompt para crear proveedor rápido (mínimo funcional)
  crearProveedorRapido() {
    const nombre = prompt('Nombre del nuevo proveedor');
    if (!nombre) return;
    const nextId = this.proveedores && this.proveedores.length
      ? Math.max(...this.proveedores.map((p:any)=>p.idProveedor || 0)) + 1
      : 1;
    const nuevo: any = { idProveedor: nextId, nombre: nombre };
    this.proveedores = [...this.proveedores, nuevo];
    this.nuevoProducto.proveedorId = nuevo.idProveedor;
    this.mostrarAlerta('Proveedor creado', 'exito');
  }
}