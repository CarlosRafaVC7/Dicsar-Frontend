import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { ReporteVentaService } from '../../services/reporte-venta.service';
import { DashboardService } from '../../services/dashboard.service';
import { ClienteDTO } from '../../models/cliente.model';
import { CompraDTO } from '../../models/compra.model';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { AuthService } from '../../services/auth.service';
import { ExportService, ExportColumn } from '../../services/export.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  activeTab: 'clientes' | 'historial' | 'reportes' = 'clientes';

  allClientes: ClienteDTO[] = [];
  clientes: ClienteDTO[] = [];
  clientesInactivos: ClienteDTO[] = [];
  readonly clientesPageSize = 100;
  totalElements = 0;
  totalInactiveElements = 0;
  pageSize = 10;
  pageNumber = 0;
  inactivePageNumber = 0;
  loading = false;
  searchTerm = '';
  filtroTipo: 'todos' | 'persona' | 'empresa' = 'todos';
  mostrarInactivos = false;
  changingEstadoIds = new Set<number>();

  tiposDocumento = ['DNI', 'RUC', 'PASAPORTE'];
  isAdmin = false;

  mostrarModal = false;
  editandoCliente: ClienteDTO | null = null;
  clienteForm!: FormGroup;

  clienteSeleccionado: ClienteDTO | null = null;
  compras: CompraDTO[] = [];
  comprasLoading = false;
  comprasPageNumber = 0;
  comprasPageSize = 10;
  totalCompras = 0;

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
  reportesLoading = false;

  alertaVisible = false;
  alertaMensaje = '';
  alertaTipo: 'exito' | 'error' | 'info' = 'info';

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get totalInactivePages(): number {
    return Math.ceil(this.totalInactiveElements / this.pageSize);
  }

  get inactivePaginasArray(): number[] {
    return Array.from({ length: this.totalInactivePages }, (_, i) => i);
  }

  get totalComprasPages(): number {
    return Math.ceil(this.totalCompras / this.comprasPageSize);
  }

  get comprasPaginasArray(): number[] {
    return Array.from({ length: this.totalComprasPages }, (_, i) => i);
  }

  get activosCount(): number {
    return this.allClientes.filter(cliente => cliente.estado).length;
  }

  get inactivosCount(): number {
    return this.allClientes.filter(cliente => !cliente.estado).length;
  }

  constructor(
    private clienteService: ClienteService,
    private reporteVentaService: ReporteVentaService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private exportService: ExportService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.clienteForm = this.fb.group({
      idCliente: [null],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8)]],
      direccion: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      razonSocial: [''],
      esEmpresa: [false],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.cargarClientes();
  }

  cambiarTab(tab: 'clientes' | 'historial' | 'reportes'): void {
    this.activeTab = tab;

    if (tab === 'reportes') {
      this.cargarReportes();
    }
  }

  cargarClientes(): void {
    this.loading = true;
    this.cargarClientesPagina(0, []);
  }

  private cargarClientesPagina(page: number, acumulados: ClienteDTO[]): void {
    this.clienteService.listar(page, this.clientesPageSize).subscribe({
      next: (response: PaginatedResponse<ClienteDTO>) => {
        const clientesAcumulados = [...acumulados, ...response.content];
        const quedanPaginas = clientesAcumulados.length < response.totalElements && response.content.length > 0;

        if (quedanPaginas) {
          this.cargarClientesPagina(page + 1, clientesAcumulados);
          return;
        }

        this.allClientes = clientesAcumulados;
        this.actualizarListasFiltradas(false);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando clientes:', err);
        this.mostrarAlerta('Error al cargar clientes', 'error');
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.pageNumber = 0;
    this.inactivePageNumber = 0;
    this.actualizarListasFiltradas(false);
  }

  buscarClientes(): void {
    this.aplicarFiltros();
  }

  filtrarPorTipo(): void {
    this.aplicarFiltros();
  }

  filtrarPorEstado(): void {
    this.aplicarFiltros();
  }

  private actualizarListasFiltradas(resetInactiveVisibility = false): void {
    const filtered = this.allClientes.filter(cliente => this.coincideConFiltros(cliente));
    const activeClientes = filtered.filter(cliente => cliente.estado);
    const inactiveClientes = filtered.filter(cliente => !cliente.estado);

    this.totalElements = activeClientes.length;
    this.totalInactiveElements = inactiveClientes.length;

    if (this.pageNumber >= this.totalPages && this.totalPages > 0) {
      this.pageNumber = this.totalPages - 1;
    }

    if (this.inactivePageNumber >= this.totalInactivePages && this.totalInactivePages > 0) {
      this.inactivePageNumber = this.totalInactivePages - 1;
    }

    const activeStart = this.pageNumber * this.pageSize;
    const inactiveStart = this.inactivePageNumber * this.pageSize;
    this.clientes = activeClientes.slice(activeStart, activeStart + this.pageSize);
    this.clientesInactivos = inactiveClientes.slice(inactiveStart, inactiveStart + this.pageSize);

    if (resetInactiveVisibility && inactiveClientes.length > 0) {
      this.mostrarInactivos = true;
    }
  }

  private coincideConFiltros(cliente: ClienteDTO): boolean {
    const term = this.searchTerm.trim().toLowerCase();
    const nombreCompleto = this.getNombreCompleto(cliente).toLowerCase();
    const documento = cliente.numeroDocumento?.toLowerCase() || '';
    const email = cliente.email?.toLowerCase() || '';
    const telefono = cliente.telefono?.toLowerCase() || '';

    const matchesSearch = !term ||
      nombreCompleto.includes(term) ||
      documento.includes(term) ||
      email.includes(term) ||
      telefono.includes(term);

    const matchesTipo =
      this.filtroTipo === 'todos' ||
      (this.filtroTipo === 'empresa' && cliente.esEmpresa) ||
      (this.filtroTipo === 'persona' && !cliente.esEmpresa);

    return matchesSearch && matchesTipo;
  }

  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.pageNumber = newPage;
      this.actualizarListasFiltradas(false);
    }
  }

  onInactivePageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalInactivePages) {
      this.inactivePageNumber = newPage;
      this.actualizarListasFiltradas(false);
    }
  }

  toggleMostrarInactivos(): void {
    this.mostrarInactivos = !this.mostrarInactivos;
    if (this.mostrarInactivos) {
      this.inactivePageNumber = 0;
      this.actualizarListasFiltradas(false);
    }
  }

  crearCliente(): void {
    this.editandoCliente = null;
    this.clienteForm.reset({
      esEmpresa: false,
      estado: true,
      tipoDocumento: 'DNI',
      direccion: '',
      razonSocial: ''
    });
    this.mostrarModal = true;
  }

  editarCliente(cliente: ClienteDTO): void {
    this.editandoCliente = cliente;
    this.clienteForm.patchValue(cliente);
    this.mostrarModal = true;
  }

  guardarCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      this.mostrarAlerta('Por favor complete todos los campos correctamente', 'error');
      return;
    }

    this.loading = true;
    const cliente: ClienteDTO = this.clienteForm.value;

    if (this.editandoCliente && cliente.idCliente) {
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

  toggleEstadoCliente(cliente: ClienteDTO): void {
    if (!this.isAdmin || !cliente.idCliente || this.changingEstadoIds.has(cliente.idCliente)) {
      return;
    }

    const previousEstado = cliente.estado;
    const nuevoEstado = !previousEstado;
    const id = cliente.idCliente;
    this.changingEstadoIds.add(id);
    cliente.estado = nuevoEstado;
    this.actualizarListasFiltradas(!nuevoEstado);

    this.clienteService.cambiarEstado(id, nuevoEstado).subscribe({
      next: () => {
        this.confirmarCambioEstado(id, nuevoEstado);
      },
      error: (err) => {
        console.error('Error al cambiar estado del cliente:', err);
        this.reintentarCambioEstadoConActualizacion(cliente, previousEstado, nuevoEstado);
      }
    });
  }

  private reintentarCambioEstadoConActualizacion(
    cliente: ClienteDTO,
    previousEstado: boolean,
    nuevoEstado: boolean
  ): void {
    const id = cliente.idCliente;
    if (!id) return;

    const payload: ClienteDTO = { ...cliente, estado: nuevoEstado };
    this.clienteService.actualizar(id, payload).subscribe({
      next: () => {
        this.confirmarCambioEstado(id, nuevoEstado);
      },
      error: (err) => {
        console.error('Error al actualizar estado del cliente con fallback:', err);
        cliente.estado = previousEstado;
        this.changingEstadoIds.delete(id);
        this.actualizarListasFiltradas(false);
        this.mostrarAlerta(this.obtenerMensajeError(err, 'Error al cambiar el estado del cliente'), 'error');
      }
    });
  }

  private confirmarCambioEstado(id: number, nuevoEstado: boolean): void {
    this.mostrarAlerta(`Cliente ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`, 'exito');
    this.changingEstadoIds.delete(id);
    this.cargarClientes();
  }

  eliminarCliente(id: number, nombre: string): void {
    const cliente = this.allClientes.find(item => item.idCliente === id);
    if (!cliente) return;

    const accion = cliente.estado ? 'desactivar' : 'activar';
    if (confirm(`¿Estás seguro de ${accion} a ${nombre}?`)) {
      this.toggleEstadoCliente(cliente);
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.editandoCliente = null;
    this.clienteForm.reset({
      esEmpresa: false,
      estado: true,
      tipoDocumento: 'DNI',
      direccion: '',
      razonSocial: ''
    });
  }

  exportarExcel(): void {
    const clientesExportar = this.allClientes.filter(cliente => cliente.estado);
    if (clientesExportar.length === 0) {
      this.mostrarAlerta('No hay clientes activos para exportar', 'info');
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

    this.exportService.exportToExcel(clientesExportar, columns, 'clientes_activos', 'Clientes Activos');
    this.mostrarAlerta(`Excel exportado: ${clientesExportar.length} clientes`, 'exito');
  }

  exportarPDF(): void {
    const clientesExportar = this.allClientes.filter(cliente => cliente.estado);
    if (clientesExportar.length === 0) {
      this.mostrarAlerta('No hay clientes activos para exportar', 'info');
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

    this.exportService.exportToPDF(clientesExportar, columns, 'clientes_activos', 'Reporte de Clientes Activos');
    this.mostrarAlerta(`PDF exportado: ${clientesExportar.length} clientes`, 'exito');
  }

  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info'): void {
    this.alertaVisible = true;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;

    if (tipo === 'exito') {
      this.toastService.success(mensaje);
    } else if (tipo === 'error') {
      this.toastService.error(mensaje);
    } else {
      this.toastService.info(mensaje);
    }

    setTimeout(() => (this.alertaVisible = false), 3500);
  }

  private obtenerMensajeError(error: any, mensajeDefault: string): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.errors) {
      return Object.values(error.error.errors).join(', ');
    }

    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    return mensajeDefault;
  }

  cargarHistorialCliente(cliente: ClienteDTO): void {
    this.clienteSeleccionado = cliente;
    this.comprasPageNumber = 0;
    this.cargarCompras();
    this.cambiarTab('historial');
  }

  cargarCompras(): void {
    if (!this.clienteSeleccionado) return;

    this.comprasLoading = true;
    this.reporteVentaService.ventasPorCliente(
      this.clienteSeleccionado.idCliente!,
      this.comprasPageNumber,
      this.comprasPageSize
    ).subscribe({
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
    const total = this.compras.reduce((sum, compra) => sum + compra.total, 0);
    return total.toFixed(2);
  }

  cargarReportes(): void {
    this.reportesLoading = true;

    this.dashboardService.obtenerMetricas().subscribe({
      next: (datos) => {
        this.metricas = datos;
      },
      error: () => {
        this.metricas = {
          totalVentas: 0,
          montoTotalVentas: 0,
          totalClientes: this.allClientes.length,
          totalProductos: 0,
          productosAgotados: 0,
          ventasHoy: 0,
          ventasEstaSemana: 0,
          ventasEsteMes: 0
        };
      }
    });

    this.reporteVentaService.productosMasVendidos().subscribe({
      next: (datos) => {
        this.productosMasVendidos = datos.slice(0, 10);
      },
      error: (err) => {
        console.warn('Error cargando productos más vendidos:', err);
        this.productosMasVendidos = [];
      }
    });

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
    if (monto === null || monto === undefined || isNaN(monto)) {
      return 'S/ 0.00';
    }

    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }

  getNombreCompleto(cliente: ClienteDTO): string {
    return cliente.nombreCompleto || `${cliente.nombre || ''} ${cliente.apellidos || ''}`.trim();
  }

  esInvalido(campo: string): boolean {
    const control = this.clienteForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }
}
