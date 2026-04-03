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
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroCategoriaId: number | null = null;
  
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
    let resultado = this.productos;
    
    if (this.filtroCategoriaId) {
      resultado = resultado.filter(p => p.categoriaId === this.filtroCategoriaId);
    }
    
    return resultado.slice(0, 10);
  }

  cargarHistorialPrecios(): void {
    if (!this.productoSeleccionadoId) {
      this.mostrarAlerta('Selecciona un producto primero', 'info');
      return;
    }

    this.cargando = true;
    this.historialPrecioService.obtenerPorProducto(this.productoSeleccionadoId).subscribe({
      next: (data) => {
        this.historialPrecios = this.filtrarPorFechas(data);
        this.cargando = false;
        
        if (this.historialPrecios.length === 0) {
          this.mostrarAlerta('No hay historial de precios para este producto', 'info');
        }
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        this.mostrarAlerta('Error al cargar historial de precios', 'error');
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
    if (this.historialPrecios.length > 0) {
      // Re-aplicar filtros si ya hay datos cargados
      const historialCompleto = [...this.historialPrecios];
      this.historialPrecios = this.filtrarPorFechas(historialCompleto);
    } else {
      this.cargarHistorialPrecios();
    }
  }

  limpiarFiltros(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    if (this.productoSeleccionadoId) {
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