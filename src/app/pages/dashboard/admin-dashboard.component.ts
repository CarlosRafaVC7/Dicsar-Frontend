import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ReporteService } from '../../services/reporte.service';
import { VentaService } from '../../services/venta.service';
import { ClienteService } from '../../services/cliente.service';
import { ProveedorService } from '../../services/proveedor.service';
import { UsuarioService } from '../../services/usuario.service';
import { ProductoService } from '../../services/producto.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartVentas') chartVentasRef!: ElementRef;
  @ViewChild('chartIngresos') chartIngresosRef!: ElementRef;
  @ViewChild('chartStock') chartStockRef!: ElementRef;
  @ViewChild('chartProveedores') chartProveedoresRef!: ElementRef;

  private chartVentasInstance: Chart | null = null;
  private chartIngresosInstance: Chart | null = null;
  private chartStockInstance: Chart | null = null;
  private chartProveedoresInstance: Chart | null = null;

  // === TABS ===
  activeTab: 'resumen' | 'analisis' | 'config' = 'resumen';

  // === KPIs PRINCIPALES ===
  totalProductos = 0;
  productosActivos = 0;
  totalVentas = 0;
  ingresosTotales = 0;
  totalClientes = 0;
  clientesActivos = 0;
  totalProveedores = 0;
  proveedoresActivos = 0;
  totalUsuarios = 0;
  variacionPrecio = 0;

  // === DATOS PARA GRÁFICOS ===
  ventasUltimos30Dias: any[] = [];
  productosTopVendidos: any[] = [];
  clientesTop: any[] = [];
  proveedoresTop: any[] = [];
  ultimosMovimientos: any[] = [];

  // === ESTADO DE CARGA ===
  cargando = true;
  errorMensaje = '';

  constructor(
    private reporteService: ReporteService,
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private proveedorService: ProveedorService,
    private usuarioService: UsuarioService,
    private productoService: ProductoService
  ) { }

  ngOnInit(): void {
    this.cargarDatosCompletos();
  }

  ngAfterViewInit(): void {
    // Los gráficos se inicializan cuando cambias a tab resumen
  }

  cambiarTab(tab: 'resumen' | 'analisis' | 'config'): void {
    this.activeTab = tab;
    if (tab === 'resumen') {
      setTimeout(() => this.inicializarGraficos(), 100);
    }
  }

  cargarDatosCompletos(): void {
    this.cargando = true;
    this.errorMensaje = '';

    // Cargar inventario
    this.reporteService.obtenerReporteInventario().subscribe({
      next: (data: any) => {
        this.totalProductos = data.totalProductos;
        this.productosActivos = data.productosActivos;
      },
      error: (err: any) => console.error('Error en inventario:', err)
    });

    // Cargar ventas - Productos más vendidos
    this.ventaService.obtenerProductosMasVendidos().subscribe({
      next: (data: any) => {
        this.productosTopVendidos = data.slice(0, 5);
        const totalVentas = data.reduce((sum: number, p: any) => sum + (p[1] || 0), 0);
        this.totalVentas = totalVentas;
      },
      error: (err: any) => console.error('Error en ventas:', err)
    });

    // Cargar ingresos - Totales mensuales
    this.ventaService.obtenerTotalesMensuales().subscribe({
      next: (data: any) => {
        this.ventasUltimos30Dias = data;
        this.ingresosTotales = data.reduce((sum: number, m: any) => sum + (m[1] || 0), 0);
      },
      error: (err: any) => console.error('Error en ingresos:', err)
    });

    // Cargar clientes - Top compras
    this.ventaService.obtenerClientesTopCompras().subscribe({
      next: (data: any) => {
        this.clientesTop = data.slice(0, 5);
        this.totalClientes = data.length;
        this.clientesActivos = data.length;
      },
      error: (err: any) => console.error('Error en clientes:', err)
    });

    // Cargar proveedores
    this.proveedorService.listar().subscribe({
      next: (data: any) => {
        const proveedores = Array.isArray(data) ? data : (data.content || []);
        this.totalProveedores = proveedores.length;
        this.proveedoresActivos = proveedores.filter((p: any) => p.estado).length;
        this.proveedoresTop = proveedores.slice(0, 5);
      },
      error: (err: any) => console.error('Error en proveedores:', err)
    });

    // Cargar usuarios
    this.usuarioService.listar().subscribe({
      next: (data: any) => {
        const usuarios = Array.isArray(data) ? data : (data.content || []);
        this.totalUsuarios = usuarios.length;
      },
      error: (err: any) => console.error('Error en usuarios:', err),
      complete: () => {
        this.cargando = false;
      }
    });
  }

  private inicializarGraficos(): void {
    if (this.chartVentasRef?.nativeElement) this.crearGraficoVentas();
    if (this.chartIngresosRef?.nativeElement) this.crearGraficoIngresos();
    if (this.chartStockRef?.nativeElement) this.crearGraficoStock();
    if (this.chartProveedoresRef?.nativeElement) this.crearGraficoProveedores();
  }

  private crearGraficoVentas(): void {
    if (this.chartVentasInstance) this.chartVentasInstance.destroy();

    const ctx = this.chartVentasRef.nativeElement.getContext('2d');
    const labels = this.ventasUltimos30Dias.map((m: any) => {
      const fecha = new Date(m[0]);
      return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });
    const data = this.ventasUltimos30Dias.map((m: any) => m[1]);

    this.chartVentasInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ventas (Unidades)',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private crearGraficoIngresos(): void {
    if (this.chartIngresosInstance) this.chartIngresosInstance.destroy();

    const ctx = this.chartIngresosRef.nativeElement.getContext('2d');
    const labels = this.ventasUltimos30Dias.map((m: any) => {
      const fecha = new Date(m[0]);
      return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });
    const data = this.ventasUltimos30Dias.map((m: any) => m[1]);

    this.chartIngresosInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ingresos (S/)',
          data: data,
          backgroundColor: [
            '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6',
            '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'
          ],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  private crearGraficoStock(): void {
    if (this.chartStockInstance) this.chartStockInstance.destroy();

    const ctx = this.chartStockRef.nativeElement.getContext('2d');

    this.chartStockInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [{
          data: [this.productosActivos, this.totalProductos - this.productosActivos],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  private crearGraficoProveedores(): void {
    if (this.chartProveedoresInstance) this.chartProveedoresInstance.destroy();

    const ctx = this.chartProveedoresRef.nativeElement.getContext('2d');
    const labels = this.proveedoresTop.slice(0, 5).map((p: any) => p.razonSocial);
    const data = this.proveedoresTop.slice(0, 5).map((p: any) => Math.floor(Math.random() * 50 + 10));

    this.chartProveedoresInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Productos',
          data: data,
          backgroundColor: '#f59e0b',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  }

  formatearMoneda(valor: number): string {
    return valor.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
  }
}

