import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { VentaService } from '../../services/venta.service';
import { RegistroVentasComponent } from './registro-ventas.component';
import { ExportService, ExportColumn } from '../../services/export.service';
import { Chart, registerables } from 'chart.js';
import { ToastService } from '../../services/toast.service';

Chart.register(...registerables);

@Component({
  selector: 'app-ventas-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RegistroVentasComponent],
  templateUrl: './ventas-panel.component.html',
  styleUrls: ['./ventas-panel.component.css']
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

   constructor(private ventaService: VentaService, private exportService: ExportService, private toastService: ToastService) { }

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
         this.toastService.error('Error al cargar las ventas');
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
     this.toastService.success('Venta registrada exitosamente');
     this.cargarVentas();
     if (this.activeTab === 'reportes') {
       this.cargarReportes();
     }
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
       this.toastService.info('No hay ventas para exportar');
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

     this.toastService.success(`📊 Excel exportado: ${this.ventasFiltradas.length} ventas`);
   }

   exportarPDF(): void {
     if (this.ventasFiltradas.length === 0) {
       this.toastService.info('No hay ventas para exportar');
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

     this.toastService.success(`📄 PDF exportado: ${this.ventasFiltradas.length} ventas`);
   }

   // ==================== EXPORTACIÓN REPORTES ====================
   exportarReportesExcel(): void {
     if (this.productosMasVendidosArray.length === 0 &&
       this.clientesTopComprasArray.length === 0 &&
       this.totalesMensualesArray.length === 0) {
       this.toastService.info('No hay reportes para exportar');
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

     this.toastService.success('📊 Excel exportado: Reportes de movimientos');
   }

   exportarReportesPDF(): void {
     if (this.productosMasVendidosArray.length === 0 &&
       this.clientesTopComprasArray.length === 0 &&
       this.totalesMensualesArray.length === 0) {
       this.toastService.info('No hay reportes para exportar');
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

     this.toastService.success('📄 PDF exportado: Reportes de movimientos');
   }
}
