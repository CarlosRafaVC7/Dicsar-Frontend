import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Models
import { Producto } from '../../models/producto.model';
import { HistorialPrecio } from '../../models/historial-precios.model';
import { Categoria } from '../../models/categoria.model';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { HistorialPrecioService } from '../../services/historial-precios.service';
import { ToastService } from '../../services/toast.service';


@Component({
  selector: 'app-historial-precios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-precios.component.html',
  styleUrls: ['./historial-precios.component.css']
})
export class HistorialPreciosComponent implements OnInit {

  // === 📊 DATOS ===
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  historialPrecios: HistorialPrecio[] = [];
  
  // === 🎛️ FILTROS ===
  productoSeleccionadoId: number | null = null;
  productoSearchTerm: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroCategoriaId: number | null = null;
  paginaActualHistorial = 0;
  itemsPorPaginaHistorial = 10;
  
  // === ⚠️ ESTADOS ===
  cargando: boolean = false;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private historialPrecioService: HistorialPrecioService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: data => this.categorias = data.filter((c: Categoria) => c.estado !== false),
      error: () => this.mostrarAlerta('Error al cargar categorías', 'error')
    });
  }

  // === 📥 CARGAR DATOS ===
  cargarProductos(): void {
    this.cargando = true;
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos = data.filter((p: Producto) => p.estado === true);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.mostrarAlerta('Error al cargar productos', 'error');
        this.cargando = false;
      }
    });
  }

  get productosFiltrados(): Producto[] {
    const term = this.productoSearchTerm.trim().toLowerCase();
    let resultado = this.productos;

    if (this.filtroCategoriaId) {
      resultado = resultado.filter(p => p.categoriaId === this.filtroCategoriaId);
    }

    if (term) {
      resultado = resultado.filter(p =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.codigo || '').toLowerCase().includes(term)
      );
    }

    return resultado.slice(0, 10);
  }

  cargarHistorialPrecios(): void {
    if (!this.productoSeleccionadoId) {
      this.mostrarAlerta('Selecciona un producto primero', 'info');
      return;
    }

    this.cargando = true;
    this.paginaActualHistorial = 0;

    this.historialPrecioService.obtenerConFiltros({
      productoId: this.productoSeleccionadoId,
      fechaInicio: this.fechaInicio || undefined,
      fechaFin: this.fechaFin || undefined
    }).subscribe({
      next: (data) => {
        this.historialPrecios = data || [];
        this.cargando = false;
        
        if (this.historialPrecios.length === 0) {
          this.mostrarAlerta('No hay historial de precios para este producto en el período seleccionado', 'info');
        }
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.mostrarAlerta(err?.message || 'Error al cargar historial de precios', 'error');
        this.cargando = false;
        this.historialPrecios = [];
      }
    });
  }

  // === 🎛️ FILTRADO ===
  filtrarPorFechas(historial: HistorialPrecio[]): HistorialPrecio[] {
    if (!this.fechaInicio && !this.fechaFin) {
      return historial;
    }

    return historial.filter(item => {
      const fechaCambio = new Date(item.fechaCambio);
      const inicio = this.fechaInicio ? new Date(this.fechaInicio) : null;
      const fin = this.fechaFin ? new Date(this.fechaFin) : null;

      let cumpleInicio = true;
      let cumpleFin = true;

      if (inicio) {
        cumpleInicio = fechaCambio >= inicio;
      }

      if (fin) {
        // Ajustar fin para incluir todo el día
        const finAjustado = new Date(fin);
        finAjustado.setHours(23, 59, 59, 999);
        cumpleFin = fechaCambio <= finAjustado;
      }

      return cumpleInicio && cumpleFin;
    });
  }

  aplicarFiltros(): void {
    if (!this.productoSeleccionadoId) {
      this.mostrarAlerta('Selecciona un producto antes de filtrar', 'info');
      return;
    }
    this.paginaActualHistorial = 0;
    this.cargarHistorialPrecios();
  }

  limpiarFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.productoSearchTerm = '';
    if (this.productoSeleccionadoId) {
      this.paginaActualHistorial = 0;
      this.cargarHistorialPrecios();
    }
  }

  // === 📈 CÁLCULOS ===
  calcularVariacion(historial: HistorialPrecio): number {
    if (historial.precioAnterior === 0) return 0;
    return ((historial.precioNuevo - historial.precioAnterior) / historial.precioAnterior) * 100;
  }

  obtenerNombreProductoSeleccionado(): string {
    if (!this.productoSeleccionadoId) return '';
    const producto = this.productos.find(p => p.idProducto === this.productoSeleccionadoId);
    return producto ? `${producto.nombre} - ${producto.codigo}` : '';
  }

  // === ⚠️ ALERTAS ===
  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info'): void {
    const toastType: 'success' | 'error' | 'info' = tipo === 'exito' ? 'success' : tipo as 'error' | 'info';
    if (toastType === 'success') {
      this.toastService.success(mensaje);
    } else if (toastType === 'error') {
      this.toastService.error(mensaje);
    } else {
      this.toastService.info(mensaje);
    }
  }

  // === 🧭 NAVEGACIÓN ===
  volverAInventario(): void {
    this.router.navigate(['/inventario']);
  }

  // === 🎯 GETTERS ÚTILES ===
  get totalRegistros(): number {
    return this.historialPrecios.length;
  }

  get totalPaginasHistorial(): number {
    return Math.max(1, Math.ceil(this.historialPrecios.length / this.itemsPorPaginaHistorial));
  }

  get paginasHistorialArray(): number[] {
    return Array.from({ length: this.totalPaginasHistorial }, (_, i) => i + 1);
  }

  get historialPagina(): HistorialPrecio[] {
    const inicio = this.paginaActualHistorial * this.itemsPorPaginaHistorial;
    return this.historialPrecios.slice(inicio, inicio + this.itemsPorPaginaHistorial);
  }

  cambiarPaginaHistorial(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalPaginasHistorial) {
      this.paginaActualHistorial = pagina;
    }
  }

  get precioActual(): number {
    if (!this.productoSeleccionadoId || this.historialPrecios.length === 0) return 0;
    return this.historialPrecios[0].precioNuevo; // El más reciente
  }

  get precioMasAntiguo(): number {
    if (this.historialPrecios.length === 0) return 0;
    return this.historialPrecios[this.historialPrecios.length - 1].precioAnterior;
  }

  get variacionTotal(): number {
    if (this.historialPrecios.length < 2) return 0;
    const primerPrecio = this.historialPrecios[this.historialPrecios.length - 1].precioAnterior;
    const ultimoPrecio = this.historialPrecios[0].precioNuevo;
    
    if (primerPrecio === 0) return 0;
    return ((ultimoPrecio - primerPrecio) / primerPrecio) * 100;
  }
}