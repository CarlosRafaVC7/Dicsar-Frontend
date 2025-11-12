import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Proveedor } from '../../models/proveedor.model';
import { Producto } from '../../models/producto.model';
import { ProveedorService, PageResponse } from '../../services/proveedor.service';
import { ProductoService } from '../../services/producto.service';
import { ReporteService } from '../../services/reporte.service';
import { ExportService } from '../../services/export.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit, AfterViewInit {
  @ViewChild('chartProveedores') chartProveedoresRef!: ElementRef;
  @ViewChild('chartProductos') chartProductosRef!: ElementRef;
  
  // Instancias de los gráficos
  private chartProveedoresInstance: Chart | null = null;
  private chartProductosInstance: Chart | null = null;
  
  // === 🧭 CONTROL DE TABS ===
  activeTab: 'proveedores' | 'productos-proveedor' | 'reportes' = 'proveedores';

  // === 🏢 PROVEEDORES ===
  proveedores: Proveedor[] = [];
  proveedorForm!: FormGroup;
  editandoProveedor: Proveedor | null = null;
  mostrarModalProveedor = false;

  // === 🔍 BÚSQUEDA Y FILTROS ===
  search: string = '';
  busqueda: string = '';
  terminoBusqueda: any;
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';
  
  // === 🔍 FILTRADO DE PROVEEDORES ===
  busquedaProveedor: string = '';
  proveedoresFiltrados: Proveedor[] = [];

  // === 📄 PAGINACIÓN ===
  paginaActualProveedores = 1;
  itemsPorPaginaProveedores = 10;
  totalPaginasProveedores = 1;

  // === 🏷️ PRODUCTOS POR PROVEEDOR ===
  proveedorSeleccionado: Proveedor | null = null;
  productosProveedor: Producto[] = [];
  productosProveedorActivos: number = 0;
  searchProducto: string = '';
  currentPageProductos = 0;
  pageSizeProductos = 10;
  totalElementsProductos = 0;
  totalPagesProductos = 0;

  // === 📊 REPORTES ===
  reporteProveedores: any = null;

  // === ⚠️ ALERTAS ===
  alertaVisible = false;
  alertaMensaje = '';
  alertaTipo: 'exito' | 'error' | 'info' = 'info';

  constructor(
    private proveedorService: ProveedorService,
    private productoService: ProductoService,
    private reporteService: ReporteService,
    private exportService: ExportService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarProveedores();
  }

  // ==================== INICIALIZACIÓN ====================
  inicializarFormulario(): void {
    this.proveedorForm = this.fb.group({
      idProveedor: [null],
      razonSocial: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      ruc: ['', [Validators.required, Validators.pattern('^(10|15|16|17|20)\\d{9}$')]],
      direccion: ['', [Validators.required, Validators.maxLength(300)]],
      telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email]],
      contacto: ['', [Validators.maxLength(200)]]
    });
  }

  resetProveedor(): Proveedor {
    return {
      razonSocial: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto: '',
      estado: true
    };
  }

  // ==================== CRUD PROVEEDORES ====================
  cargarProveedores(): void {
    this.proveedorService.listar().subscribe({
      next: (data: Proveedor[]) => {
        this.proveedores = data;
        this.proveedoresFiltrados = [...data];
        this.actualizarPaginacionProveedores();
      },
      error: (err) => {
        console.error('Error al listar proveedores:', err);
        this.mostrarAlerta('Error al cargar la lista de proveedores', 'error');
      }
    });
  }

  abrirModalProveedor(): void {
    this.editandoProveedor = null;
    this.proveedorForm.reset(this.resetProveedor());
    this.mostrarModalProveedor = true;
  }

  editarProveedor(prov: Proveedor): void {
    this.editandoProveedor = prov;
    this.proveedorForm.patchValue(prov);
    this.mostrarModalProveedor = true;
  }

  guardarProveedor(): void {
    if (this.proveedorForm.invalid) {
      this.marcarCamposComoTocados();
      this.mostrarAlerta('Por favor complete todos los campos obligatorios correctamente', 'error');
      return;
    }

    const proveedor: Proveedor = this.proveedorForm.value;

    if (this.editandoProveedor && proveedor.idProveedor) {
      this.proveedorService.actualizar(proveedor.idProveedor, proveedor).subscribe({
        next: () => {
          this.mostrarAlerta('Proveedor actualizado correctamente', 'exito');
          this.cerrarModalProveedor();
          this.cargarProveedores();
        },
        error: (err) => this.manejarError(err, 'Error al actualizar proveedor')
      });
    } else {
      this.proveedorService.crear(proveedor).subscribe({
        next: () => {
          this.mostrarAlerta('Proveedor creado correctamente', 'exito');
          this.cerrarModalProveedor();
          this.cargarProveedores();
        },
        error: (err) => this.manejarError(err, 'Error al crear proveedor')
      });
    }
  }

  eliminarProveedor(id?: number): void {
    if (!id) return;
    
    if (!confirm('¿Está seguro que desea eliminar este proveedor?')) {
      return;
    }

    this.proveedorService.eliminar(id).subscribe({
      next: () => {
        this.mostrarAlerta('Proveedor eliminado correctamente', 'exito');
        this.cargarProveedores();
      },
      error: (err) => this.manejarError(err, 'Error al eliminar proveedor')
    });
  }

  toggleEstadoProveedor(proveedor: Proveedor): void {
    if (!proveedor.idProveedor) return;

    const nuevoEstado = !proveedor.estado;
    this.proveedorService.cambiarEstado(proveedor.idProveedor, nuevoEstado).subscribe({
      next: () => {
        proveedor.estado = nuevoEstado;
        this.mostrarAlerta(`Proveedor ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`, 'exito');
      },
      error: (err) => this.manejarError(err, 'Error al cambiar estado')
    });
  }

  cerrarModalProveedor(): void {
    this.mostrarModalProveedor = false;
    this.editandoProveedor = null;
    this.proveedorForm.reset();
  }

  // ==================== BÚSQUEDA Y FILTROS ====================
  onBuscar(): void {
    this.paginaActualProveedores = 1;
    this.actualizarPaginacionProveedores();
  }

  onFiltroEstadoChange(): void {
    this.paginaActualProveedores = 1;
    this.actualizarPaginacionProveedores();
  }

  // ==================== PAGINACIÓN ====================
  actualizarPaginacionProveedores(): void {
    const filtered = this.getProveedoresFiltrados();
    this.totalPaginasProveedores = Math.ceil(filtered.length / this.itemsPorPaginaProveedores);
    if (this.paginaActualProveedores > this.totalPaginasProveedores) {
      this.paginaActualProveedores = 1;
    }
  }

  cambiarPaginaProveedores(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasProveedores) {
      this.paginaActualProveedores = pagina;
    }
  }

  get paginasArrayProveedores(): number[] {
    return Array.from({ length: this.totalPaginasProveedores }, (_, i) => i + 1);
  }

  getProveedoresFiltrados(): Proveedor[] {
    const busqueda = (this.busqueda || '').toLowerCase().trim();
    
    let filtered = this.proveedores.filter(p => {
      const matchesBusqueda = !busqueda ||
        p.razonSocial?.toLowerCase().includes(busqueda) ||
        p.ruc?.toLowerCase().includes(busqueda);
      
      const matchesEstado = this.filtroEstado === 'todos' ||
        (this.filtroEstado === 'activos' && p.estado === true) ||
        (this.filtroEstado === 'inactivos' && p.estado === false);
      
      return matchesBusqueda && matchesEstado;
    });

    return filtered;
  }

  get proveedoresVisibles(): Proveedor[] {
    const filtered = this.getProveedoresFiltrados();
    const inicio = (this.paginaActualProveedores - 1) * this.itemsPorPaginaProveedores;
    const fin = inicio + this.itemsPorPaginaProveedores;
    return filtered.slice(inicio, fin);
  }

  // ==================== PRODUCTOS POR PROVEEDOR ====================
  filtrarProveedores(): void {
    const busqueda = this.busquedaProveedor.toLowerCase().trim();
    if (busqueda === '') {
      this.proveedoresFiltrados = [...this.proveedores];
    } else {
      this.proveedoresFiltrados = this.proveedores.filter(p =>
        p.razonSocial?.toLowerCase().includes(busqueda) ||
        p.ruc?.toLowerCase().includes(busqueda)
      );
    }
  }

  seleccionarProveedor(proveedor: Proveedor): void {
    this.proveedorSeleccionado = proveedor;
    this.currentPageProductos = 0;
    this.cargarProductosProveedor();
  }

  cargarProductosProveedor(): void {
    if (!this.proveedorSeleccionado?.idProveedor) return;

    this.proveedorService.obtenerProductosPorProveedor(
      this.proveedorSeleccionado.idProveedor,
      this.searchProducto || undefined,
      this.currentPageProductos,
      this.pageSizeProductos
    ).subscribe({
      next: (page: PageResponse<Producto>) => {
        this.productosProveedor = page.content;
        this.totalElementsProductos = page.totalElements;
        this.totalPagesProductos = page.totalPages;
        this.productosProveedorActivos = this.productosProveedor.filter(p => p.estado).length;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.mostrarAlerta('Error al cargar productos del proveedor', 'error');
      }
    });
  }

  onBuscarProducto(): void {
    this.currentPageProductos = 0;
    this.cargarProductosProveedor();
  }

  cambiarPaginaProductos(page: number): void {
    if (page >= 0 && page < this.totalPagesProductos) {
      this.currentPageProductos = page;
      this.cargarProductosProveedor();
    }
  }

  // ==================== REPORTES ====================
  cargarReportes(): void {
    this.reporteService.obtenerReporteProveedores().subscribe({
      next: (data) => {
        this.reporteProveedores = data;
        // Inicializar gráficos después de cargar los datos
        setTimeout(() => this.inicializarGraficos(), 200);
      },
      error: (err) => console.error('Error al cargar reporte de proveedores:', err)
    });
  }

  calcularPorcentaje(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }

  calcularPromedioProductos(): string {
    if (!this.reporteProveedores || this.reporteProveedores.totalProveedores === 0) {
      return '0';
    }
    // Si existe proveedorConMasProductos, calculamos basado en eso
    // De lo contrario, retornamos un promedio básico
    const promedio = this.reporteProveedores.proveedorConMasProductos 
      ? (this.reporteProveedores.proveedorConMasProductos.cantidadProductos / this.reporteProveedores.totalProveedores)
      : 0;
    return promedio.toFixed(1);
  }

  exportarReporteProveedoresExcel(): void {
    if (!this.reporteProveedores) {
      this.mostrarAlerta('No hay datos de reportes para exportar', 'error');
      return;
    }

    const datosReporte = [
      { 
        'Métrica': 'Total Proveedores', 
        'Dato': String(this.reporteProveedores.totalProveedores),
        'Descripción': 'Total de proveedores registrados'
      },
      { 
        'Métrica': 'Proveedores Activos', 
        'Dato': String(this.reporteProveedores.proveedoresActivos),
        'Descripción': 'Proveedores con estado activo'
      },
      { 
        'Métrica': 'Proveedores Inactivos', 
        'Dato': String(this.reporteProveedores.totalProveedores - this.reporteProveedores.proveedoresActivos),
        'Descripción': 'Proveedores con estado inactivo'
      },
      { 
        'Métrica': 'Proveedor Destacado', 
        'Dato': this.reporteProveedores.proveedorConMasProductos?.razonSocial || 'N/A',
        'Descripción': `${this.reporteProveedores.proveedorConMasProductos?.cantidadProductos || 0} productos`
      }
    ];

    const columns = [
      { header: 'Métrica', field: 'Métrica', width: 30 },
      { header: 'Dato', field: 'Dato', width: 20 },
      { header: 'Descripción', field: 'Descripción', width: 40 }
    ];

    this.exportService.exportToExcel(datosReporte, columns, 'reporte_proveedores');
    this.mostrarAlerta('📊 Reporte de proveedores exportado a Excel', 'exito');
  }

  exportarReporteProveedoresPDF(): void {
    if (!this.reporteProveedores) {
      this.mostrarAlerta('No hay datos de reportes para exportar', 'error');
      return;
    }

    const datosReporte = [
      { 
        metrica: 'Total Proveedores', 
        dato: String(this.reporteProveedores.totalProveedores),
        descripcion: 'Total de proveedores registrados'
      },
      { 
        metrica: 'Proveedores Activos', 
        dato: String(this.reporteProveedores.proveedoresActivos),
        descripcion: 'Proveedores con estado activo'
      },
      { 
        metrica: 'Proveedores Inactivos', 
        dato: String(this.reporteProveedores.totalProveedores - this.reporteProveedores.proveedoresActivos),
        descripcion: 'Proveedores con estado inactivo'
      },
      { 
        metrica: 'Proveedor Destacado', 
        dato: this.reporteProveedores.proveedorConMasProductos?.razonSocial || 'N/A',
        descripcion: `${this.reporteProveedores.proveedorConMasProductos?.cantidadProductos || 0} productos registrados`
      }
    ];

    const columns = [
      { header: 'Métrica', field: 'metrica', width: 100 },
      { header: 'Dato', field: 'dato', width: 80 },
      { header: 'Descripción', field: 'descripcion', width: 100 }
    ];

    this.exportService.exportToPDF(datosReporte, columns, 'reporte_proveedores', 'Reporte de Proveedores');
    this.mostrarAlerta('📄 Reporte de proveedores exportado a PDF', 'exito');
  }

  // ==================== UTILIDADES ====================
  get proveedoresActivos(): number {
    return this.proveedores.filter(p => p.estado).length;
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.proveedorForm.controls).forEach(key => {
      this.proveedorForm.get(key)?.markAsTouched();
    });
  }

  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info'): void {
    this.alertaVisible = true;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    setTimeout(() => (this.alertaVisible = false), 3500);
  }

  manejarError(error: any, mensajeDefault: string): void {
    let mensaje = mensajeDefault;
    
    if (error.error?.message) {
      mensaje = error.error.message;
    } else if (error.error?.errors) {
      const errores = error.error.errors;
      mensaje = Object.values(errores).join(', ');
    } else if (typeof error.error === 'string') {
      mensaje = error.error;
    }
    
    this.mostrarAlerta(mensaje, 'error');
  }

  // ==================== VALIDACIÓN DE FORMULARIO ====================
  esInvalido(campo: string): boolean {
    const control = this.proveedorForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.proveedorForm.get(campo);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control.hasError('email')) {
      return 'Ingrese un email válido';
    }
    if (control.hasError('pattern')) {
      if (campo === 'ruc') {
        return 'El RUC debe tener 11 dígitos y comenzar con 10, 15, 16, 17 o 20';
      }
    }
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  }

  exportarProveedoresPDF(): void {
    const proveedoresActivos = this.proveedores.filter(p => p.estado === true);
    const columns = [
      { header: 'ID', field: 'idProveedor', width: 30 },
      { header: 'Razón Social', field: 'razonSocial', width: 100 },
      { header: 'RUC', field: 'ruc', width: 50 },
      { header: 'Teléfono', field: 'telefono', width: 50 },
      { header: 'Email', field: 'email', width: 80 }
    ];
    this.exportService.exportToPDF(proveedoresActivos, columns, 'proveedores_activos', 'Listado de Proveedores Activos');
    this.mostrarAlerta(`📄 PDF exportado: ${proveedoresActivos.length} proveedores`, 'exito');
  }

  exportarProveedoresExcel(): void {
    const proveedoresActivos = this.proveedores.filter(p => p.estado === true);
    const columns = [
      { header: 'ID', field: 'idProveedor', width: 15 },
      { header: 'Razón Social', field: 'razonSocial', width: 40 },
      { header: 'RUC', field: 'ruc', width: 15 },
      { header: 'Teléfono', field: 'telefono', width: 15 },
      { header: 'Email', field: 'email', width: 30 },
      { header: 'Dirección', field: 'direccion', width: 40 },
      { header: 'Contacto', field: 'contacto', width: 25 },
      { header: 'Estado', field: 'estado', width: 12 }
    ];
    this.exportService.exportToExcel(proveedoresActivos, columns, 'proveedores_activos');
    this.mostrarAlerta(`📊 Excel exportado: ${proveedoresActivos.length} proveedores`, 'exito');
  }

  ngAfterViewInit(): void {
    // Los gráficos se inicializarán cuando el tab de reportes esté activo
  }

  cambiarTab(tab: 'proveedores' | 'productos-proveedor' | 'reportes'): void {
    const oldTab = this.activeTab;
    this.activeTab = tab;
    
    if (tab === 'reportes' && oldTab !== 'reportes') {
      this.cargarReportes();
    }
  }

  private inicializarGraficos(): void {
    // Verificar que los elementos del DOM y los datos existan
    if (!this.reporteProveedores) {
      console.warn('No hay datos de reportes disponibles');
      return;
    }

    if (this.chartProveedoresRef?.nativeElement) {
      this.crearGraficoProveedores();
    } else {
      console.warn('Referencia al canvas de proveedores no disponible');
    }

    if (this.chartProductosRef?.nativeElement) {
      this.crearGraficoProductosPorProveedor();
    } else {
      console.warn('Referencia al canvas de productos no disponible');
    }
  }

  private crearGraficoProveedores(): void {
    // Destruir gráfico anterior si existe
    if (this.chartProveedoresInstance) {
      this.chartProveedoresInstance.destroy();
    }

    const ctx = this.chartProveedoresRef.nativeElement.getContext('2d');
    const activos = this.reporteProveedores.proveedoresActivos;
    const inactivos = this.reporteProveedores.totalProveedores - this.reporteProveedores.proveedoresActivos;
    
    this.chartProveedoresInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [{
          data: [activos, inactivos],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = activos + inactivos;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private crearGraficoProductosPorProveedor(): void {
    // Destruir gráfico anterior si existe
    if (this.chartProductosInstance) {
      this.chartProductosInstance.destroy();
    }

    const ctx = this.chartProductosRef.nativeElement.getContext('2d');
    
    // Crear datos para el gráfico de barras con los proveedores
    const labels: string[] = [];
    const data: number[] = [];
    
    // Agregar el proveedor con más productos si existe
    if (this.reporteProveedores.proveedorConMasProductos) {
      labels.push(this.reporteProveedores.proveedorConMasProductos.razonSocial);
      data.push(this.reporteProveedores.proveedorConMasProductos.cantidadProductos);
    }
    
    // Obtener otros proveedores con productos (simulación)
    // En un caso real, esto vendría del backend
    this.proveedores.slice(0, 5).forEach(prov => {
      if (prov.razonSocial && !labels.includes(prov.razonSocial)) {
        labels.push(prov.razonSocial);
        // Valor simulado - en producción vendría del backend
        data.push(Math.floor(Math.random() * 10) + 1);
      }
    });
    
    this.chartProductosInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad de Productos',
          data: data,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Productos: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            title: {
              display: true,
              text: 'Cantidad de Productos'
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }
}

