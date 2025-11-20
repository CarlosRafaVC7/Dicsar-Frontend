import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { VentaService } from '../../services/venta.service';
import { RegistroVentasComponent } from './registro-ventas.component';
import { ExportService, ExportColumn } from '../../services/export.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-ventas-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RegistroVentasComponent],
  template: `
    <div class="ventas-container">
      <!-- Header -->
      <div class="ventas-header">
        <h1>🛒 Gestión de Ventas</h1>
        <p class="subtitle">Registra, visualiza y analiza todas tus ventas</p>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-navigation">
        <button class="tab-btn" [class.active]="activeTab === 'registro'" (click)="cambiarTab('registro')">
          📝 Registrar Venta
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'lista'" (click)="cambiarTab('lista')">
          📋 Lista de Ventas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'reportes'" (click)="cambiarTab('reportes')">
          📊 Reportes
        </button>
      </div>

      <!-- Alert -->
      <div class="alert" *ngIf="mostrarAlerta" [ngClass]="'alert-' + tipoAlerta">
        {{ mensajeAlerta }}
      </div>

      <!-- TAB: Registro de Ventas -->
      <div class="tab-content" *ngIf="activeTab === 'registro'">
        <app-registro-ventas (ventaRegistrada)="onVentaRegistrada()"></app-registro-ventas>
      </div>

      <!-- TAB: Lista de Ventas -->
      <div class="tab-content" *ngIf="activeTab === 'lista'">
        <div class="lista-ventas-container">
          <!-- Filtros y Exportación -->
          <div class="filtros">
            <div class="filtro-grupo">
              <input type="text" placeholder="🔍 Buscar por cliente..." 
                [(ngModel)]="busquedaCliente" (ngModelChange)="onBusquedaChange()"
                class="filtro-input">
            </div>
            <div class="filtro-grupo">
              <select [(ngModel)]="filtroEstado" (ngModelChange)="onFiltroChange()" class="filtro-select">
                <option value="todas">Todas</option>
                <option value="activas">Activas</option>
                <option value="anuladas">Anuladas</option>
              </select>
            </div>
            <div class="filtro-grupo export-buttons">
              <button class="btn btn-export-excel" (click)="exportarExcel()" title="Exportar a Excel">
                📊 Excel
              </button>
              <button class="btn btn-export-pdf" (click)="exportarPDF()" title="Exportar a PDF">
                📄 PDF
              </button>
            </div>
          </div>

          <!-- Tabla de Ventas -->
          <div class="tabla-container">
            <table class="tabla-ventas">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Total</th>
                  <th>Tipo Doc.</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let venta of ventasFiltradas" [class.anulada]="!venta.estado">
                  <td><strong>#{{ venta.idVenta }}</strong></td>
                  <td>{{ venta.cliente?.nombre }} {{ venta.cliente?.apellidos }}</td>
                  <td>{{ venta.producto?.nombre }}</td>
                  <td class="text-center">{{ venta.cantidad }}</td>
                  <td class="text-right">{{ formatearMoneda(venta.precioUnitario) }}</td>
                  <td class="text-right"><strong>{{ formatearMoneda(venta.total) }}</strong></td>
                  <td class="text-center">{{ venta.tipoDocumento }}</td>
                  <td>{{ venta.fechaVenta | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="text-center">
                    <span class="badge" [ngClass]="venta.estado ? 'badge-success' : 'badge-danger'">
                      {{ venta.estado ? '✅ Activa' : '❌ Anulada' }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="ventasFiltradas.length === 0">
                  <td colspan="9" class="text-center">No hay ventas para mostrar</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="paginacion" *ngIf="totalPages > 1">
            <button (click)="irPagina(currentPage - 1)" [disabled]="currentPage === 0" class="btn-pag">← Anterior</button>
            <span class="info-pag">Página {{ currentPage + 1 }} de {{ totalPages }}</span>
            <button (click)="irPagina(currentPage + 1)" [disabled]="currentPage === totalPages - 1" class="btn-pag">Siguiente →</button>
          </div>
        </div>
      </div>

      <!-- TAB: Reportes -->
      <div class="tab-content" *ngIf="activeTab === 'reportes'">
        <div class="reportes-container">
          <!-- Controles de Exportación -->
          <div class="reportes-controls">
            <h2>📊 Reportes de Movimientos</h2>
            <div class="export-buttons">
              <button class="btn btn-export-excel" (click)="exportarReportesExcel()" title="Exportar reportes a Excel">
                📊 Descargar Excel
              </button>
              <button class="btn btn-export-pdf" (click)="exportarReportesPDF()" title="Exportar reportes a PDF">
                📄 Descargar PDF
              </button>
            </div>
          </div>

          <div *ngIf="loadingReportes" class="loading">⏳ Cargando reportes...</div>

          <div *ngIf="!loadingReportes" class="graficos-grid">
            <!-- Gráfico Productos Más Vendidos -->
            <div class="grafico-card">
              <h3>🏆 Top Productos Más Vendidos</h3>
              <canvas #chartProductosMasVendidos></canvas>
            </div>

            <!-- Gráfico Clientes Top Compras -->
            <div class="grafico-card">
              <h3>👥 Top Clientes por Compras</h3>
              <canvas #chartClientesTopCompras></canvas>
            </div>

            <!-- Gráfico Totales Mensuales -->
            <div class="grafico-card fullwidth">
              <h3>📈 Totales de Ventas Mensuales</h3>
              <canvas #chartTotalesMensuales></canvas>
            </div>

            <!-- Tabla de Detalle -->
            <div class="tabla-detalle-card">
              <h3>📊 Resumen de Reportes</h3>
              <div class="resumen-stats">
                <div class="stat">
                  <span class="stat-label">Total Productos Vendidos</span>
                  <span class="stat-value">{{ productosMasVendidosArray.length }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Clientes Activos</span>
                  <span class="stat-value">{{ clientesTopComprasArray.length }}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Meses Registrados</span>
                  <span class="stat-value">{{ totalesMensualesArray.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ventas-container {
      padding: 24px;
      background-color: #f5f7fa;
      min-height: 100vh;
    }

    .ventas-header {
      margin-bottom: 32px;
      text-align: center;
    }

    .ventas-header h1 {
      font-size: 32px;
      color: #1a202c;
      margin: 0 0 8px 0;
    }

    .subtitle {
      font-size: 16px;
      color: #718096;
      margin: 0;
    }

    .tabs-navigation {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0;
    }

    .tab-btn {
      padding: 12px 24px;
      background: none;
      border: none;
      color: #718096;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
    }

    .tab-btn:hover {
      color: #2d3748;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .tab-content {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .alert {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    }

    .alert-exito {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .alert-info {
      background-color: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }

    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    .lista-ventas-container {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .filtros {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .filtro-grupo {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filtro-input,
    .filtro-select {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
    }

    .filtro-input:focus,
    .filtro-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .tabla-container {
      overflow-x: auto;
      margin-bottom: 24px;
    }

    .tabla-ventas {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .tabla-ventas thead {
      background-color: #f7fafc;
      border-bottom: 2px solid #e2e8f0;
    }

    .tabla-ventas thead th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #2d3748;
    }

    .tabla-ventas tbody tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background-color 0.2s;
    }

    .tabla-ventas tbody tr:hover {
      background-color: #f7fafc;
    }

    .tabla-ventas tbody tr.anulada {
      opacity: 0.6;
    }

    .tabla-ventas tbody td {
      padding: 12px 16px;
      color: #4a5568;
    }

    .tabla-ventas .text-center {
      text-align: center;
    }

    .tabla-ventas .text-right {
      text-align: right;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success {
      background-color: #d4edda;
      color: #155724;
    }

    .badge-danger {
      background-color: #f8d7da;
      color: #721c24;
    }

    .paginacion {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 24px 0;
      border-top: 1px solid #e2e8f0;
    }

    .btn-pag {
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .btn-pag:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-pag:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .info-pag {
      color: #718096;
      font-size: 14px;
      font-weight: 500;
    }

    .reportes-container {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .reportes-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
    }

    .reportes-controls h2 {
      margin: 0;
      font-size: 20px;
      color: white;
    }

    .reportes-controls .export-buttons {
      display: flex;
      gap: 12px;
    }

    .loading {
      text-align: center;
      padding: 48px 24px;
      font-size: 16px;
      color: #718096;
    }

    .graficos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .grafico-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      border: 1px solid #e2e8f0;
    }

    .grafico-card h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: #1a202c;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }

    .grafico-card canvas {
      max-height: 400px;
    }

    .grafico-card.fullwidth {
      grid-column: 1 / -1;
    }

    .tabla-detalle-card {
      grid-column: 1 / -1;
      background: white;
      border-radius: 8px;
      padding: 24px;
      border: 1px solid #e2e8f0;
    }

    .tabla-detalle-card h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: #1a202c;
    }

    .resumen-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background-color: #f7fafc;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .stat-label {
      font-size: 12px;
      color: #718096;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 24px;
      color: #1a202c;
      font-weight: bold;
    }

    /* EXPORTACIÓN */
    .export-buttons {
      display: flex;
      gap: 8px;
      flex-direction: row;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-export-excel {
      background-color: #10b981;
      color: white;
    }

    .btn-export-excel:hover {
      background-color: #059669;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-export-pdf {
      background-color: #ef4444;
      color: white;
    }

    .btn-export-pdf:hover {
      background-color: #dc2626;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    @media (max-width: 768px) {
      .ventas-container {
        padding: 16px;
      }

      .ventas-header h1 {
        font-size: 24px;
      }

      .tabs-navigation {
        flex-direction: column;
      }

      .tab-btn {
        padding: 10px 16px;
        border-bottom: none;
        border-left: 3px solid transparent;
      }

      .tab-btn.active {
        border-bottom: none;
        border-left-color: #3b82f6;
      }

      .export-buttons {
        flex-direction: column;
      }

      .graficos-grid {
        grid-template-columns: 1fr;
      }

      .tabla-ventas {
        font-size: 12px;
      }

      .tabla-ventas thead th,
      .tabla-ventas tbody td {
        padding: 8px;
      }
    }
  `]
})
export class VentasPanelComponent implements OnInit, AfterViewInit {
  @ViewChild('chartProductosMasVendidos') chartProductosRef!: ElementRef;
  @ViewChild('chartClientesTopCompras') chartClientesRef!: ElementRef;
  @ViewChild('chartTotalesMensuales') chartTotalesRef!: ElementRef;

  private chartProductosInstance: Chart | null = null;
  private chartClientesInstance: Chart | null = null;
  private chartTotalesInstance: Chart | null = null;

  activeTab: 'registro' | 'lista' | 'reportes' = 'registro';

  ventas: any[] = [];
  ventasFiltradas: any[] = [];
  currentPage = 0;
  pageSize = 10;
  totalVentas = 0;
  totalPages = 1;

  busquedaCliente: string = '';
  filtroEstado: 'todas' | 'activas' | 'anuladas' = 'todas';

  productosMasVendidos: Observable<any[]> | null = null;
  clientesTopCompras: Observable<any[]> | null = null;
  totalesMensuales: Observable<any[]> | null = null;
  loadingReportes = false;

  // Arrays para gráficos
  productosMasVendidosArray: any[] = [];
  clientesTopComprasArray: any[] = [];
  totalesMensualesArray: any[] = [];

  mensajeAlerta = '';
  tipoAlerta: 'exito' | 'error' | 'info' = 'info';
  mostrarAlerta = false;

  constructor(private ventaService: VentaService, private exportService: ExportService) { }

  ngOnInit(): void {
    this.cargarVentas();
  }

  ngAfterViewInit(): void { }

  cambiarTab(tab: 'registro' | 'lista' | 'reportes'): void {
    const oldTab = this.activeTab;
    this.activeTab = tab;

    // Al cambiar a lista, recarga las ventas
    if (tab === 'lista' && oldTab !== 'lista') {
      this.cargarVentas(0);  // Recarga desde página 0
    }

    // Al cambiar a reportes, recarga los reportes
    if (tab === 'reportes' && oldTab !== 'reportes') {
      this.cargarReportes();
    }
  }

  cargarVentas(page: number = 0): void {
    this.currentPage = page;
    this.ventaService.listarPaginado(page, this.pageSize).subscribe({
      next: (response: any) => {
        console.log('📊 Respuesta del servidor (Movimientos/Ventas):', response);

        // Transformar movimientos a formato de venta para mostrar en tabla
        if (Array.isArray(response)) {
          this.ventas = this.transformarMovimientosAVentas(response);
          this.totalVentas = response.length;
        } else if (response.content) {
          this.ventas = this.transformarMovimientosAVentas(response.content || []);
          this.totalVentas = response.totalElements || 0;
        } else if (response.data) {
          this.ventas = this.transformarMovimientosAVentas(response.data || []);
          this.totalVentas = response.total || response.data.length;
        } else {
          this.ventas = [];
          this.totalVentas = 0;
        }

        this.totalPages = Math.ceil(this.totalVentas / this.pageSize) || 1;
        this.filtrarVentas();
      },
      error: (error) => {
        console.error('❌ Error cargando ventas:', error);
        this.mostrarAlertaTemporal('Error al cargar las ventas', 'error');
        this.ventas = [];
        this.ventasFiltradas = [];
      }
    });
  }

  // Transformar movimientos de inventario a formato de venta
  private transformarMovimientosAVentas(movimientos: any[]): any[] {
    return movimientos
      .filter(m => m.tipoMovimiento === 'SALIDA') // Solo salidas son ventas
      .map(m => ({
        idVenta: m.idMovimiento,
        cliente: {
          idCliente: 0,
          nombre: 'Venta',
          apellidos: 'General'
        },
        producto: m.producto,
        cantidad: m.cantidad,
        precioUnitario: m.producto?.precioBase || m.producto?.precio || 0,
        total: (m.cantidad * (m.producto?.precioBase || m.producto?.precio || 0)),
        tipoDocumento: 'Movimiento',
        fechaVenta: m.fechaMovimiento,
        estado: true,
        usuarioMovimiento: m.usuarioMovimiento
      }));
  }

  filtrarVentas(): void {
    this.ventasFiltradas = this.ventas.filter(venta => {
      const cumpleBusqueda = venta.cliente?.nombre?.toLowerCase().includes(this.busquedaCliente.toLowerCase()) ||
        venta.cliente?.apellidos?.toLowerCase().includes(this.busquedaCliente.toLowerCase());

      const cumpleFiltro = this.filtroEstado === 'todas' ||
        (this.filtroEstado === 'activas' && venta.estado) ||
        (this.filtroEstado === 'anuladas' && !venta.estado);

      return cumpleBusqueda && cumpleFiltro;
    });
  }

  onBusquedaChange(): void {
    this.filtrarVentas();
  }

  onFiltroChange(): void {
    this.filtrarVentas();
  }

  irPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.cargarVentas(page);
    }
  }

  cargarReportes(): void {
    this.loadingReportes = true;

    this.ventaService.obtenerProductosMasVendidos().subscribe({
      next: (datos) => {
        this.productosMasVendidosArray = datos;
        this.inicializarGraficos();
      },
      error: (error) => {
        console.error('Error cargando productos más vendidos:', error);
        this.loadingReportes = false;
      }
    });

    this.ventaService.obtenerClientesTopCompras().subscribe({
      next: (datos) => {
        this.clientesTopComprasArray = datos;
      },
      error: (error) => {
        console.error('Error cargando clientes top:', error);
      }
    });

    this.ventaService.obtenerTotalesMensuales().subscribe({
      next: (datos) => {
        this.totalesMensualesArray = datos;
        this.loadingReportes = false;
      },
      error: (error) => {
        console.error('Error cargando totales mensuales:', error);
        this.loadingReportes = false;
      }
    });
  }

  private inicializarGraficos(): void {
    setTimeout(() => {
      if (this.chartProductosRef?.nativeElement) {
        this.crearGraficoProductosMasVendidos();
      }
      if (this.chartClientesRef?.nativeElement) {
        this.crearGraficoClientesTopCompras();
      }
      if (this.chartTotalesRef?.nativeElement) {
        this.crearGraficoTotalesMensuales();
      }
    }, 100);
  }

  private crearGraficoProductosMasVendidos(): void {
    if (this.chartProductosInstance) {
      this.chartProductosInstance.destroy();
    }

    if (!this.productosMasVendidosArray || this.productosMasVendidosArray.length === 0) {
      return;
    }

    const ctx = this.chartProductosRef.nativeElement.getContext('2d');
    const top5 = this.productosMasVendidosArray.slice(0, 5);

    const labels = top5.map((p: any) => p[0]);
    const data = top5.map((p: any) => p[1]);
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    this.chartProductosInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Unidades Vendidas',
          data: data,
          backgroundColor: colores,
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  private crearGraficoClientesTopCompras(): void {
    if (this.chartClientesInstance) {
      this.chartClientesInstance.destroy();
    }

    if (!this.clientesTopComprasArray || this.clientesTopComprasArray.length === 0) {
      return;
    }

    const ctx = this.chartClientesRef.nativeElement.getContext('2d');
    const top5 = this.clientesTopComprasArray.slice(0, 5);

    const labels = top5.map((c: any) => c[0]);
    const data = top5.map((c: any) => c[1]);
    const colores = ['#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];

    this.chartClientesInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colores,
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  private crearGraficoTotalesMensuales(): void {
    if (this.chartTotalesInstance) {
      this.chartTotalesInstance.destroy();
    }

    if (!this.totalesMensualesArray || this.totalesMensualesArray.length === 0) {
      return;
    }

    const ctx = this.chartTotalesRef.nativeElement.getContext('2d');

    const labels = this.totalesMensualesArray.map((t: any) => {
      const fecha = new Date(t[0]);
      return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });
    const data = this.totalesMensualesArray.map((t: any) => t[1]);

    this.chartTotalesInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Ventas (S/)',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `S/ ${(value as number).toLocaleString()}`
            }
          }
        }
      }
    });
  }

  onVentaRegistrada(): void {
    this.mostrarAlertaTemporal('✅ Venta registrada exitosamente', 'exito');
    this.cargarVentas();
    if (this.activeTab === 'reportes') {
      this.cargarReportes();
    }
  }

  mostrarAlertaTemporal(mensaje: string, tipo: 'exito' | 'error' | 'info'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
    setTimeout(() => {
      this.mostrarAlerta = false;
    }, 4000);
  }

  get paginasArray(): number[] {
    const paginas = [];
    for (let i = 0; i < this.totalPages; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  formatearMoneda(valor: number): string {
    return valor.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
  }

  // ==================== EXPORTACIÓN ====================
  exportarExcel(): void {
    if (this.ventasFiltradas.length === 0) {
      this.mostrarAlertaTemporal('No hay ventas para exportar', 'info');
      return;
    }

    const columns: ExportColumn[] = [
      { header: 'ID', field: 'idVenta', width: 10 },
      { header: 'Cliente', field: 'cliente.nombre', width: 25 },
      { header: 'Apellidos', field: 'cliente.apellidos', width: 25 },
      { header: 'Producto', field: 'producto.nombre', width: 25 },
      { header: 'Cantidad', field: 'cantidad', width: 12 },
      { header: 'Precio Unit.', field: 'precioUnitario', width: 15 },
      { header: 'Total', field: 'total', width: 15 },
      { header: 'Tipo Documento', field: 'tipoDocumento', width: 15 },
      { header: 'Fecha', field: 'fechaVenta', width: 18 },
      { header: 'Estado', field: 'estado', width: 12 }
    ];

    // Preparar datos para export
    const datosExport = this.ventasFiltradas.map(venta => ({
      idVenta: venta.idVenta,
      'cliente.nombre': venta.cliente?.nombre || '',
      'cliente.apellidos': venta.cliente?.apellidos || '',
      'producto.nombre': venta.producto?.nombre || '',
      cantidad: venta.cantidad,
      precioUnitario: venta.precioUnitario,
      total: venta.total,
      tipoDocumento: venta.tipoDocumento,
      fechaVenta: venta.fechaVenta,
      estado: venta.estado ? 'Activa' : 'Anulada'
    }));

    this.exportService.exportToExcel(
      datosExport,
      columns,
      'movimientos_ventas',
      'Reporte de Ventas/Movimientos'
    );

    this.mostrarAlertaTemporal(
      `📊 Excel exportado: ${this.ventasFiltradas.length} ventas`,
      'exito'
    );
  }

  exportarPDF(): void {
    if (this.ventasFiltradas.length === 0) {
      this.mostrarAlertaTemporal('No hay ventas para exportar', 'info');
      return;
    }

    const columns: ExportColumn[] = [
      { header: 'ID', field: 'idVenta', width: 12 },
      { header: 'Cliente', field: 'cliente.nombre', width: 30 },
      { header: 'Producto', field: 'producto.nombre', width: 35 },
      { header: 'Cantidad', field: 'cantidad', width: 15 },
      { header: 'Precio Unit.', field: 'precioUnitario', width: 18 },
      { header: 'Total', field: 'total', width: 18 },
      { header: 'Tipo Doc.', field: 'tipoDocumento', width: 15 },
      { header: 'Fecha', field: 'fechaVenta', width: 20 },
      { header: 'Estado', field: 'estado', width: 15 }
    ];

    // Preparar datos para export
    const datosExport = this.ventasFiltradas.map(venta => ({
      idVenta: venta.idVenta,
      'cliente.nombre': venta.cliente?.nombre || '',
      'producto.nombre': venta.producto?.nombre || '',
      cantidad: venta.cantidad,
      precioUnitario: venta.precioUnitario,
      total: venta.total,
      tipoDocumento: venta.tipoDocumento,
      fechaVenta: venta.fechaVenta,
      estado: venta.estado ? 'Activa' : 'Anulada'
    }));

    this.exportService.exportToPDF(
      datosExport,
      columns,
      'movimientos_ventas',
      'Reporte de Ventas/Movimientos'
    );

    this.mostrarAlertaTemporal(
      `📄 PDF exportado: ${this.ventasFiltradas.length} ventas`,
      'exito'
    );
  }

  // ==================== EXPORTACIÓN REPORTES ====================
  exportarReportesExcel(): void {
    if (this.productosMasVendidosArray.length === 0 &&
      this.clientesTopComprasArray.length === 0 &&
      this.totalesMensualesArray.length === 0) {
      this.mostrarAlertaTemporal('No hay reportes para exportar', 'info');
      return;
    }

    // Preparar datos de productos
    const productosData = this.productosMasVendidosArray.map((p: any, i: number) => ({
      Ranking: i + 1,
      'Producto': p[0] || '',
      'Cantidad Vendida': p[1] || 0,
      'Monto Total': p[2] || 0
    }));

    // Preparar datos de clientes
    const clientesData = this.clientesTopComprasArray.map((c: any, i: number) => ({
      Ranking: i + 1,
      'Cliente': c[0] || '',
      'Cantidad Ventas': c[1] || 0,
      'Monto Total': c[2] || 0
    }));

    // Preparar datos de totales mensuales
    const totalesData = this.totalesMensualesArray.map((t: any) => ({
      'Mes': t[0] || '',
      'Total Ventas': t[1] || 0
    }));

    const columns: ExportColumn[] = [
      { header: 'Ranking', field: 'Ranking', width: 10 },
      { header: 'Nombre', field: 'Producto', width: 30 },
      { header: 'Cantidad', field: 'Cantidad Vendida', width: 15 },
      { header: 'Total', field: 'Monto Total', width: 15 }
    ];

    this.exportService.exportToExcel(
      productosData,
      columns,
      'reportes_movimientos',
      'Reportes de Movimientos - Productos Top'
    );

    this.mostrarAlertaTemporal(
      `📊 Excel exportado: Reportes de movimientos`,
      'exito'
    );
  }

  exportarReportesPDF(): void {
    if (this.productosMasVendidosArray.length === 0 &&
      this.clientesTopComprasArray.length === 0 &&
      this.totalesMensualesArray.length === 0) {
      this.mostrarAlertaTemporal('No hay reportes para exportar', 'info');
      return;
    }

    // Preparar datos de productos
    const productosData = this.productosMasVendidosArray.map((p: any, i: number) => ({
      Ranking: i + 1,
      'Producto': p[0] || '',
      'Cantidad': p[1] || 0,
      'Total': p[2] || 0
    }));

    const columns: ExportColumn[] = [
      { header: 'Ranking', field: 'Ranking', width: 12 },
      { header: 'Producto', field: 'Producto', width: 40 },
      { header: 'Cantidad Vendida', field: 'Cantidad', width: 20 },
      { header: 'Monto Total', field: 'Total', width: 20 }
    ];

    this.exportService.exportToPDF(
      productosData,
      columns,
      'reportes_movimientos',
      'Reportes de Movimientos - Top Productos Vendidos'
    );

    this.mostrarAlertaTemporal(
      `📄 PDF exportado: Reportes de movimientos`,
      'exito'
    );
  }
}
