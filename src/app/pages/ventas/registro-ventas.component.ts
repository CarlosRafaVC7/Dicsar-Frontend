import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VentaService } from '../../services/venta.service';
import { ClienteService } from '../../services/cliente.service';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';
import { ClienteDTO } from '../../models/cliente.model';
import { Producto } from '../../models/producto.model';
import { Venta } from '../../models/venta.model';

@Component({
  selector: 'app-registro-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-ventas.component.html',
  styleUrls: ['./registro-ventas.component.css']
})
export class RegistroVentasComponent implements OnInit {
  @Output() ventaRegistrada = new EventEmitter<void>();

  ventaForm!: FormGroup;
  clientes: ClienteDTO[] = [];
  productos: Producto[] = [];

  clienteSeleccionado: ClienteDTO | null = null;
  productoSeleccionado: Producto | null = null;

  mostrarModalClientes = false;
   mostrarModalProductos = false;
   filtroClientes = '';
   filtroProductos = '';
   mostrarFormularioCliente = false;
   guardandoCliente = false;
   nuevoClienteForm!: FormGroup;

   loading = false;
   cantidadError = '';

   constructor(
     private fb: FormBuilder,
     private ventaService: VentaService,
     private clienteService: ClienteService,
     private productoService: ProductoService,
     private toastService: ToastService
   ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarClientes();
    this.cargarProductos();
  }

  inicializarFormulario(): void {
    this.ventaForm = this.fb.group({
      clienteId: ['', Validators.required],
      productoId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }],
      tipoDocumento: ['Factura', Validators.required]
    });

    this.nuevoClienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8)]],
      direccion: [''],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      razonSocial: [''],
      esEmpresa: [false],
      estado: [true]
    });
  }

   cargarClientes(): void {
     this.clienteService.obtenerActivos().subscribe({
       next: (clientes) => {
         this.clientes = clientes ?? [];
       },
       error: (error) => {
         console.error('Error cargando clientes:', error);
         this.toastService.error('Error al cargar los clientes');
       }
     });
   }

   cargarProductos(): void {
     this.productoService.listar().subscribe({
       next: (productos) => {
         this.productos = productos.filter(p => p.estado === true);
       },
       error: (error) => {
         console.error('Error cargando productos:', error);
         this.toastService.error('Error al cargar los productos');
       }
     });
   }

  abrirModalClientes(): void {
    this.mostrarModalClientes = true;
  }

  cerrarModalClientes(): void {
    this.mostrarModalClientes = false;
    this.filtroClientes = '';
    this.mostrarFormularioCliente = false;
    this.nuevoClienteForm.reset({
      tipoDocumento: 'DNI',
      direccion: '',
      razonSocial: '',
      esEmpresa: false,
      estado: true
    });
  }

  alternarFormularioCliente(): void {
    this.mostrarFormularioCliente = !this.mostrarFormularioCliente;

    if (this.mostrarFormularioCliente && this.filtroClientes.trim()) {
      const partesNombre = this.filtroClientes.trim().split(/\s+/);
      this.nuevoClienteForm.patchValue({
        nombre: partesNombre.shift() ?? '',
        apellidos: partesNombre.join(' ')
      });
    }
  }

  abrirModalProductos(): void {
    this.mostrarModalProductos = true;
  }

  cerrarModalProductos(): void {
    this.mostrarModalProductos = false;
    this.filtroProductos = '';
  }

   seleccionarCliente(cliente: ClienteDTO): void {
     this.clienteSeleccionado = cliente;
     this.ventaForm.patchValue({
       clienteId: cliente.idCliente ?? ''
     });
     this.ventaForm.get('clienteId')?.markAsTouched();
     this.cerrarModalClientes();
   }

   crearClienteDesdeVenta(): void {
     if (this.nuevoClienteForm.invalid) {
       this.nuevoClienteForm.markAllAsTouched();
       this.toastService.error('Complete los datos del nuevo cliente');
       return;
     }

     this.guardandoCliente = true;
     const cliente: ClienteDTO = this.nuevoClienteForm.value;

     this.clienteService.crear(cliente).subscribe({
       next: (clienteCreado) => {
         this.guardandoCliente = false;
         const clienteNormalizado = { ...cliente, ...clienteCreado, estado: clienteCreado.estado ?? true };
         this.clientes = [clienteNormalizado, ...this.clientes.filter(c => c.idCliente !== clienteNormalizado.idCliente)];
         this.toastService.success('Cliente creado y seleccionado');
         this.seleccionarCliente(clienteNormalizado);
       },
       error: (error) => {
         this.guardandoCliente = false;
         const mensaje = error.error?.message || error.error?.error || 'Error al crear el cliente';
         this.toastService.error(mensaje);
         console.error('Error creando cliente:', error);
       }
     });
   }

   seleccionarProducto(producto: Producto): void {
     this.productoSeleccionado = producto;
     this.ventaForm.patchValue({
       productoId: producto.idProducto ?? '',
       precioUnitario: producto.precioBase ?? producto.precio ?? 0
     });
     this.ventaForm.get('productoId')?.markAsTouched();
     this.calcularTotal();
     this.cerrarModalProductos();
   }

  calcularTotal(): void {
    const formValues = this.ventaForm.getRawValue();
    const cantidad = Number(formValues.cantidad) || 0;
    const precioUnitario = Number(formValues.precioUnitario) || 0;

    if (this.productoSeleccionado && cantidad > this.productoSeleccionado.stockActual) {
      this.cantidadError = `Stock insuficiente. Disponible: ${this.productoSeleccionado.stockActual}`;
      this.ventaForm.get('cantidad')?.setErrors({ stock: true });
    } else {
      this.cantidadError = '';

      const controlCantidad = this.ventaForm.get('cantidad');
      const erroresActuales = { ...(controlCantidad?.errors ?? {}) };

      if (erroresActuales['stock']) {
        delete erroresActuales['stock'];
        controlCantidad?.setErrors(Object.keys(erroresActuales).length ? erroresActuales : null);
      }
    }

    this.ventaForm.patchValue({
      total: cantidad * precioUnitario
    });
  }

   registrarVenta(): void {
     if (this.ventaForm.invalid) {
       this.ventaForm.markAllAsTouched();
       return;
     }

     this.loading = true;

     const valores = this.ventaForm.getRawValue();
     const venta: Venta = {
       cliente: { idCliente: this.ventaForm.value.clienteId },
       producto: { idProducto: this.ventaForm.value.productoId },
       cantidad: this.ventaForm.value.cantidad,
       precioUnitario: valores.precioUnitario,
       total: valores.total,
       tipoDocumento: this.ventaForm.value.tipoDocumento,
       estado: true
     };

     this.ventaService.crear(venta).subscribe({
       next: (respuesta) => {
         this.loading = false;
         this.limpiarFormulario();
         this.ventaRegistrada.emit();
       },
       error: (error) => {
         this.loading = false;
         const mensaje = error.error?.message || 'Error al registrar la venta';
         this.toastService.error(mensaje);
         console.error('Error:', error);
       }
     });
   }

   limpiarFormulario(): void {
     this.ventaForm.reset({
       clienteId: '',
       productoId: '',
       cantidad: 1,
       precioUnitario: 0,
       total: 0,
       tipoDocumento: 'Factura'
     });

     this.clienteSeleccionado = null;
     this.productoSeleccionado = null;
     this.cantidadError = '';
     this.filtroClientes = '';
     this.filtroProductos = '';
   }

  get clientesFiltrados(): ClienteDTO[] {
    const filtro = this.filtroClientes.trim().toLowerCase();

    if (!filtro) {
      return this.clientes;
    }

    return this.clientes.filter(cliente => {
      const nombreCompleto = `${cliente.nombre} ${cliente.apellidos}`.toLowerCase();
      return nombreCompleto.includes(filtro) ||
        cliente.numeroDocumento?.toLowerCase().includes(filtro) ||
        cliente.telefono?.toLowerCase().includes(filtro) ||
        cliente.email?.toLowerCase().includes(filtro);
    });
  }

  get productosFiltrados(): Producto[] {
    const filtro = this.filtroProductos.trim().toLowerCase();

    if (!filtro) {
      return this.productos;
    }

    return this.productos.filter(producto =>
      producto.nombre?.toLowerCase().includes(filtro) ||
      producto.codigo?.toLowerCase().includes(filtro) ||
      producto.descripcion?.toLowerCase().includes(filtro) ||
      producto.categoriaNombre?.toLowerCase().includes(filtro)
    );
  }

  obtenerNombreCliente(cliente: ClienteDTO): string {
    return `${cliente.nombre} ${cliente.apellidos}`.trim();
  }

  obtenerTipoCliente(cliente: ClienteDTO): string {
    return cliente.esEmpresa ? 'Empresa' : 'Persona';
  }

  formatearMoneda(valor: number | undefined): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(valor ?? 0);
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) {
      return 'Sin fecha';
    }

    return fechaObj.toLocaleDateString('es-PE');
  }

  get f() {
    return this.ventaForm.controls;
  }

  clienteNuevoInvalido(campo: string): boolean {
    const control = this.nuevoClienteForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }
}
