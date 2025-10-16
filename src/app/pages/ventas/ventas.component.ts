import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoService } from '../../services/movimiento.service';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Movimiento } from '../../models/movimientos.model';
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
  movimientos: Movimiento[] = [];
  nuevoMovimiento: Movimiento = this.resetMovimiento();

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
  // Arrays filtrados para “tablitas”
  entradas: Movimiento[] = [];
  salidas: Movimiento[] = [];
  ajustes: Movimiento[] = [];
  constructor(
    private movimientoService: MovimientoService,
    private productoService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarHistorial();
  }

  cambiarTab(tab: 'salidas' | 'historial') {
    this.activeTab = tab;
    if (tab === 'historial') this.cargarHistorial();
  }

  // ==================== CARGA DE DATOS ====================
  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: data => this.productos = data,
      error: () => this.mensajeError = 'Error al cargar productos'
    });
  }

  cargarHistorial(): void {
    this.movimientoService.listar().subscribe({
      next: data => this.movimientos = data,
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
      this.mensajeError = 'Debes seleccionar un producto y una cantidad válida';
      return;
    }

    this.movimientoService.crear(this.nuevoMovimiento, 'admin').subscribe({
      next: () => {
        this.nuevoMovimiento = this.resetMovimiento();
        this.cargarHistorial();
        this.mostrarModalMovimiento = false; // cerrar modal al crear
      },
      error: () => this.mensajeError = 'Error al registrar el movimiento'
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
    alert('El movimiento no tiene ID válido');
    return;
  }
  if (!confirm(`¿Seguro que quieres eliminar el movimiento de ${m.producto?.nombre || 'este producto'}?`)) return;

  this.movimientoService.eliminar(m.idMovimiento).subscribe({
    next: () => {
      this.movimientos = this.movimientos.filter(x => x.idMovimiento !== m.idMovimiento);
      this.actualizarTablas();
    },
    error: () => alert('Error al eliminar el movimiento')
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
    },
    error: (err) => {
      console.error('Error al eliminar', err);
      this.cerrarModalEliminar();
    }
  });
}// Variables para fechas y resultados filtrados
fechaInicio: string = '';
fechaFin: string = '';
movimientosFiltrados: Movimiento[] = [];

filtrarPorFecha() {
  if (!this.fechaInicio || !this.fechaFin) {
    alert('Debes seleccionar ambas fechas');
    return;
  }

  const inicio = new Date(this.fechaInicio);
  const fin = new Date(this.fechaFin);
  fin.setHours(23, 59, 59); // incluir todo el día final

  this.movimientosFiltrados = this.movimientos.filter(m => {
    const fechaMovimiento = new Date(m.fechaMovimiento || '');
    return fechaMovimiento >= inicio && fechaMovimiento <= fin;
  });
}




  // ============================
  // Getters auxiliares (estadísticas y filtrado)
  // ============================
  get filteredMovimientos(): Movimiento[] {
    const q = (this.searchMov || '').trim().toLowerCase();
    return (this.movimientos || []).filter(m => {
      const matchesTipo = this.filterTipo === 'TODOS' || m.tipoMovimiento === this.filterTipo;
      const matchesQuery = !q ||
        (m.producto?.nombre || '').toLowerCase().includes(q) ||
        (m.producto?.codigo || '').toLowerCase().includes(q) ||
        (m.descripcion || '').toLowerCase().includes(q);
      return matchesTipo && matchesQuery;
    });
  }

  get totalEntradas(): number {
    return this.movimientos.filter(m => m.tipoMovimiento === 'ENTRADA').reduce((s, m) => s + (m.cantidad || 0), 0);
  }
  get totalSalidas(): number {
    return this.movimientos.filter(m => m.tipoMovimiento === 'SALIDA').reduce((s, m) => s + (m.cantidad || 0), 0);
  }
  get totalAjustes(): number {
    return this.movimientos.filter(m => m.tipoMovimiento === 'AJUSTE').reduce((s, m) => s + Math.abs(m.cantidad || 0), 0);
  }

  // Métodos para abrir/cerrar modal
  abrirModalMovimiento() { this.mostrarModalMovimiento = true; this.mensajeError = ''; }
  cerrarModalMovimiento() { this.mostrarModalMovimiento = false; this.nuevoMovimiento = this.resetMovimiento(); this.mensajeError = ''; }

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
    this.entradas = this.movimientos.filter(m => m.tipoMovimiento === 'ENTRADA');
    this.salidas = this.movimientos.filter(m => m.tipoMovimiento === 'SALIDA');
    this.ajustes = this.movimientos.filter(m => m.tipoMovimiento === 'AJUSTE');
  }
}
