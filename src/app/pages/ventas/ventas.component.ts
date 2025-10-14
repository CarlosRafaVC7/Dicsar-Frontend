import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimientoService } from '../../services/movimiento.service';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { Movimiento } from '../../models/movimientos.model';

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
      },
      error: () => this.mensajeError = 'Error al registrar el movimiento'
    });
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
}
