import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolService, Rol } from '../../services/rol.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  rolForm!: FormGroup;
  mostrarModal = false;
  editandoRol: Rol | null = null;
  loading = false;
  errorCargando = false;
  mensajeError = '';

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;

  // Búsqueda
  search = '';

  // Alertas
  alertaVisible = false;
  alertaMensaje = '';
  alertaTipo: 'exito' | 'error' | 'info' = 'info';

  constructor(
    private rolService: RolService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarRoles();
  }

  initForm(): void {
    this.rolForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', Validators.required],
      activo: [true]
    });
  }

  cargarRoles(): void {
    this.loading = true;
    this.errorCargando = false;
    this.mensajeError = '';

    this.rolService.listar().subscribe({
      next: (data: Rol[]) => {
        console.log('Roles cargados:', data);
        this.roles = data;
        this.actualizarPaginacion();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar roles:', err);
        this.errorCargando = true;
        this.mensajeError = err.error?.message || err.message || 'Error al cargar roles del servidor';
        this.mostrarAlerta(this.mensajeError, 'error');
        this.loading = false;
      }
    });
  }

  abrirModal(): void {
    this.editandoRol = null;
    this.rolForm.reset({ activo: true });
    this.mostrarModal = true;
  }

  editarRol(rol: Rol): void {
    this.editandoRol = rol;
    this.rolForm.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      activo: rol.activo
    });
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.editandoRol = null;
    this.rolForm.reset();
  }

  guardarRol(): void {
    if (this.rolForm.invalid) {
      this.mostrarAlerta('Por favor completa los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    const rol: Rol = this.rolForm.value;

    if (this.editandoRol?.idRol) {
      // Actualizar
      this.rolService.actualizar(this.editandoRol.idRol, rol).subscribe({
        next: () => {
          this.mostrarAlerta('Rol actualizado correctamente', 'exito');
          this.cargarRoles();
          this.cerrarModal();
        },
        error: (err: any) => {
          console.error('Error al actualizar rol:', err);
          this.mostrarAlerta(err.error?.message || 'Error al actualizar rol', 'error');
          this.loading = false;
        }
      });
    } else {
      // Crear
      this.rolService.crear(rol).subscribe({
        next: () => {
          this.mostrarAlerta('Rol creado correctamente', 'exito');
          this.cargarRoles();
          this.cerrarModal();
        },
        error: (err: any) => {
          console.error('Error al crear rol:', err);
          this.mostrarAlerta(err.error?.message || 'Error al crear rol', 'error');
          this.loading = false;
        }
      });
    }
  }

  eliminarRol(id: number, nombre: string): void {
    if (confirm(`¿Estás seguro de eliminar el rol "${nombre}"?`)) {
      this.loading = true;
      this.rolService.eliminar(id).subscribe({
        next: () => {
          this.mostrarAlerta('Rol eliminado correctamente', 'exito');
          this.cargarRoles();
        },
        error: (err: any) => {
          console.error('Error al eliminar rol:', err);
          this.mostrarAlerta(err.error?.message || 'Error al eliminar rol', 'error');
          this.loading = false;
        }
      });
    }
  }

  // Paginación
  actualizarPaginacion(): void {
    const filtered = this.rolesFiltrados;
    this.totalPaginas = Math.ceil(filtered.length / this.itemsPorPagina) || 1;
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  get rolesFiltrados(): Rol[] {
    const q = this.search.toLowerCase().trim();
    return this.roles.filter(r =>
      !q ||
      r.nombre.toLowerCase().includes(q) ||
      (r.descripcion?.toLowerCase() || '').includes(q)
    );
  }

  get rolesVisibles(): Rol[] {
    const filtered = this.rolesFiltrados;
    this.totalPaginas = Math.ceil(filtered.length / this.itemsPorPagina) || 1;
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtered.slice(inicio, fin);
  }

  get paginasDisponibles(): number[] {
    const paginas = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info'): void {
    this.alertaVisible = true;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    setTimeout(() => (this.alertaVisible = false), 3500);
  }
}
