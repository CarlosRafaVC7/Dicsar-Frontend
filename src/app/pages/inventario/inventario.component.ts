import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../models/categoria.model';
import { UnidadMed } from '../../models/unidad-medida.model';
import { Producto } from '../../models/producto.model';
import { CategoriaService } from '../../services/categoria.service';
import { UnidadMedService } from '../../services/unidad-medida.service';
import { ProductoService } from '../../services/producto.service';
import { ProveedorService } from '../../services/proveedor.service';
import { ExportService } from '../../services/export.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
// import { DataTableComponent, TableColumn, TableAction } from '../../shared/data-table/data-table.component';

interface Proveedor {
  idProveedor?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: boolean;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {

  // === 🧭 CONTROL DE TABS ===
  activeTab: 'productos' | 'reportes' = 'productos';

  // === 📂 CATEGORÍAS ===
  categorias: Categoria[] = [];
  nuevaCategoria: Categoria = { nombre: '', descripcion: '' };
  editandoCategoria: Categoria | null = null;
  mostrarModalCategoria = false;

  // === ⚖️ UNIDADES DE MEDIDA ===
  unidades: UnidadMed[] = [];
  nuevaUnidad: UnidadMed = { nombre: '', abreviatura: '' };
  editandoUnidad: UnidadMed | null = null;
  mostrarModalUnidad = false;

  // === 🛒 PRODUCTOS ===
  productos: any[] = [];
  nuevoProducto: Producto = this.resetProducto();
  editandoProducto: any = null;
  mostrarModalProducto = false;

  // === 💰 EDITAR PRECIO ===
  productoEditandoPrecio: any = null;
  nuevoPrecio: number = 0;
  motivoCambioPrecio: string = '';
  mostrarModalPrecio = false;

  proveedores: Proveedor[] = [];

  // === 🔍 FILTRO Y BÚSQUEDA ===
  search: string = '';
  selectedCategory: string = 'Todas las categorías';

  // === 📄 PAGINACIÓN ===
  paginaActualActivos = 1;
  paginaActualInactivos = 1;
  itemsPorPagina = 10;

  // === 👁️ MOSTRAR TABLA INACTIVOS ===
  mostrarInactivos = false;

  constructor(
    private categoriaService: CategoriaService,
    private unidadMedService: UnidadMedService,
    private productoService: ProductoService,
    private proveedorService: ProveedorService,
    private exportService: ExportService,
    private toastService: ToastService,
    private authService: AuthService
  ) { }



  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarUnidades();
    this.cargarProveedores();
    this.cargarProductos();
  }

  // ==================== REPORTES ====================
  get totalProductos(): number {
    return this.productos.length;
  }

  get productosActivosCount(): number {
    return this.productos.filter(p => p.estado === true).length;
  }

  get productosInactivosCount(): number {
    return this.productos.filter(p => p.estado === false).length;
  }

  get productosConStockBajo(): number {
    return this.productos.filter(p => p.estado === true && p.stockActual <= p.stockMinimo).length;
  }

  get totalUnidadesStock(): number {
    return this.productos.filter(p => p.estado === true).reduce((total, p) => total + (p.stockActual || 0), 0);
  }

  get promedioPrecio(): number {
    const activos = this.productos.filter(p => p.estado === true);
    if (activos.length === 0) return 0;
    const suma = activos.reduce((total, p) => total + (p.precioBase || 0), 0);
    return suma / activos.length;
  }

  get valorTotalInventario(): number {
    return this.productos.filter(p => p.estado === true).reduce((total, producto) => {
      return total + (producto.precioBase * producto.stockActual);
    }, 0);
  }

  // ==================== ALERTAS ====================
  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info') {
    const toastType: 'success' | 'error' | 'info' = tipo === 'exito' ? 'success' : tipo as 'error' | 'info';
    if (toastType === 'success') {
      this.toastService.success(mensaje);
    } else if (toastType === 'error') {
      this.toastService.error(mensaje);
    } else {
      this.toastService.info(mensaje);
    }
  }

  private obtenerMensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error?.message) {
        return error.error.message;
      }

      if (error.error?.error) {
        return error.error.error;
      }

      if (error.message) {
        return error.message;
      }
    }

    return fallback;
  }

  // ==================== CAMBIO DE TABS ====================
  cambiarTab(tab: 'productos' | 'reportes') {
    this.activeTab = tab;
  }

  // ==================== CRUD CATEGORÍAS ====================
  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data: Categoria[]) => {
        this.categorias = data;
        console.log('📂 Categorías cargadas:', this.categorias);
      },
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
            this.cerrarModalCategoria();
            this.mostrarAlerta('Categoría actualizada correctamente', 'exito');
          },
          error: (err) => this.mostrarAlerta(err.error?.message || 'Error al actualizar categoría', 'error')
        });
    } else {
      this.categoriaService.crear(this.nuevaCategoria).subscribe({
        next: () => {
          this.cargarCategorias();
          this.nuevaCategoria = { nombre: '', descripcion: '' };
          this.cerrarModalCategoria();
          this.mostrarAlerta('Categoría creada correctamente', 'exito');
        },
        error: (err) => this.mostrarAlerta(err.error?.message || 'Error al crear categoría', 'error')
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
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
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
      next: (data: UnidadMed[]) => {
        this.unidades = data;
        console.log('⚖️ Unidades cargadas:', this.unidades);
      },
      error: () => this.mostrarAlerta('Error al cargar unidades', 'error')
    });
  }

  guardarUnidad() {
    if (this.editandoUnidad) {
      this.unidadMedService.actualizar(this.editandoUnidad.idUnidadMed!, this.nuevaUnidad).subscribe({
        next: () => {
          this.cargarUnidades();
          this.cancelarEdicionUnidad();
          this.cerrarModalUnidad();
          this.mostrarAlerta('Tipo actualizado correctamente', 'exito');
        },
        error: (err) => this.mostrarAlerta(err.error?.message || 'Error al actualizar unidad', 'error')
      });
    } else {
      this.unidadMedService.crear(this.nuevaUnidad).subscribe({
        next: () => {
          this.cargarUnidades();
          this.nuevaUnidad = { nombre: '', abreviatura: '' };
          this.cerrarModalUnidad();
          this.mostrarAlerta('Tipo creado correctamente', 'exito');
        },
        error: (err) => this.mostrarAlerta(err.error?.message || 'Error al crear unidad', 'error')
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
    if (confirm('¿Estás seguro de eliminar esta unidad?')) {
      this.unidadMedService.eliminar(id).subscribe({
        next: () => {
          this.cargarUnidades();
          this.mostrarAlerta('Tipo eliminado correctamente', 'exito');
        },
        error: () => this.mostrarAlerta('Error al eliminar unidad', 'error')
      });
    }
  }

  // ==================== CRUD PRODUCTOS ====================
  cargarProductos() {
    this.productoService.listar().subscribe({
      next: (data: any[]) => {
        console.log('📦 PRODUCTOS CARGADOS RAW:', data);
        console.log('📦 PRIMER PRODUCTO COMPLETO:', data[0]);

        this.productos = data.map(producto => {
          const estadoOriginal = producto.estado;

          // 🔧 LÓGICA MEJORADA DE NORMALIZACIÓN
          let estadoNormalizado: boolean;

          if (estadoOriginal === undefined || estadoOriginal === null) {
            // Si no está definido, asumir ACTIVO por defecto
            estadoNormalizado = true;
            console.log(`⚠️ ${producto.nombre}: estado undefined/null -> ACTIVO por defecto`);
          } else if (typeof estadoOriginal === 'boolean') {
            // Si ya es boolean, usarlo directamente
            estadoNormalizado = estadoOriginal;
            console.log(`✅ ${producto.nombre}: estado boolean = ${estadoOriginal}`);
          } else if (typeof estadoOriginal === 'string') {
            // Si es string, convertir
            estadoNormalizado = estadoOriginal.toLowerCase() === 'true' || estadoOriginal === '1';
            console.log(`🔄 ${producto.nombre}: estado string "${estadoOriginal}" -> ${estadoNormalizado}`);
          } else if (typeof estadoOriginal === 'number') {
            // Si es número, 1 = true, 0 = false
            estadoNormalizado = estadoOriginal === 1;
            console.log(`� ${producto.nombre}: estado number ${estadoOriginal} -> ${estadoNormalizado}`);
          } else {
            // Cualquier otro caso, asumir ACTIVO por defecto
            estadoNormalizado = true;
            console.log(`❓ ${producto.nombre}: estado desconocido (${typeof estadoOriginal}) -> ACTIVO por defecto`);
          }

          console.log(`🎯 RESULTADO: ${producto.nombre} = ${estadoNormalizado ? 'ACTIVO' : 'INACTIVO'}`);

          return {
            ...producto,
            estado: estadoNormalizado
          };
        });

        console.log('📦 PRODUCTOS FINALES:', this.productos);

        // 🔄 AUTO-DESACTIVAR productos vencidos o sin stock
        this.productos.forEach(producto => {
          if (producto.estado === true) {
            const vencido = this.esProductoVencido(producto.fechaVencimiento);
            const sinStock = producto.stockActual <= 0;

            if (vencido || sinStock) {
              const motivo = vencido ? 'venció' : 'quedó sin stock';
              console.log(`🔄 Auto-desactivando: ${producto.nombre} (${motivo})`);
              this.productoService.actualizarEstado(producto.idProducto, false, 'sistema').subscribe({
                next: () => {
                  producto.estado = false;
                  this.toastService.warning(`⚠️ "${producto.nombre}" se desactivó porque ${motivo}`, 7000);
                  console.log(`✅ ${producto.nombre} desactivado automáticamente`);
                },
                error: (err) => console.error(`❌ Error desactivando ${producto.nombre}:`, err)
              });
            }
          }
        });

        // Mostrar resumen de estados
        const activos = this.productos.filter(p => p.estado).length;
        const inactivos = this.productos.filter(p => !p.estado).length;
        console.log(`📊 RESUMEN FINAL: ${activos} activos, ${inactivos} inactivos de ${this.productos.length} total`);

        // 🚨 ALERTA SI TODOS ESTÁN INACTIVOS (SOSPECHOSO)
        if (this.productos.length > 0 && activos === 0) {
          console.error('🚨 PROBLEMA: Todos los productos están INACTIVOS - revisar backend!');
          this.mostrarAlerta('⚠️ Todos los productos aparecen como INACTIVOS. Revisa la base de datos.', 'error');
        }
      },
      error: (err) => {
        console.error('❌ Error cargando productos:', err);
        this.mostrarAlerta('❌ Error al cargar productos', 'error');
      }
    });
  }

  cargarProveedores() {
    this.proveedorService.listar().subscribe({
      next: (data: any[]) => {
        this.proveedores = data.map(proveedor => ({
          idProveedor: proveedor.idProveedor,
          nombre: proveedor.nombre || proveedor.razonSocial || 'Sin nombre',
          contacto: proveedor.contacto,
          telefono: proveedor.telefono,
          email: proveedor.email,
          direccion: proveedor.direccion,
          estado: proveedor.estado
        }));
        console.log('👥 Proveedores cargados:', this.proveedores);
      },
      error: () => this.mostrarAlerta('Error al cargar proveedores', 'error')
    });
  }

  guardarProducto() {
    console.log('💾 Intentando guardar producto:', this.nuevoProducto);
    console.log('💾 Modo edición:', this.editandoProducto ? 'SÍ' : 'NO');

    if (!this.nuevoProducto.categoriaId || this.nuevoProducto.categoriaId === 0) {
      this.mostrarAlerta('❌ La Categoría es obligatoria', 'error');
      return;
    }
    if (!this.nuevoProducto.unidadMedidaId || this.nuevoProducto.unidadMedidaId === 0) {
      this.mostrarAlerta('❌ El Tipo es obligatorio', 'error');
      return;
    }
    if (!this.nuevoProducto.nombre || this.nuevoProducto.nombre.trim() === '') {
      this.mostrarAlerta('❌ El Nombre del producto es obligatorio', 'error');
      return;
    }

    // 🔧 ASEGURAR QUE EL ESTADO ESTÉ DEFINIDO
    if (this.nuevoProducto.estado === undefined) {
      this.nuevoProducto.estado = true;
      console.log('🔧 Estado establecido por defecto a true');
    }

    console.log('💾 Datos validados, procediendo a guardar...');
    console.log('💾 Estado del producto:', this.nuevoProducto.estado);

    if (this.editandoProducto) {
      console.log('🔄 Actualizando producto ID:', this.editandoProducto.idProducto);
      const username = this.authService.currentUserValue?.username || 'admin';
      this.productoService.actualizar(this.editandoProducto.idProducto!, this.nuevoProducto, username)
        .subscribe({
          next: (response) => {
            console.log('✅ Producto actualizado:', response);
            this.cargarProductos();
            this.cancelarEdicionProducto();
            this.cerrarModalProducto();
            this.mostrarAlerta('✅ Producto actualizado correctamente', 'exito');
          },
          error: (err) => {
            console.error('❌ Error completo:', err);
            console.error('❌ Error status:', err.status);
            console.error('❌ Error body:', err.error);
            const mensaje = err.error?.message || err.error?.error || err.message || 'Error desconocido';
            this.mostrarAlerta(`❌ Error al actualizar: ${mensaje}`, 'error');
          }
        });
    } else {
      this.productoService.crear(this.nuevoProducto).subscribe({
        next: (response) => {
          console.log('✅ Producto creado:', response);
          this.cargarProductos();
          this.nuevoProducto = this.resetProducto();
          this.cerrarModalProducto();
          this.mostrarAlerta('✅ Producto creado correctamente (Estado: Activo)', 'exito');
        },
        error: (err) => {
          console.error('❌ Error creando producto:', err);
          this.mostrarAlerta(
            `❌ Error al crear: ${err.error?.message || err.error?.error || err.message || 'Error desconocido'}`,
            'error'
          );
        }
      });
    }
  }

  editarProducto(p: any) {
    console.log('✏️ Editando producto:', p);

    // 🔒 REGLA DE NEGOCIO: No se puede editar un producto vencido
    if (this.esProductoVencido(p.fechaVencimiento)) {
      this.mostrarAlerta('❌ No se puede editar un producto vencido. Por favor, elimine el producto o actualice su fecha de vencimiento.', 'error');
      return;
    }

    this.editandoProducto = p;
    this.nuevoProducto = {
      nombre: p.nombre,
      descripcion: p.descripcion,
      codigo: p.codigo,
      precioBase: p.precioBase,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      categoriaId: p.categoriaId || p.categoria?.idCategoria || 0,
      unidadMedidaId: p.unidadMedidaId || p.unidadMedida?.idUnidadMed || 0,
      proveedorId: p.proveedorId || p.proveedor?.idProveedor || null,
      precioCompra: p.precioCompra || 0,
      fechaVencimiento: p.fechaVencimiento ? p.fechaVencimiento.split('T')[0] : '',
      estado: p.estado !== undefined ? p.estado : true
    };
    console.log('✏️ Datos mapeados para edición:', this.nuevoProducto);
    this.abrirModalProducto();
  }

  cancelarEdicionProducto() {
    this.editandoProducto = null;
    this.nuevoProducto = this.resetProducto();
  }

  eliminarProducto(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.productoService.eliminar(id).subscribe({
        next: () => {
          this.cargarProductos();
          this.mostrarAlerta('Producto eliminado correctamente', 'exito');
        },
        error: () => this.mostrarAlerta('Error al eliminar producto', 'error')
      });
    }
  }

  // ==================== TOGGLE ESTADO PRODUCTO ====================
  toggleEstadoProducto(producto: any) {
    // 🔒 REGLA DE NEGOCIO: No se puede cambiar estado de un producto vencido
    if (this.esProductoVencido(producto.fechaVencimiento)) {
      this.mostrarAlerta('❌ No se puede cambiar el estado de un producto vencido.', 'error');
      return;
    }

    // 🔒 REGLA DE NEGOCIO: No se puede activar un producto sin stock
    if (!producto.estado && producto.stockActual <= 0) {
      this.mostrarAlerta('❌ No se puede activar un producto sin stock.', 'error');
      return;
    }

    console.log('🔄 Toggle Estado - Producto actual:', producto);
    console.log('🔄 Estado anterior:', producto.estado);

    const nuevoEstado = !producto.estado;
    const usuario = 'admin';

    console.log('🔄 Nuevo estado:', nuevoEstado);
    console.log('🔄 Enviando petición PATCH a backend...');

    this.productoService.actualizarEstado(producto.idProducto, nuevoEstado, usuario)
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del backend:', response);

          // Actualizar en la lista local
          const index = this.productos.findIndex(p => p.idProducto === producto.idProducto);
          if (index !== -1) {
            this.productos[index].estado = nuevoEstado;
          }
          producto.estado = nuevoEstado;

          this.mostrarAlerta(
            `🔄 ${producto.nombre}: ${nuevoEstado ? '✅ ACTIVADO' : '❌ DESACTIVADO'}`,
            'exito'
          );

          console.log('✅ Estado actualizado exitosamente');
        },
        error: (err) => {
          console.error('❌ Error completo:', err);
          console.error('❌ Error status:', err.status);
          console.error('❌ Error message:', err.message);
          console.error('❌ Error body:', err.error);

          this.mostrarAlerta(
            `❌ Error al cambiar estado: ${err.error || err.message || 'Error desconocido'}`,
            'error'
          );
        }
      });
  }

  // ==================== EDITAR PRECIO ====================
  abrirModalPrecio(producto: any) {
    // 🔒 REGLA DE NEGOCIO: No se puede editar precio de un producto vencido
    if (this.esProductoVencido(producto.fechaVencimiento)) {
      this.mostrarAlerta('❌ No se puede editar el precio de un producto vencido.', 'error');
      return;
    }

    this.productoEditandoPrecio = producto;
    this.nuevoPrecio = producto.precioBase || 0;
    this.motivoCambioPrecio = '';
    this.mostrarModalPrecio = true;
  }

  cerrarModalPrecio() {
    this.mostrarModalPrecio = false;
    this.nuevoPrecio = 0;
    this.motivoCambioPrecio = '';
  }

  actualizarPrecio() {
    if (!this.productoEditandoPrecio || this.nuevoPrecio <= 0) {
      this.mostrarAlerta('Precio inválido', 'error');
      return;
    }

    const username = this.authService.currentUserValue?.username || 'admin';
    const productoEditado = this.productoEditandoPrecio;
    this.productoService.actualizarPrecio(productoEditado.idProducto, this.nuevoPrecio, username)
      .subscribe({
        next: () => {
          productoEditado.precioBase = this.nuevoPrecio;
          productoEditado.precio = this.nuevoPrecio;
          this.cerrarModalPrecio();
          this.mostrarAlerta('Precio actualizado correctamente', 'exito');
          console.log(`💰 Precio actualizado: ${this.productoEditandoPrecio.nombre} - $${this.nuevoPrecio}`);
        },
        error: (err) => {
          console.error('Error al actualizar precio:', err);
          this.mostrarAlerta(this.obtenerMensajeError(err, 'Error al actualizar precio'), 'error');
        }
      });
  }

  // ==================== FILTRADO VISIBLE ====================
  get filteredActiveProducts() {
    const q = (this.search || '').trim().toLowerCase();

    // Filtrar SOLO productos activos según búsqueda y categoría
    const filtered = (this.productos || []).filter((p: any) => {
      if (p.estado !== true) return false; // Solo activos

      const catName = p.categoriaNombre || p.categoria?.nombre || '';
      const matchesCategory =
        this.selectedCategory === 'Todas las categorías' || catName === this.selectedCategory;
      const matchesSearch =
        !q ||
        (p.nombre || '').toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        (p.codigo || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    // Ordenar alfabéticamente
    return filtered.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }

  // ==================== PRODUCTOS ACTIVOS PAGINADOS ====================
  get productosActivosPaginados() {
    const inicio = (this.paginaActualActivos - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.filteredActiveProducts.slice(inicio, fin);
  }

  get totalPaginasActivos() {
    return Math.ceil(this.filteredActiveProducts.length / this.itemsPorPagina);
  }

  get paginasArrayActivos(): number[] {
    return Array.from({ length: this.totalPaginasActivos }, (_, i) => i + 1);
  }

  cambiarPaginaActivos(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginasActivos) {
      this.paginaActualActivos = pagina;
    }
  }

  // ==================== PRODUCTOS INACTIVOS ====================
  get productosInactivos() {
    const q = (this.search || '').trim().toLowerCase();

    // Filtrar SOLO productos inactivos
    return (this.productos || []).filter((p: any) => {
      if (p.estado !== true) {
        const catName = p.categoriaNombre || p.categoria?.nombre || '';
        const matchesCategory =
          this.selectedCategory === 'Todas las categorías' || catName === this.selectedCategory;
        const matchesSearch =
          !q ||
          (p.nombre || '').toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q) ||
          (p.codigo || '').toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      }
      return false;
    }).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }

  // ==================== PRODUCTOS INACTIVOS PAGINADOS ====================
  get productosInactivosPaginados() {
    const inicio = (this.paginaActualInactivos - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.productosInactivos.slice(inicio, fin);
  }

  get totalPaginasInactivos() {
    return Math.ceil(this.productosInactivos.length / this.itemsPorPagina);
  }

  get paginasArrayInactivos(): number[] {
    return Array.from({ length: this.totalPaginasInactivos }, (_, i) => i + 1);
  }

  cambiarPaginaInactivos(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginasInactivos) {
      this.paginaActualInactivos = pagina;
    }
  }

  toggleMostrarInactivos() {
    this.mostrarInactivos = !this.mostrarInactivos;
  }

  // ==================== METADATA PARA COMPATIBILIDAD ====================
  get visibleProducts() {
    return this.filteredActiveProducts;
  }

  // ==================== PRODUCTOS ACTIVOS PARA MOVIMIENTOS ====================
  get productosActivos() {
    return (this.productos || []).filter((p: any) => p.estado === true);
  }

  // ==================== MODALES ====================
  abrirModalUnidad() {
    this.mostrarModalUnidad = true;
  }

  cerrarModalUnidad() {
    this.mostrarModalUnidad = false;
    this.cancelarEdicionUnidad();
  }

  abrirModalCategoria() {
    this.mostrarModalCategoria = true;
  }

  cerrarModalCategoria() {
    this.mostrarModalCategoria = false;
    this.cancelarEdicionCategoria();
  }

  abrirModalProducto() {
    this.mostrarModalProducto = true;
  }

  cerrarModalProducto() {
    this.mostrarModalProducto = false;
    this.cancelarEdicionProducto();
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
      fechaVencimiento: '',
      estado: true  // 🔧 Estado por defecto ACTIVO
    };
  }

  esProductoVencido(fechaVencimiento: string): boolean {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    return vencimiento < hoy;
  }

  // ==================== MÉTODOS DE EXPORTACIÓN ====================

  exportarPDF(): void {
    // 🔥 SOLO EXPORTAR PRODUCTOS ACTIVOS (los inactivos son como eliminados)
    const productosParaExportar = this.visibleProducts.filter(p => p.estado === true);

    const columns = [
      { header: 'Código', field: 'codigo', width: 60 },
      { header: 'Producto', field: 'nombre', width: 100 },
      { header: 'Categoría', field: 'categoria.nombre', width: 70 },
      { header: 'Precio Base', field: 'precioBase', width: 50 },
      { header: 'Stock Actual', field: 'stockActual', width: 40 },
      { header: 'Stock Mínimo', field: 'stockMinimo', width: 40 },
      { header: 'Tipo', field: 'unidadMedida.abreviatura', width: 40 },
      { header: 'Vencimiento', field: 'fechaVencimiento', width: 60 }
    ];

    this.exportService.exportToPDF(
      productosParaExportar,
      columns,
      'inventario_productos_activos',
      'Reporte de Inventario - Productos Activos'
    );

    this.mostrarAlerta(
      `📄 PDF exportado: ${productosParaExportar.length} productos activos`,
      'exito'
    );
  }

  exportarExcel(): void {
    // 🔥 SOLO EXPORTAR PRODUCTOS ACTIVOS (los inactivos son como eliminados)
    const productosParaExportar = this.visibleProducts.filter(p => p.estado === true);

    const columns = [
      { header: 'Código', field: 'codigo', width: 15 },
      { header: 'Producto', field: 'nombre', width: 25 },
      { header: 'Descripción', field: 'descripcion', width: 30 },
      { header: 'Categoría', field: 'categoria.nombre', width: 18 },
      { header: 'Precio Base', field: 'precioBase', width: 15 },
      { header: 'Precio Compra', field: 'precioCompra', width: 15 },
      { header: 'Stock Actual', field: 'stockActual', width: 12 },
      { header: 'Stock Mínimo', field: 'stockMinimo', width: 12 },
      { header: 'Tipo', field: 'unidadMedida.nombre', width: 15 },
      { header: 'Fecha Vencimiento', field: 'fechaVencimiento', width: 18 },
      { header: 'Proveedor', field: 'proveedor.nombreComercial', width: 20 }
    ];

    this.exportService.exportToExcel(
      productosParaExportar,
      columns,
      'inventario_productos_activos',
      'Productos'
    );

    this.mostrarAlerta(
      `📊 Excel exportado: ${productosParaExportar.length} productos activos`,
      'exito'
    );
  }

}
