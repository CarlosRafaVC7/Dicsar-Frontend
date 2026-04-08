import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VentaService } from '../../services/venta.service';
import { ClienteService } from '../../services/cliente.service';
import { ProductoService } from '../../services/producto.service';
import { ClienteDTO } from '../../models/cliente.model';
import { Producto } from '../../models/producto.model';
import { Venta } from '../../models/venta.model';

@Component({
  selector: 'app-registro-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="registro-ventas-container">
      <div class="header">
        <h2>📊 Registrar Nueva Venta</h2>
        <p class="subtitle">Complete el formulario para registrar una venta</p>
      </div>

      <form [formGroup]="ventaForm" (ngSubmit)="registrarVenta()" class="venta-form">
        <div class="form-row">
          <!-- Cliente -->
          <div class="form-group">
            <label for="cliente">Cliente *</label>
            <select id="cliente" formControlName="clienteId" class="form-control">
              <option value="">Seleccionar cliente...</option>
              <option *ngFor="let cliente of clientes" [value]="cliente.idCliente">
                {{ cliente.nombre }} {{ cliente.apellidos }}
              </option>
            </select>
            <div class="error" *ngIf="f['clienteId'].touched && f['clienteId'].errors">
              El cliente es requerido
            </div>
          </div>

          <!-- Producto -->
          <div class="form-group">
            <label for="producto">Producto *</label>
            <select id="producto" formControlName="productoId" class="form-control" 
              (change)="onProductoChange()">
              <option value="">Seleccionar producto...</option>
              <option *ngFor="let producto of productos" [value]="producto.idProducto">
                {{ producto.nombre }} (Stock: {{ producto.stockActual }})
              </option>
            </select>
            <div class="error" *ngIf="f['productoId'].touched && f['productoId'].errors">
              El producto es requerido
            </div>
          </div>
        </div>

        <div class="form-row">
          <!-- Cantidad -->
          <div class="form-group">
            <label for="cantidad">Cantidad *</label>
            <input type="number" id="cantidad" formControlName="cantidad" 
              class="form-control" min="1" (change)="calcularTotal()">
            <small class="help-text" *ngIf="productoSeleccionado">
              Stock disponible: {{ productoSeleccionado.stockActual }}
            </small>
            <div class="error" *ngIf="f['cantidad'].touched && f['cantidad'].errors">
              <span *ngIf="f['cantidad'].errors['required']">La cantidad es requerida</span>
              <span *ngIf="f['cantidad'].errors['min']">Mínimo 1 unidad</span>
              <span *ngIf="cantidadError">{{ cantidadError }}</span>
            </div>
          </div>

          <!-- Precio Unitario -->
          <div class="form-group">
            <label for="precioUnitario">Precio Unitario *</label>
            <input type="number" id="precioUnitario" formControlName="precioUnitario" 
              class="form-control" readonly>
            <small class="help-text">Se completa automáticamente</small>
          </div>
        </div>

        <div class="form-row">
          <!-- Tipo Documento -->
          <div class="form-group">
            <label for="tipoDocumento">Tipo de Documento *</label>
            <select id="tipoDocumento" formControlName="tipoDocumento" class="form-control">
              <option value="Factura">Factura</option>
              <option value="Boleta">Boleta</option>
            </select>
          </div>

          <!-- Total -->
          <div class="form-group">
            <label for="total">Total</label>
            <input type="number" id="total" formControlName="total" 
              class="form-control" readonly>
            <small class="help-text">Se calcula automáticamente</small>
          </div>
        </div>

        <!-- Alertas -->
        <div class="alert alert-success" *ngIf="successMessage">
          ✅ {{ successMessage }}
        </div>
        <div class="alert alert-danger" *ngIf="errorMessage">
          ❌ {{ errorMessage }}
        </div>

        <!-- Botones -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="ventaForm.invalid || loading">
            <span *ngIf="!loading">💾 Registrar Venta</span>
            <span *ngIf="loading">Procesando...</span>
          </button>
          <button type="button" class="btn btn-secondary" (click)="limpiarFormulario()">
            🔄 Limpiar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .registro-ventas-container {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 24px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 16px;
    }

    .header h2 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .venta-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }

    .form-control:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .error {
      color: #dc3545;
      font-size: 12px;
    }

    .help-text {
      color: #666;
      font-size: 12px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 14px;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-danger {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-primary:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }
  `]
})
export class RegistroVentasComponent implements OnInit {
  @Output() ventaRegistrada = new EventEmitter<void>();

  ventaForm!: FormGroup;
  clientes: ClienteDTO[] = [];
  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;

  loading = false;
  errorMessage = '';
  successMessage = '';
  cantidadError = '';

  constructor(
    private fb: FormBuilder,
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private productoService: ProductoService
  ) { }

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
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (response: any) => {
        // Si es PaginatedResponse, extraer el contenido
        this.clientes = Array.isArray(response) ? response : (response.content || []);
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
        this.errorMessage = 'Error al cargar los clientes';
      }
    });
  }

  cargarProductos(): void {
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos = productos;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.errorMessage = 'Error al cargar los productos';
      }
    });
  }

  onProductoChange(): void {
    const productoId = this.ventaForm.value.productoId;
    this.productoSeleccionado = this.productos.find(p => p.idProducto === productoId) || null;

    if (this.productoSeleccionado) {
      this.ventaForm.patchValue({
        precioUnitario: this.productoSeleccionado.precio
      });
      this.calcularTotal();
      this.cantidadError = '';
    }
  }

  calcularTotal(): void {
    const cantidad = this.ventaForm.value.cantidad;
    const precioUnitario = this.ventaForm.value.precioUnitario;

    if (this.productoSeleccionado && cantidad > this.productoSeleccionado.stockActual) {
      this.cantidadError = `Stock insuficiente. Disponible: ${this.productoSeleccionado.stockActual}`;
      this.ventaForm.get('cantidad')?.setErrors({ 'stock': true });
    } else {
      this.cantidadError = '';
      this.ventaForm.get('cantidad')?.setErrors(null);
    }

    const total = cantidad * precioUnitario;
    this.ventaForm.patchValue({
      total: total
    });
  }

  registrarVenta(): void {
    if (this.ventaForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const venta: Venta = {
      cliente: { idCliente: this.ventaForm.value.clienteId },
      producto: { idProducto: this.ventaForm.value.productoId },
      cantidad: this.ventaForm.value.cantidad,
      precioUnitario: this.ventaForm.value.precioUnitario,
      total: this.ventaForm.value.total,
      tipoDocumento: this.ventaForm.value.tipoDocumento,
      estado: true
    };

    this.ventaService.crear(venta).subscribe({
      next: (respuesta) => {
        this.loading = false;
        this.successMessage = `✅ Venta registrada exitosamente (ID: ${respuesta.idVenta})`;
        this.limpiarFormulario();
        this.ventaRegistrada.emit(); // Notificar al padre para actualizar dashboard
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.loading = false;
        const mensaje = error.error?.message || 'Error al registrar la venta';
        this.errorMessage = `❌ ${mensaje}`;
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
    this.productoSeleccionado = null;
    this.cantidadError = '';
  }

  get f() {
    return this.ventaForm.controls;
  }
}
