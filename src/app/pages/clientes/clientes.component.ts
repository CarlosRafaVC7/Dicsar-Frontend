import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { ReporteVentaService } from '../../services/reporte-venta.service';
import { DashboardService } from '../../services/dashboard.service';
import { ClienteDTO } from '../../models/cliente.model';
import { CompraDTO } from '../../models/compra.model';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { AuthService } from '../../services/auth.service';
import { ExportService, ExportColumn } from '../../services/export.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  // === 🧭 TABS ===
  activeTab: 'clientes' | 'historial' | 'reportes' = 'clientes';

  // === 👥 CLIENTES ===
  clientes: ClienteDTO[] = [];
  totalElements: number = 0;
  pageSize: number = 10;
  pageNumber: number = 0;
  loading: boolean = false;
  searchTerm: string = '';
  filtroTipo: string = 'todos';
  filtroEstado: string = 'activos';

  tiposDocumento = ['DNI', 'RUC'];
  isAdmin: boolean = false;

  // Modal
  mostrarModal = false;
  editandoCliente: ClienteDTO | null = null;
  clienteForm!: FormGroup;

  // === 📜 HISTORIAL DE COMPRAS ===
  clienteSeleccionado: ClienteDTO | null = null;
  compras: CompraDTO[] = [];
  comprasLoading: boolean = false;
  comprasPageNumber: number = 0;
  comprasPageSize: number = 10;
  totalCompras: number = 0;

  // === 📊 REPORTES ===
  metricas: any = {
    totalVentas: 0,
    montoTotalVentas: 0,
    totalClientes: 0,
    totalProductos: 0,
    productosAgotados: 0,
    ventasHoy: 0,
    ventasEstaSemana: 0,
    ventasEsteMes: 0
  };
  productosMasVendidos: any[] = [];
  clientesTopVentas: any[] = [];
  reportesLoading: boolean = false;

  // === 🚨 ALERTAS ===
  alertaVisible = false;
  alertaMensaje = '';
  alertaTipo: 'exito' | 'error' | 'info' = 'info';

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get totalComprasPages(): number {
    return Math.ceil(this.totalCompras / this.comprasPageSize);
  }

  get comprasPaginasArray(): number[] {
    return Array.from({ length: this.totalComprasPages }, (_, i) => i);
  }

  constructor(
    private clienteService: ClienteService,
    private reporteVentaService: ReporteVentaService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private exportService: ExportService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.clienteForm = this.fb.group({
      idCliente: [null],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      esEmpresa: [false],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.cargarClientes();
    // Aplicar filtro de estado inicial (activos)
    this.aplicarFiltros();
  }

  // ==================== TAB MANAGEMENT ====================
  cambiarTab(tab: 'clientes' | 'historial' | 'reportes'): void {
    this.activeTab = tab;

    if (tab === 'reportes') {
      this.cargarReportes();
    }
  }

  // Método para aplicar todos los filtros
  aplicarFiltros(): void {
    this.pageNumber = 0;

    // Si hay búsqueda activa, buscar
    if (this.searchTerm.trim()) {
      this.buscarClientes();
      return;
    }

    // Si hay filtro de tipo, aplicarlo
    if (this.filtroTipo !== 'todos') {
      this.filtrarPorTipo();
      return;
    }

    // Si hay filtro de estado, aplicarlo
    if (this.filtroEstado !== 'todos') {
      this.filtrarPorEstado();
      return;
    }

    // Si no hay filtros, cargar todos
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.loading = true;
    this.clienteService.listar(this.pageNumber, this.pageSize).subscribe({
      next: (response: PaginatedResponse<ClienteDTO>) => {
        this.clientes = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.mostrarAlerta('Error al cargar clientes', 'error');
        this.loading = false;
      }
    });
  }

  buscarClientes(): void {
    if (!this.searchTerm.trim()) {
      this.pageNumber = 0;
      this.cargarClientes();
      return;
    }

    this.loading = true;
    this.pageNumber = 0;
    this.clienteService.buscarPorNombre(this.searchTerm, this.pageNumber, this.pageSize).subscribe({
      next: (response: PaginatedResponse<ClienteDTO>) => {
        this.clientes = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error buscando clientes:', err);
        this.mostrarAlerta('Error en la búsqueda', 'error');
        this.loading = false;
      }
    });
  }

  filtrarPorTipo(): void {
    this.pageNumber = 0;
    this.loading = true;

    if (this.filtroTipo === 'todos') {
      this.cargarClientes();
      return;
    }

    const esEmpresa = this.filtroTipo === 'empresa';
    this.clienteService.filtrarPorTipo(esEmpresa, this.pageNumber, this.pageSize).subscribe({
      next: (response: PaginatedResponse<ClienteDTO>) => {
        this.clientes = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error filtrando por tipo:', err);
        this.mostrarAlerta('Error en el filtro', 'error');
        this.clientes = [];
        this.totalElements = 0;
        this.loading = false;
      }
    });
  }

  filtrarPorEstado(): void {
    this.pageNumber = 0;
    this.loading = true;

    if (this.filtroEstado === 'todos') {
      this.cargarClientes();
      return;
    }

    const estado = this.filtroEstado === 'activos';
    this.clienteService.filtrarPorEstado(estado, this.pageNumber, this.pageSize).subscribe({
      next: (response: PaginatedResponse<ClienteDTO>) => {
        this.clientes = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error filtrando por estado:', err);
        this.mostrarAlerta('Error en el filtro', 'error');
        this.clientes = [];
        this.totalElements = 0;
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.pageNumber = newPage;
      if (this.searchTerm.trim()) {
        this.buscarClientes();
      } else {
        this.cargarClientes();
      }
    }
  }

  crearCliente(): void {
    this.editandoCliente = null;
    this.clienteForm.reset({ esEmpresa: false, estado: true, tipoDocumento: 'DNI' });
    this.mostrarModal = true;
  }

  editarCliente(cliente: ClienteDTO): void {
    this.editandoCliente = cliente;
    this.clienteForm.patchValue(cliente);
    this.mostrarModal = true;
  }

  guardarCliente(): void {
    if (this.clienteForm.invalid) {
      this.mostrarAlerta('Por favor complete todos los campos correctamente', 'error');
      return;
    }

    this.loading = true;
    const cliente: ClienteDTO = this.clienteForm.value;

    if (this.editandoCliente && cliente.idCliente) {
      // Actualizar
      this.clienteService.actualizar(cliente.idCliente, cliente).subscribe({
        next: () => {
          this.mostrarAlerta('Cliente actualizado correctamente', 'exito');
          this.cerrarModal();
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error actualizando cliente:', err);
          this.mostrarAlerta(err.error?.message || 'Error al actualizar cliente', 'error');
          this.loading = false;
        }
      });
    } else {
      // Crear
      this.clienteService.crear(cliente).subscribe({
        next: () => {
          this.mostrarAlerta('Cliente creado correctamente', 'exito');
          this.cerrarModal();
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error creando cliente:', err);
          this.mostrarAlerta(err.error?.message || 'Error al crear cliente', 'error');
          this.loading = false;
        }
      });
    }
  }

  eliminarCliente(id: number, nombre: string): void {
    if (confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
      this.loading = true;
      this.clienteService.eliminar(id).subscribe({
        next: () => {
          this.mostrarAlerta('Cliente eliminado correctamente', 'exito');
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error eliminando cliente:', err);
          this.mostrarAlerta(err.error?.message || 'Error al eliminar cliente', 'error');
          this.loading = false;
        }
      });
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.editandoCliente = null;
    this.clienteForm.reset({ esEmpresa: false, estado: true, tipoDocumento: 'DNI' });
  }

  exportarExcel(): void {
    if (this.clientes.length === 0) {
      this.mostrarAlerta('No hay clientes para exportar', 'info');
      return;
    }

    const columns: ExportColumn[] = [
      { header: 'ID', field: 'idCliente', width: 10 },
      { header: 'Nombre', field: 'nombre', width: 20 },
      { header: 'Apellidos', field: 'apellidos', width: 20 },
      { header: 'Tipo Documento', field: 'tipoDocumento', width: 15 },
      { header: 'Documento', field: 'numeroDocumento', width: 18 },
      { header: 'Email', field: 'email', width: 25 },
      { header: 'Teléfono', field: 'telefono', width: 15 },
      { header: 'Tipo', field: 'esEmpresa', width: 12 },
      { header: 'Estado', field: 'estado', width: 12 }
    ];

    this.exportService.exportToExcel(
      this.clientes,
      columns,
      'clientes',
      'Clientes'
    );

    this.mostrarAlerta(
      `📊 Excel exportado: ${this.clientes.length} clientes`,
      'exito'
    );
  }

  exportarPDF(): void {
    if (this.clientes.length === 0) {
      this.mostrarAlerta('No hay clientes para exportar', 'info');
      return;
    }

    const columns: ExportColumn[] = [
      { header: 'ID', field: 'idCliente', width: 12 },
      { header: 'Nombre', field: 'nombre', width: 40 },
      { header: 'Apellidos', field: 'apellidos', width: 40 },
      { header: 'Tipo Documento', field: 'tipoDocumento', width: 20 },
      { header: 'Documento', field: 'numeroDocumento', width: 25 },
      { header: 'Email', field: 'email', width: 40 },
      { header: 'Teléfono', field: 'telefono', width: 20 },
      { header: 'Tipo', field: 'esEmpresa', width: 15 },
      { header: 'Estado', field: 'estado', width: 12 }
    ];

    this.exportService.exportToPDF(
      this.clientes,
      columns,
      'clientes',
      'Reporte de Clientes'
    );

    this.mostrarAlerta(
      `📄 PDF exportado: ${this.clientes.length} clientes`,
      'exito'
    );
  }

  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info'): void {
    this.alertaVisible = true;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    setTimeout(() => (this.alertaVisible = false), 3500);
  }

  // ==================== HISTORIAL DE COMPRAS ====================
  cargarHistorialCliente(cliente: ClienteDTO): void {
    this.clienteSeleccionado = cliente;
    this.comprasPageNumber = 0;
    this.cargarCompras();
  }

  cargarCompras(): void {
    if (!this.clienteSeleccionado) return;

    this.comprasLoading = true;
    this.reporteVentaService.ventasPorCliente(this.clienteSeleccionado.idCliente!, this.comprasPageNumber, this.comprasPageSize).subscribe({
      next: (response: PaginatedResponse<CompraDTO>) => {
        this.compras = response.content;
        this.totalCompras = response.totalElements;
        this.comprasLoading = false;
      },
      error: (err) => {
        console.error('Error cargando compras:', err);
        this.mostrarAlerta('Error al cargar historial de compras', 'error');
        this.comprasLoading = false;
      }
    });
  }

  onComprasPageChange(page: number): void {
    if (page >= 0 && page < this.totalComprasPages) {
      this.comprasPageNumber = page;
      this.cargarCompras();
    }
  }

  cerrarHistorialCliente(): void {
    this.clienteSeleccionado = null;
    this.compras = [];
  }

  calcularTotalCompras(): string {
    const total = this.compras.reduce((sum, c) => sum + c.total, 0);
    return total.toFixed(2);
  }

  // ==================== REPORTES ====================
  cargarReportes(): void {
    this.reportesLoading = true;

    // Cargar métricas (con fallback si falla)
    this.dashboardService.obtenerMetricas().subscribe({
      next: (datos) => {
        this.metricas = datos;
      },
      error: (err) => {
        console.warn('Endpoint /api/dashboard/metricas no disponible. Usando valores por defecto.');
        // Proporcionar valores por defecto si el backend no tiene el endpoint
        this.metricas = {
          totalVentas: 0,
          montoTotalVentas: 0,
          totalClientes: this.clientes.length,
          totalProductos: 0,
          productosAgotados: 0,
          ventasHoy: 0,
          ventasEstaSemana: 0,
          ventasEsteMes: 0
        };
      }
    });

    // Cargar productos más vendidos
    this.reporteVentaService.productosMasVendidos().subscribe({
      next: (datos) => {
        this.productosMasVendidos = datos.slice(0, 10);
      },
      error: (err) => {
        console.warn('Error cargando productos más vendidos:', err);
        this.productosMasVendidos = [];
      }
    });

    // Cargar clientes con más compras
    this.reporteVentaService.ventasPorClienteResumen().subscribe({
      next: (datos) => {
        this.clientesTopVentas = datos.slice(0, 10);
        this.reportesLoading = false;
      },
      error: (err) => {
        console.warn('Error cargando clientes top:', err);
        this.clientesTopVentas = [];
        this.reportesLoading = false;
      }
    });
  }

  porcentajeDelTotal(monto: number): number {
    if (this.metricas.montoTotalVentas === 0) return 0;
    return (monto / this.metricas.montoTotalVentas) * 100;
  }

  formatoMoneda(monto: number): string {
    // Validar que el monto sea un número válido
    if (monto === null || monto === undefined || isNaN(monto)) {
      return 'S/ 0.00';
    }

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }
}

