import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../models/categoria.model';
import { UnidadMed } from '../../models/unidad-medida.model';
import { Producto } from '../../models/producto.model';
import { HistorialPrecio } from '../../models/historial-precios.model';
import { CategoriaService } from '../../services/categoria.service';
import { UnidadMedService } from '../../services/unidad-medida.service';
import { ProductoService } from '../../services/producto.service';
import { ProveedorService } from '../../services/proveedor.service';
import { ExportService } from '../../services/export.service';
import { HistorialPrecioService } from '../../services/historial-precios.service';
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

  // === ⚠️ ALERTAS ===
  alertaVisible = false;
  alertaMensaje = '';
  alertaTipo: 'exito' | 'error' | 'info' = 'info';

  // === 📜 HISTORIAL DE PRECIOS (HU7) ===
  historialPrecios: HistorialPrecio[] = [];
  productoSeleccionadoHistorial: Producto | null = null;
  mostrarModalHistorial = false;
  cargandoHistorial = false;

  constructor(
    private categoriaService: CategoriaService,
    private unidadMedService: UnidadMedService,
    private productoService: ProductoService,
    private proveedorService: ProveedorService,
    private exportService: ExportService,
    private historialPrecioService: HistorialPrecioService
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

  get valorTotalInventario(): number {
    return this.productos.reduce((total, producto) => {
      return total + (producto.precioBase * producto.stockActual);
    }, 0);
  }

  // ==================== ALERTAS ====================
  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info') {
    this.alertaVisible = true;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    setTimeout(() => (this.alertaVisible = false), 3500);
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
          this.mostrarAlerta('Unidad actualizada correctamente', 'exito');
        },
        error: (err) => this.mostrarAlerta(err.error?.message || 'Error al actualizar unidad', 'error')
      });
    } else {
      this.unidadMedService.crear(this.nuevaUnidad).subscribe({
        next: () => {
          this.cargarUnidades();
          this.nuevaUnidad = { nombre: '', abreviatura: '' };
          this.cerrarModalUnidad();
          this.mostrarAlerta('Unidad creada correctamente', 'exito');
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
          this.mostrarAlerta('Unidad eliminada correctamente', 'exito');
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
    if (!this.nuevoProducto.categoriaId || !this.nuevoProducto.unidadMedidaId) {
      this.mostrarAlerta('Categoría y Unidad de Medida son obligatorios', 'error');
      return;
    }

    // 🔧 ASEGURAR QUE EL ESTADO ESTÉ DEFINIDO
    if (this.nuevoProducto.estado === undefined) {
      this.nuevoProducto.estado = true;
      console.log('🔧 Estado establecido por defecto a true');
    }

    console.log('💾 Guardando producto:', this.nuevoProducto);
    console.log('💾 Estado del producto:', this.nuevoProducto.estado);

    if (this.editandoProducto) {
      this.productoService.actualizar(this.editandoProducto.idProducto!, this.nuevoProducto)
        .subscribe({
          next: (response) => {
            console.log('✅ Producto actualizado:', response);
            // Actualizar en la lista local en lugar de recargar todo
            const index = this.productos.findIndex(p => p.idProducto === this.editandoProducto.idProducto);
            if (index !== -1) {
              this.productos[index] = { ...this.productos[index], ...response };
            }
            this.cancelarEdicionProducto();
            this.cerrarModalProducto();
            this.mostrarAlerta('✅ Producto actualizado correctamente', 'exito');
          },
          error: (err) => {
            console.error('❌ Error actualizando producto:', err);
            this.mostrarAlerta(
              `❌ Error al actualizar: ${err.error?.message || err.error?.error || err.message || 'Error desconocido'}`,
              'error'
            );
          }
        });
    } else {
      this.productoService.crear(this.nuevoProducto).subscribe({
        next: (response) => {
          console.log('✅ Producto creado:', response);
          // Agregar producto nuevo directamente a la lista
          this.productos = [response, ...this.productos];
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
    this.editandoProducto = p;
    this.nuevoProducto = {
      nombre: p.nombre,
      descripcion: p.descripcion,
      codigo: p.codigo,
      precioBase: p.precioBase,
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      categoriaId: p.categoria?.idCategoria || p.categoriaId,
      unidadMedidaId: p.unidadMedida?.idUnidadMed || p.unidadMedidaId,
      proveedorId: p.proveedor?.idProveedor || p.proveedorId,
      precioCompra: p.precioCompra || 0,
      fechaVencimiento: p.fechaVencimiento ? p.fechaVencimiento.split('T')[0] : ''
    };
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
          // Eliminar de la lista local en lugar de recargar
          this.productos = this.productos.filter(p => p.idProducto !== id);
          this.mostrarAlerta('Producto eliminado correctamente', 'exito');
        },
        error: () => this.mostrarAlerta('Error al eliminar producto', 'error')
      });
    }
  }

  // ==================== TOGGLE ESTADO PRODUCTO ====================
  toggleEstadoProducto(producto: any) {
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
    this.productoEditandoPrecio = producto;
    this.nuevoPrecio = producto.precioBase || 0;
    this.motivoCambioPrecio = '';
    this.mostrarModalPrecio = true;
  }

  cerrarModalPrecio() {
    this.mostrarModalPrecio = false;
    this.productoEditandoPrecio = null;
    this.nuevoPrecio = 0;
    this.motivoCambioPrecio = '';
  }

  actualizarPrecio() {
    if (!this.productoEditandoPrecio || this.nuevoPrecio <= 0) {
      this.mostrarAlerta('Precio inválido', 'error');
      return;
    }

    const productoActualizado = {
      ...this.productoEditandoPrecio,
      precioBase: this.nuevoPrecio
    };

    this.productoService.actualizar(this.productoEditandoPrecio.idProducto, productoActualizado)
      .subscribe({
        next: () => {
          this.productoEditandoPrecio.precioBase = this.nuevoPrecio;
          this.cerrarModalPrecio();
          this.mostrarAlerta('Precio actualizado correctamente', 'exito');
          console.log(`💰 Precio actualizado: ${this.productoEditandoPrecio.nombre} - $${this.nuevoPrecio}`);
        },
        error: (err) => {
          console.error('Error al actualizar precio:', err);
          this.mostrarAlerta('Error al actualizar precio', 'error');
        }
      });
  }

  // ==================== FILTRADO VISIBLE ====================
  get visibleProducts() {
    const q = (this.search || '').trim().toLowerCase();

    // Filtrar productos según búsqueda y categoría
    const filtered = (this.productos || []).filter((p: any) => {
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

    // 🗂️ ORDENAR: ACTIVOS PRIMERO, INACTIVOS AL FONDO (como eliminados suaves)
    return filtered.sort((a, b) => {
      // Productos activos (true) van antes que inactivos (false)
      if (a.estado === true && b.estado === false) return -1;
      if (a.estado === false && b.estado === true) return 1;

      // Si tienen el mismo estado, ordenar por nombre alfabéticamente
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
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

  // ⏰ MÉTODO NUEVO: Verificar si está próximo a vencer (30 días)
  esProductoProximoAVencer(fechaVencimiento: string): boolean {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasFaltantes = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
    return diasFaltantes > 0 && diasFaltantes <= 30;
  }

  // ⏰ MÉTODO NUEVO: Obtener días para vencimiento
  getDiasParaVencer(fechaVencimiento: string): number {
    if (!fechaVencimiento) return 999;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    return Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
  }

  // ⏰ MÉTODO NUEVO: Obtener clase CSS para estado de vencimiento
  getClaseVencimiento(fechaVencimiento: string): string {
    if (this.esProductoVencido(fechaVencimiento)) return 'vencido';
    if (this.esProductoProximoAVencer(fechaVencimiento)) return 'proximo-vencer';
    return 'vigente';
  }

  // ⏰ MÉTODO NUEVO: Contar productos vencidos y próximos a vencer
  get productosVencidos(): any[] {
    return this.productos.filter(p => p.estado && this.esProductoVencido(p.fechaVencimiento));
  }

  get productosProximosAVencer(): any[] {
    return this.productos.filter(p => p.estado && this.esProductoProximoAVencer(p.fechaVencimiento));
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
      { header: 'Unidad', field: 'unidadMedida.abreviatura', width: 40 },
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
      { header: 'Unidad', field: 'unidadMedida.nombre', width: 15 },
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

  // ==================== HISTORIAL DE PRECIOS (HU7) ====================
  abrirHistorialPrecios(producto: Producto): void {
    this.productoSeleccionadoHistorial = producto;
    this.mostrarModalHistorial = true;
    this.cargarHistorialPrecios(producto.idProducto!);
  }

  cargarHistorialPrecios(productoId: number): void {
    this.cargandoHistorial = true;
    this.historialPrecios = [];

    this.historialPrecioService.obtenerPorProducto(productoId).subscribe({
      next: (data) => {
        this.historialPrecios = data.sort((a, b) => new Date(b.fechaCambio).getTime() - new Date(a.fechaCambio).getTime());
        this.cargandoHistorial = false;
      },
      error: (err) => {
        console.error('Error cargando historial:', err);
        this.mostrarAlerta('No hay historial de cambios para este producto', 'info');
        this.cargandoHistorial = false;
      }
    });
  }

  cerrarHistorialPrecios(): void {
    this.mostrarModalHistorial = false;
    this.productoSeleccionadoHistorial = null;
    this.historialPrecios = [];
  }

  calcularVariacion(historial: HistorialPrecio): number {
    if (historial.precioAnterior === 0) return 0;
    return ((historial.precioNuevo - historial.precioAnterior) / historial.precioAnterior) * 100;
  }

  obtenerClaseVariacion(variacion: number): string {
    if (variacion > 0) return 'variacion-aumento';
    if (variacion < 0) return 'variacion-descuento';
    return 'variacion-igual';
  }

  get totalCambiosPrecio(): number {
    return this.historialPrecios.length;
  }

  get precioPromedio(): number {
    if (this.historialPrecios.length === 0) return 0;
    const suma = this.historialPrecios.reduce((acc, h) => acc + h.precioNuevo, 0);
    return suma / this.historialPrecios.length;
  }

}