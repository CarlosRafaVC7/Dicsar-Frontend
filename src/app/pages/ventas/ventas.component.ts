import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoService } from '../../services/movimiento.service';
import { ProductoService } from '../../services/producto.service';
import { CategoriaService } from '../../services/categoria.service';
import { ToastService } from '../../services/toast.service';
import { Producto } from '../../models/producto.model';
import { Movimiento } from '../../models/movimientos.model';
import { Categoria } from '../../models/categoria.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {

  // === 🧭 CONTROL DE TABS ===
  activeTab: 'salidas' | 'historial' = 'salidas';

  // === 📦 DATOS ===
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  movimientos: Movimiento[] = [];
  nuevoMovimiento: Movimiento = this.resetMovimiento();

  // === 📄 PAGINACIÓN ===
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;

  // === 📋 TIPOS DE MOVIMIENTO ===
  tiposMovimiento = ['ENTRADA', 'SALIDA', 'AJUSTE'] as const;

  // === 🧠 ESTADO ===
  cargando = false;
  mensajeError = '';

  // Modal nuevo movimiento
  mostrarModalMovimiento: boolean = false;
// === Modal eliminar movimiento ===
mostrarModalEliminar: boolean = false;
movimientoAEliminar: Movimiento | null = null;

  // Búsqueda y filtro en histórico
  searchMov: string = '';
  filterTipo: 'TODOS' | 'ENTRADA' | 'SALIDA' | 'AJUSTE' = 'TODOS';
  // Filtros de producto en modal
  filtroCategoriaId: number | null = null;
  // Arrays filtrados para “tablitas”
  entradas: Movimiento[] = [];
  salidas: Movimiento[] = [];
  ajustes: Movimiento[] = [];
  constructor(
    private movimientoService: MovimientoService,
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarHistorial();
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: data => this.categorias = data.filter((c: Categoria) => c.estado !== false),
      error: () => this.mensajeError = 'Error al cargar categorías'
    });
  }

  cambiarTab(tab: 'salidas' | 'historial') {
    this.activeTab = tab;
    if (tab === 'historial') this.cargarHistorial();
  }

  // ==================== CARGA DE DATOS ====================
  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: data => this.productos = data.filter((p: Producto) => p.estado === true),
      error: () => this.mensajeError = 'Error al cargar productos'
    });
  }

  cargarHistorial(): void {
    this.movimientoService.listar().subscribe({
      next: data => {
        console.log('📦 Movimientos recibidos del backend:', data);
        if (data && data.length > 0) {
          console.log('📦 Primer movimiento:', data[0]);
          console.log('📦 Tipos de movimiento:', data.map(m => m.tipoMovimiento));
          console.log('📦 Cantidades:', data.map(m => m.cantidad));
        }
        this.movimientos = data;
        this.actualizarTablas();
      },
      error: () => this.mensajeError = 'Error al cargar movimientos'
    });
  }
  exportarPDF() {
  const doc = new jsPDF();
  (doc as any).autoTable({
    head: [['ID', 'Fecha', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Usuario']],
    body: this.movimientosFiltrados.map(m => [
      m.idMovimiento,
      m.fechaMovimiento ? new Date(m.fechaMovimiento).toLocaleString() : '-',
      m.producto?.nombre,
      m.producto?.codigo || '-',
      m.tipoMovimiento,
      m.cantidad,
      m.usuarioMovimiento || '---'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    startY: 20
  });

  doc.text('Reporte de Movimientos', 14, 15);
  doc.save('reporte_movimientos.pdf');
}

  // ==================== CRUD MOVIMIENTOS ====================
  registrarMovimiento(): void {
    if (!this.nuevoMovimiento.producto?.idProducto || this.nuevoMovimiento.cantidad <= 0) {
      this.toastService.error('Debes seleccionar un producto y una cantidad válida');
      return;
    }

    // Validarstock para salidas
    if (this.nuevoMovimiento.tipoMovimiento === 'SALIDA') {
      const stockActual = this.nuevoMovimiento.producto.stockActual || 0;
      if (this.nuevoMovimiento.cantidad > stockActual) {
        this.toastService.error(`No puedes extraer ${this.nuevoMovimiento.cantidad} unidades. Stock actual: ${stockActual}`);
        return;
      }
    }

    this.movimientoService.crear(this.nuevoMovimiento, 'admin').subscribe({
      next: () => {
        this.nuevoMovimiento = this.resetMovimiento();
        this.cargarHistorial();
        this.actualizarTablas();
        this.mostrarModalMovimiento = false;
        this.toastService.success('Movimiento registrado exitosamente');
      },
      error: () => this.toastService.error('Error al registrar el movimiento')
    });
  }
// Mostrar movimiento en modal
verMovimiento(m: Movimiento) {
  this.nuevoMovimiento = { ...m }; // copiamos el movimiento para el modal
  this.abrirModalMovimiento(); // abre tu modal existente
}

eliminarMovimiento(m: Movimiento) {
  console.log('Mov a eliminar:', m);
  if (!m.idMovimiento) {
    this.toastService.error('El movimiento no tiene ID válido');
    return;
  }

  this.movimientoService.eliminar(m.idMovimiento).subscribe({
    next: () => {
      this.movimientos = this.movimientos.filter(x => x.idMovimiento !== m.idMovimiento);
      this.actualizarTablas();
      this.toastService.success('Movimiento eliminado correctamente');
    },
    error: () => this.toastService.error('Error al eliminar el movimiento')
  });
}


// Abrir modal de eliminación
abrirModalEliminar(m: Movimiento) {
  this.movimientoAEliminar = m;
  this.mostrarModalEliminar = true;
}

// Cerrar modal de eliminación
cerrarModalEliminar() {
  this.mostrarModalEliminar = false;
  this.movimientoAEliminar = null;
}

// Confirmar eliminación
confirmarEliminar() {
  if (!this.movimientoAEliminar?.idMovimiento) return;

  this.movimientoService.eliminar(this.movimientoAEliminar.idMovimiento).subscribe({
    next: () => {
      this.movimientos = this.movimientos.filter(x => x.idMovimiento !== this.movimientoAEliminar!.idMovimiento);
      this.actualizarTablas(); // actualizar arrays filtrados
      this.cerrarModalEliminar();
      this.toastService.success('Movimiento eliminado correctamente');
    },
    error: (err) => {
      console.error('Error al eliminar', err);
      this.toastService.error('Error al eliminar el movimiento');
      this.cerrarModalEliminar();
    }
  });
}// Variables para fechas y resultados filtrados
fechaInicio: string = '';
fechaFin: string = '';
movimientosFiltrados: Movimiento[] = [];

aplicarFiltros() {
  let filtrados = [...this.movimientos];

  if (this.filterTipo && this.filterTipo !== 'TODOS') {
    filtrados = filtrados.filter(m => m.tipoMovimiento?.toUpperCase() === this.filterTipo);
  }

  if (this.fechaInicio && this.fechaFin) {
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    fin.setHours(23, 59, 59);

    filtrados = filtrados.filter(m => {
      const fechaMovimiento = new Date(m.fechaMovimiento || '');
      return fechaMovimiento >= inicio && fechaMovimiento <= fin;
    });
  }

  this.movimientosFiltrados = filtrados;
}

limpiarFiltros() {
  this.fechaInicio = '';
  this.fechaFin = '';
  this.movimientosFiltrados = [];
  this.searchMov = '';
  this.filterTipo = 'TODOS';
}




  // ============================
  // Getters auxiliares (estadísticas y filtrado)
  // ============================
  get filteredMovimientos(): Movimiento[] {
    let filtered = (this.movimientos || []);

    const q = (this.searchMov || '').trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(m =>
        (m.producto?.nombre || '').toLowerCase().includes(q) ||
        (m.producto?.codigo || '').toLowerCase().includes(q) ||
        (m.descripcion || '').toLowerCase().includes(q)
      );
    }

    if (this.filterTipo && this.filterTipo !== 'TODOS') {
      filtered = filtered.filter(m => m.tipoMovimiento?.toUpperCase() === this.filterTipo);
    }

    if (this.fechaInicio && this.fechaFin) {
      const inicio = new Date(this.fechaInicio);
      const fin = new Date(this.fechaFin);
      fin.setHours(23, 59, 59);
      filtered = filtered.filter(m => {
        const fechaMovimiento = new Date(m.fechaMovimiento || '');
        return fechaMovimiento >= inicio && fechaMovimiento <= fin;
      });
    }

    this.totalPaginas = Math.ceil(filtered.length / this.itemsPorPagina);
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtered.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get totalEntradas(): number {
    if (!this.movimientos || this.movimientos.length === 0) return 0;
    const total = this.movimientos
      .filter(m => m.tipoMovimiento?.toUpperCase() === 'ENTRADA')
      .reduce((s, m) => s + (Number(m.cantidad) || 0), 0);
    console.log('📊 Total Entradas calculado:', total, 'de', this.movimientos.length, 'movimientos');
    return total;
  }

  get totalSalidas(): number {
    if (!this.movimientos || this.movimientos.length === 0) return 0;
    const total = this.movimientos
      .filter(m => m.tipoMovimiento?.toUpperCase() === 'SALIDA')
      .reduce((s, m) => s + (Number(m.cantidad) || 0), 0);
    console.log('📊 Total Salidas calculado:', total);
    return total;
  }

  get totalAjustes(): number {
    if (!this.movimientos || this.movimientos.length === 0) return 0;
    return this.movimientos
      .filter(m => m.tipoMovimiento?.toUpperCase() === 'AJUSTE')
      .reduce((s, m) => s + Math.abs(Number(m.cantidad) || 0), 0);
  }

  // Métodos para abrir/cerrar modal
  abrirModalMovimiento() { this.mostrarModalMovimiento = true; this.mensajeError = ''; this.filtroCategoriaId = null; }
  cerrarModalMovimiento() { this.mostrarModalMovimiento = false; this.nuevoMovimiento = this.resetMovimiento(); this.mensajeError = ''; }

  get productosFiltradosModal(): Producto[] {
    let resultado = this.productos;
    
    if (this.filtroCategoriaId) {
      resultado = resultado.filter(p => p.categoriaId === this.filtroCategoriaId);
    }
    
    return resultado.slice(0, 10);
  }

  // ==================== AUXILIAR ====================
  private resetMovimiento(): Movimiento {
    return {
      producto: { idProducto: 0, nombre: '', descripcion: '', codigo: '', precioBase: 0, stockActual: 0, stockMinimo: 0, categoriaId: 0, unidadMedidaId: 0, proveedorId: 0, precioCompra: 0, fechaVencimiento: '' },
      tipoMovimiento: 'SALIDA',
      cantidad: 0,
      descripcion: ''
    };
  }

  private actualizarTablas(): void {
    this.entradas = this.movimientos.filter(m => m.tipoMovimiento?.toUpperCase() === 'ENTRADA');
    this.salidas = this.movimientos.filter(m => m.tipoMovimiento?.toUpperCase() === 'SALIDA');
    this.ajustes = this.movimientos.filter(m => m.tipoMovimiento?.toUpperCase() === 'AJUSTE');
    console.log('📊 Tablas actualizadas:', {
      entradas: this.entradas.length,
      salidas: this.salidas.length,
      ajustes: this.ajustes.length
    });
  }
}
