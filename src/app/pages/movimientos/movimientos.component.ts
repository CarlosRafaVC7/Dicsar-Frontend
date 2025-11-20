import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovimientoService } from '../../services/movimiento.service';
import { ProductoService } from '../../services/producto.service';
import { ProveedorService } from '../../services/proveedor.service';
import { ClienteService } from '../../services/cliente.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css']
})
export class MovimientosComponent implements OnInit, OnDestroy {
  // Tabs
  activeTab: 'registro' | 'reportes' = 'registro';

  // Formulario
  movimientoForm!: FormGroup;
  tipoMovimiento: 'SALIDA' | 'ENTRADA' | 'AJUSTE' = 'SALIDA';

  // Listas
  movimientos: any[] = [];
  productos: any[] = [];
  proveedores: any[] = [];
  clientes: any[] = [];

  // Estados
  loading = false;
  mostrarAlerta = false;
  mensajeAlerta = '';
  tipoAlerta: 'exito' | 'error' | 'info' = 'info';

  // Filtros
  busqueda = '';
  filtroTipo = 'SALIDA';
  filtroFecha = '';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;

  // Precio y validación
  precioActual: number = 0;
  productoSeleccionado: any = null;
  errorPrecio = '';

  // Destroy
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private movimientoService: MovimientoService,
    private productoService: ProductoService,
    private proveedorService: ProveedorService,
    private clienteService: ClienteService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.movimientoForm = this.fb.group({
      tipo: ['SALIDA', Validators.required],
      producto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      cliente: [''],
      proveedor: [''],
      motivo: ['', Validators.required],
      observaciones: [''],
      referencia: ['']
    });
  }

  cargarDatos(): void {
    this.loading = true;

    // Cargar productos
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (err) => console.error('Error cargando productos:', err)
    });

    // Cargar proveedores
    this.proveedorService.listar().subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (err) => console.error('Error cargando proveedores:', err)
    });

    // Cargar clientes
    this.clienteService.listar().subscribe({
      next: (data: any) => {
        // Manejar tanto respuesta directa como respuesta paginada
        this.clientes = Array.isArray(data) ? data : (data.content || []);
      },
      error: (err) => console.error('Error cargando clientes:', err)
    });

    // Cargar movimientos
    this.movimientoService.listar().subscribe({
      next: (data) => {
        this.movimientos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando movimientos:', err);
        this.loading = false;
      }
    });
  }

  cambiarTab(tab: 'registro' | 'reportes'): void {
    this.activeTab = tab;
    if (tab === 'reportes') {
      this.cargarDatos();
    }
  }

  cambiarTipo(tipo: 'SALIDA' | 'ENTRADA' | 'AJUSTE'): void {
    this.tipoMovimiento = tipo;
    this.movimientoForm.patchValue({ tipo });
    this.movimientoForm.patchValue({ producto: '' });
    this.precioActual = 0;
    this.productoSeleccionado = null;
    this.actualizarValidadores();
  }

  actualizarValidadores(): void {
    const clienteControl = this.movimientoForm.get('cliente');
    const proveedorControl = this.movimientoForm.get('proveedor');

    clienteControl?.clearValidators();
    proveedorControl?.clearValidators();

    if (this.tipoMovimiento === 'SALIDA') {
      clienteControl?.setValidators([Validators.required]);
    } else if (this.tipoMovimiento === 'ENTRADA') {
      proveedorControl?.setValidators([Validators.required]);
    }

    clienteControl?.updateValueAndValidity();
    proveedorControl?.updateValueAndValidity();
  }

  onProductoSeleccionado(): void {
    const idProducto = this.movimientoForm.get('producto')?.value;

    if (!idProducto) {
      this.precioActual = 0;
      this.productoSeleccionado = null;
      this.errorPrecio = '';
      return;
    }

    // Encontrar el producto seleccionado
    this.productoSeleccionado = this.productos.find(p => p.idProducto === parseInt(idProducto));

    if (this.productoSeleccionado) {
      console.log('Producto seleccionado:', this.productoSeleccionado);
      console.log('Tipo:', this.tipoMovimiento);
      // Obtener el precio según el tipo de movimiento
      this.obtenerPrecioProducto(idProducto);
    }
  }

  obtenerPrecioProducto(idProducto: number): void {
    this.movimientoService.obtenerPrecio(idProducto, this.tipoMovimiento).subscribe({
      next: (respuesta: any) => {
        this.precioActual = respuesta.precio || 0;
        this.errorPrecio = '';
      },
      error: (err: any) => {
        console.warn('Endpoint /precio no disponible, usando precios del producto local');
        // Fallback: usar precios del producto local
        if (this.productoSeleccionado) {
          this.calcularPrecioLocal();
        } else {
          this.errorPrecio = 'No se pudo obtener el precio del producto';
          this.precioActual = 0;
        }
      }
    });
  }

  calcularPrecioLocal(): void {
    if (!this.productoSeleccionado) return;

    let precio = 0;
    switch (this.tipoMovimiento) {
      case 'SALIDA':
        // Para ventas: usar precio de venta o precio base
        precio = this.productoSeleccionado.precio || this.productoSeleccionado.precioBase || 0;
        break;
      case 'ENTRADA':
        // Para compras: usar precio de compra o precio base
        precio = this.productoSeleccionado.precioCompra || this.productoSeleccionado.precioBase || 0;
        break;
      case 'AJUSTE':
        // Para ajustes: usar precio base o precio de venta
        precio = this.productoSeleccionado.precioBase || this.productoSeleccionado.precio || 0;
        break;
    }
    this.precioActual = precio;
    this.errorPrecio = '';
  }

  validarStock(): boolean {
    if (!this.productoSeleccionado) {
      this.errorPrecio = 'Selecciona un producto';
      return false;
    }

    const cantidad = this.movimientoForm.get('cantidad')?.value || 0;
    const stock = this.productoSeleccionado.stockActual || 0;

    if (this.tipoMovimiento === 'SALIDA' && cantidad > stock) {
      this.errorPrecio = `Stock insuficiente. Disponible: ${stock}`;
      return false;
    }

    this.errorPrecio = '';
    return true;
  }

  guardarMovimiento(): void {
    if (this.movimientoForm.invalid) {
      this.mostrarAlertaTemp('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (!this.validarStock()) {
      this.mostrarAlertaTemp(this.errorPrecio, 'error');
      return;
    }

    this.loading = true;

    // Construir payload con producto completo
    const formValue = this.movimientoForm.value;

    // Obtener cliente completo si existe
    const clienteId = formValue.cliente ? parseInt(formValue.cliente) : null;
    const clienteSeleccionado = clienteId ? this.clientes.find(c => c.idCliente === clienteId) : null;

    // Obtener proveedor completo si existe
    const proveedorId = formValue.proveedor ? parseInt(formValue.proveedor) : null;
    const proveedorSeleccionado = proveedorId ? this.proveedores.find(p => p.idProveedor === proveedorId) : null;

    const movimiento = {
      tipoMovimiento: formValue.tipo,
      producto: this.productoSeleccionado,
      cantidad: formValue.cantidad,
      precio: this.precioActual,
      cliente: clienteSeleccionado || null,
      proveedor: proveedorSeleccionado || null,
      motivo: formValue.motivo,
      observaciones: formValue.observaciones,
      referencia: formValue.referencia
    };

    console.log('📤 Enviando movimiento:', movimiento);

    this.movimientoService.crear(movimiento).subscribe({
      next: () => {
        this.mostrarAlertaTemp('✅ Movimiento registrado correctamente', 'exito');
        this.movimientoForm.reset({ tipo: 'SALIDA' });
        this.precioActual = 0;
        this.productoSeleccionado = null;
        this.cargarDatos();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Error registrando movimiento:', err);
        console.error('Response:', err.error);
        this.mostrarAlertaTemp(err.error?.message || 'Error al registrar movimiento', 'error');
        this.loading = false;
      }
    });
  }

  get movimientosFiltrados(): any[] {
    return this.movimientos.filter(m => {
      // Backend devuelve 'tipoMovimiento', no 'tipo'
      const tipo = m.tipoMovimiento || m.tipo;
      const coincideTipo = this.filtroTipo === 'TODOS' || tipo === this.filtroTipo;
      const coincideBusqueda = !this.busqueda ||
        m.producto?.nombre?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        m.cliente?.nombre?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        m.proveedor?.nombre?.toLowerCase().includes(this.busqueda.toLowerCase());

      return coincideTipo && coincideBusqueda;
    });
  }

  get movimientosVisibles(): any[] {
    const filtered = this.movimientosFiltrados;
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtered.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.movimientosFiltrados.length / this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  formatearMoneda(valor: number): string {
    if (!valor) return 'S/ 0.00';
    return 'S/ ' + valor.toFixed(2);
  }

  getTipoBadge(tipo: string): string {
    switch (tipo) {
      case 'SALIDA':
        return 'badge-danger';
      case 'ENTRADA':
        return 'badge-success';
      case 'AJUSTE':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getTipoLabel(tipo: string): string {
    switch (tipo) {
      case 'SALIDA':
        return '⬇️ Salida';
      case 'ENTRADA':
        return '⬆️ Entrada';
      case 'AJUSTE':
        return '🔄 Ajuste';
      default:
        return tipo;
    }
  }

  mostrarAlertaTemp(mensaje: string, tipo: 'exito' | 'error' | 'info'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
    setTimeout(() => {
      this.mostrarAlerta = false;
    }, 3500);
  }

  // Métodos helper para reportes
  get salidasCount(): number {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'SALIDA').length;
  }

  get entradasCount(): number {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'ENTRADA').length;
  }

  get ajustesCount(): number {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'AJUSTE').length;
  }

  get salidas(): any[] {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'SALIDA').slice(-5);
  }

  get entradas(): any[] {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'ENTRADA').slice(-5);
  }
}
