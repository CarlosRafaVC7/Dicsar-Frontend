import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Proveedor } from '../../models/proveedor.model';
import { ProveedorService } from '../../services/proveedor.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  proveedorForm: Proveedor = this.limpiarFormulario();
  editando = false;
  mensaje = '';

  constructor(private proveedorService: ProveedorService) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  limpiarFormulario(): Proveedor {
    return {
      razonSocial: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: '',
      contacto: ''
    };
  }

  cargarProveedores(): void {
    this.proveedorService.listar().subscribe({
      next: (data) => (this.proveedores = data),
      error: (err) => console.error('Error al listar proveedores:', err)
    });
  }

  guardarProveedor(): void {
    if (this.editando && this.proveedorForm.idProveedor) {
      this.proveedorService.actualizar(this.proveedorForm.idProveedor, this.proveedorForm).subscribe({
        next: () => {
          this.mensaje = 'Proveedor actualizado correctamente';
          this.cancelarEdicion();
          this.cargarProveedores();
        },
        error: () => (this.mensaje = 'Error al actualizar proveedor')
      });
    } else {
      this.proveedorService.crear(this.proveedorForm).subscribe({
        next: () => {
          this.mensaje = 'Proveedor creado correctamente';
          this.proveedorForm = this.limpiarFormulario();
          this.cargarProveedores();
        },
        error: () => (this.mensaje = 'Error al crear proveedor')
      });
    }
  }

  editarProveedor(prov: Proveedor): void {
    this.proveedorForm = { ...prov };
    this.editando = true;
    this.mensaje = '';
  }

  eliminarProveedor(id?: number): void {
    if (!id) return;
    if (confirm('¿Seguro que deseas eliminar este proveedor?')) {
      this.proveedorService.eliminar(id).subscribe({
        next: () => {
          this.mensaje = 'Proveedor eliminado correctamente';
          this.cargarProveedores();
        },
        error: () => (this.mensaje = 'Error al eliminar proveedor')
      });
    }
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.proveedorForm = this.limpiarFormulario();
  }
}
