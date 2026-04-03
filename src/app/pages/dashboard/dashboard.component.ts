import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { ReporteService, ReporteInventario, ReporteProveedores } from '../../services/reporte.service';
import { ProductoService } from '../../services/producto.service';
import { MovimientoService } from '../../services/movimiento.service';
import { ProveedorService } from '../../services/proveedor.service';
import { NotificacionService } from '../../services/notificacion.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.model';

Chart.register(...registerables);

interface StatCard {
  titulo: string;
  valor: number;
  icono: string;
  color: string;
  cambio?: number;
  tendencia?: 'up' | 'down' | 'neutral';
}

interface MovimientoReciente {
  id: number;
  tipo: string;
  producto: string;
  cantidad: number;
  fecha: Date;
  usuario: string;
}

interface AlertaStock {
  idProducto: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartMovimientos') chartMovimientosRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCategorias') chartCategoriasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEstado') chartEstadoRef!: ElementRef<HTMLCanvasElement>;

  currentUser: AuthResponse | null = null;
  loading = true;
  
  stats: StatCard[] = [];
  movimientosRecientes: MovimientoReciente[] = [];
  alertasStock: AlertaStock[] = [];
  categoriasData: any[] = [];
  
  private chartMovimientos: Chart | null = null;
  private chartCategorias: Chart | null = null;
  private chartEstado: Chart | null = null;

  reporteInventario: ReporteInventario | null = null;
  reporteProveedores: ReporteProveedores | null = null;

  productosActivos = 0;
  productosInactivos = 0;
  totalEntradas = 0;
  totalSalidas = 0;

  horaActual = '';

  get actualDate(): string {
    return new Date().toLocaleDateString('es-PE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  constructor(
    private reporteService: ReporteService,
    private productoService: ProductoService,
    private movimientoService: MovimientoService,
    private proveedorService: ProveedorService,
    private notificacionService: NotificacionService,
    private categoriaService: CategoriaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    this.actualizarHora();
    setInterval(() => this.actualizarHora(), 1000);
    this.cargarDatos();
  }

  ngAfterViewInit(): void {}

  actualizarHora(): void {
    const now = new Date();
    this.horaActual = now.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  cargarDatos(): void {
    this.productoService.listar().subscribe(productos => {
      const activos = productos.filter((p: any) => p.estado === true || p.estado === 'true');
      const inactivos = productos.filter((p: any) => p.estado === false || p.estado === 'false');
      this.productosActivos = activos.length;
      this.productosInactivos = inactivos.length;
      
      this.alertasStock = productos
        .filter((p: any) => p.stockActual <= p.stockMinimo)
        .map((p: any) => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          stockActual: p.stockActual,
          stockMinimo: p.stockMinimo
        }))
        .slice(0, 5);

      this.actualizarStats();
      this.cargarCategoriaData(productos);
      
      this.inicializarGraficos();
    });

    this.movimientoService.listar().subscribe(movimientos => {
      this.totalEntradas = movimientos.filter((m: any) => m.tipo === 'ENTRADA').length;
      this.totalSalidas = movimientos.filter((m: any) => m.tipo === 'SALIDA').length;
      
      this.movimientosRecientes = movimientos
        .sort((a: any, b: any) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
        .slice(0, 8)
        .map((m: any) => ({
          id: m.idMovimiento,
          tipo: m.tipo,
          producto: m.producto?.nombre || 'Producto',
          cantidad: m.cantidad,
          fecha: new Date(m.fechaHora),
          usuario: m.usuario
        }));

      this.actualizarStats();
    });

    this.proveedorService.listar().subscribe(proveedores => {
      this.reporteService.obtenerReporteInventario().subscribe(reporte => {
        this.reporteInventario = reporte;
        this.actualizarStats();
        this.loading = false;
      });
    });

    this.reporteService.obtenerReporteProveedores().subscribe(reporte => {
      this.reporteProveedores = reporte;
    });
  }

  cargarCategoriaData(productos: any[]): void {
    const categoriasMap = new Map<string, number>();
    productos.forEach((p: any) => {
      const cat = p.categoriaNombre || p.categoria?.nombre || 'Sin categoría';
      categoriasMap.set(cat, (categoriasMap.get(cat) || 0) + 1);
    });
    this.categoriasData = Array.from(categoriasMap.entries()).map(([nombre, cantidad]) => ({
      nombre,
      cantidad
    }));
  }

  actualizarStats(): void {
    this.stats = [
      {
        titulo: 'Total Productos',
        valor: this.productosActivos + this.productosInactivos,
        icono: '📦',
        color: '#3b82f6'
      },
      {
        titulo: 'Productos Activos',
        valor: this.productosActivos,
        icono: '✅',
        color: '#10b981',
        cambio: this.productosActivos > 0 ? 100 : 0,
        tendencia: 'up'
      },
      {
        titulo: 'Total Entradas',
        valor: this.totalEntradas,
        icono: '📥',
        color: '#8b5cf6'
      },
      {
        titulo: 'Total Salidas',
        valor: this.totalSalidas,
        icono: '📤',
        color: '#f59e0b'
      },
      {
        titulo: 'Alertas Stock',
        valor: this.alertasStock.length,
        icono: '⚠️',
        color: '#ef4444',
        cambio: this.alertasStock.length > 0 ? -10 : 0,
        tendencia: this.alertasStock.length > 0 ? 'down' : 'neutral'
      },
      {
        titulo: 'Proveedores',
        valor: this.reporteProveedores?.totalProveedores || 0,
        icono: '🏢',
        color: '#06b6d4'
      }
    ];
  }

  inicializarGraficos(): void {
    this.crearGraficoMovimientos();
    this.crearGraficoCategorias();
    this.crearGraficoEstado();
  }

  crearGraficoMovimientos(): void {
    const ctx = this.chartMovimientosRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.chartMovimientos = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Entradas', 'Salidas', 'Ajustes'],
        datasets: [{
          data: [
            this.totalEntradas,
            this.totalSalidas,
            Math.max(1, this.totalEntradas + this.totalSalidas - this.totalEntradas - this.totalSalidas)
          ],
          backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 12, family: 'Inter' }
            }
          }
        }
      }
    });
  }

  crearGraficoCategorias(): void {
    const ctx = this.chartCategoriasRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    
    this.chartCategorias = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.categoriasData.slice(0, 6).map(c => c.nombre),
        datasets: [{
          label: 'Productos',
          data: this.categoriasData.slice(0, 6).map(c => c.cantidad),
          backgroundColor: colors.slice(0, 6),
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: 'Inter' } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 11, family: 'Inter' } }
          }
        }
      }
    });
  }

  crearGraficoEstado(): void {
    const ctx = this.chartEstadoRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.chartEstado = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [{
          data: [this.productosActivos || 1, this.productosInactivos || 0],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 12, family: 'Inter' }
            }
          }
        }
      }
    });
  }

  getTipoIcon(tipo: string): string {
    switch(tipo) {
      case 'ENTRADA': return '📥';
      case 'SALIDA': return '📤';
      case 'AJUSTE': return '🔄';
      default: return '📦';
    }
  }

  getTipoClass(tipo: string): string {
    switch(tipo) {
      case 'ENTRADA': return 'tipo-entrada';
      case 'SALIDA': return 'tipo-salida';
      case 'AJUSTE': return 'tipo-ajuste';
      default: return '';
    }
  }

  getStockClass(producto: AlertaStock): string {
    if (producto.stockActual === 0) return 'stock-cero';
    if (producto.stockActual <= producto.stockMinimo * 0.5) return 'stock-crítico';
    return 'stock-bajo';
  }

  formatearFecha(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos}m`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return new Date(date).toLocaleDateString('es-PE');
  }
}
