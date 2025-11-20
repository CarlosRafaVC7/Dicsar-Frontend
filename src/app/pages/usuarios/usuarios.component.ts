import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario-admin.service';
import { RolService } from '../../services/rol.service';
import { UsuarioDTO, CambiarPasswordRequest } from '../../models/usuario.model';
import { RolDTO } from '../../models/rol.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  // TABS
  activeTab: 'usuarios' | 'roles' = 'usuarios';

  // USUARIOS
  usuarios: UsuarioDTO[] = [];
  usuarioForm!: FormGroup;
  mostrarModalUsuario = false;
  mostrarModalPassword = false;
  editandoUsuario: UsuarioDTO | null = null;

  // ROLES
  roles: RolDTO[] = [];
  rolForm!: FormGroup;
  mostrarModalRol = false;
  editandoRol: RolDTO | null = null;

  // ESTADOS GLOBALES
  loading = false;
  errorCargando = false;
  mensajeError = '';

  // Paginación
  paginaActual = 1;
  paginaRolesActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;
  totalPaginasRoles = 1;

  // Búsqueda
  search = '';
  searchRoles = '';

  // Cambio de contraseña
  passwordForm!: FormGroup;
  currentUser: any;

  // Alertas
  alertaVisible = false;
  alertaMensaje = '';
  alertaTipo: 'exito' | 'error' | 'info' = 'info';

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRoles();
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  initForms(): void {
    this.usuarioForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]],
      nombreCompleto: ['', Validators.required],
      rol: ['VENDEDOR', Validators.required],
      activo: [true]
    });

    this.rolForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      activo: [true]
    });

    this.passwordForm = this.fb.group({
      passwordActual: ['', Validators.required],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: ['', Validators.required]
    });
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.errorCargando = false;
    this.mensajeError = '';

    this.usuarioService.listar().subscribe({
      next: (data: UsuarioDTO[]) => {
        console.log('Usuarios cargados:', data);
        this.usuarios = data;
        this.actualizarPaginacion();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar usuarios:', err);
        this.errorCargando = true;
        this.mensajeError = err.error?.message || err.message || 'Error al cargar usuarios del servidor';
        this.mostrarAlerta(this.mensajeError, 'error');
        this.loading = false;
      }
    });
  }

  cargarRoles(): void {
    this.loading = true;
    this.rolService.listar().subscribe({
      next: (data: RolDTO[]) => {
        console.log('Roles cargados:', data);
        this.roles = data;
        this.actualizarPaginacionRoles();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar roles:', err);
        this.mensajeError = err.error?.message || err.message || 'Error al cargar roles del servidor';
        this.mostrarAlerta(this.mensajeError, 'error');
        this.loading = false;
      }
    });
  }

  cambiarTab(tab: 'usuarios' | 'roles'): void {
    this.activeTab = tab;
    if (tab === 'roles') {
      this.cargarRoles();
    }
  }

  // ========== MÉTODOS PARA ROLES ==========

  abrirModalRol(): void {
    this.editandoRol = null;
    this.rolForm.reset({ activo: true });
    this.mostrarModalRol = true;
  }

  editarRol(rol: RolDTO): void {
    this.editandoRol = rol;
    this.rolForm.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      activo: rol.activo
    });
    this.mostrarModalRol = true;
  }

  cerrarModalRol(): void {
    this.mostrarModalRol = false;
    this.editandoRol = null;
    this.rolForm.reset();
  }

  guardarRol(): void {
    if (this.rolForm.invalid) {
      this.mostrarAlerta('Por favor completa los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    const rol: RolDTO = this.rolForm.value;

    if (this.editandoRol?.idRol) {
      // Editar
      this.rolService.actualizar(this.editandoRol.idRol, rol).subscribe({
        next: () => {
          this.mostrarAlerta('Rol actualizado correctamente', 'exito');
          this.cargarRoles();
          this.cerrarModalRol();
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
          this.cerrarModalRol();
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
    if (confirm(`¿Estás seguro de eliminar el rol ${nombre}?`)) {
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

  // ========== MÉTODOS PARA USUARIOS ==========

  abrirModalUsuario(): void {
    this.editandoUsuario = null;
    this.usuarioForm.reset({ rol: 'VENDEDOR', activo: true });
    this.mostrarModalUsuario = true;
  }

  editarUsuario(usuario: UsuarioDTO): void {
    this.editandoUsuario = usuario;
    this.usuarioForm.patchValue({
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      activo: usuario.activo
    });
    // Password opcional en edición
    const passwordControl = this.usuarioForm.get('password');
    if (passwordControl) {
      passwordControl.clearValidators();
      passwordControl.updateValueAndValidity();
    }
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario = false;
    this.editandoUsuario = null;
    this.usuarioForm.reset();
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.mostrarAlerta('Por favor completa los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    const usuario: UsuarioDTO = this.usuarioForm.value;

    if (this.editandoUsuario?.idUsuario) {
      // Editar - no incluir password si está vacío
      const usuarioActualizado = { ...usuario };
      if (!usuarioActualizado.password) {
        delete usuarioActualizado.password;
      }
      this.usuarioService.actualizar(this.editandoUsuario.idUsuario, usuarioActualizado).subscribe({
        next: () => {
          this.mostrarAlerta('Usuario actualizado correctamente', 'exito');
          this.cargarUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err: any) => {
          console.error('Error al actualizar usuario:', err);
          this.mostrarAlerta(err.error?.message || 'Error al actualizar usuario', 'error');
          this.loading = false;
        }
      });
    } else {
      // Crear - password es requerido
      if (!usuario.password) {
        this.mostrarAlerta('La contraseña es requerida para nuevos usuarios', 'error');
        this.loading = false;
        return;
      }
      this.usuarioService.crear(usuario).subscribe({
        next: () => {
          this.mostrarAlerta('Usuario creado correctamente', 'exito');
          this.cargarUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err: any) => {
          console.error('Error al crear usuario:', err);
          this.mostrarAlerta(err.error?.message || 'Error al crear usuario', 'error');
          this.loading = false;
        }
      });
    }
  }

  eliminarUsuario(id: number, nombre: string): void {
    if (confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
      this.loading = true;
      this.usuarioService.eliminar(id).subscribe({
        next: () => {
          this.mostrarAlerta('Usuario eliminado correctamente', 'exito');
          this.cargarUsuarios();
        },
        error: (err: any) => {
          console.error('Error al eliminar usuario:', err);
          this.mostrarAlerta(err.error?.message || 'Error al eliminar usuario', 'error');
          this.loading = false;
        }
      });
    }
  }

  desactivarUsuario(id: number, nombre: string): void {
    this.loading = true;
    this.usuarioService.desactivar(id).subscribe({
      next: () => {
        this.mostrarAlerta(`${nombre} ha sido desactivado`, 'exito');
        this.cargarUsuarios();
      },
      error: (err: any) => {
        console.error('Error al desactivar usuario:', err);
        this.mostrarAlerta(err.error?.message || 'Error al desactivar usuario', 'error');
        this.loading = false;
      }
    });
  }

  activarUsuario(id: number, nombre: string): void {
    this.loading = true;
    this.usuarioService.activar(id).subscribe({
      next: () => {
        this.mostrarAlerta(`${nombre} ha sido activado`, 'exito');
        this.cargarUsuarios();
      },
      error: (err: any) => {
        console.error('Error al activar usuario:', err);
        this.mostrarAlerta(err.error?.message || 'Error al activar usuario', 'error');
        this.loading = false;
      }
    });
  }

  // Cambio de contraseña
  abrirModalPassword(): void {
    this.passwordForm.reset();
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword(): void {
    this.mostrarModalPassword = false;
    this.passwordForm.reset();
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) {
      this.mostrarAlerta('Por favor completa todos los campos', 'error');
      return;
    }

    const { passwordActual, passwordNueva, passwordConfirmar } = this.passwordForm.value;

    if (passwordNueva !== passwordConfirmar) {
      this.mostrarAlerta('Las contraseñas no coinciden', 'error');
      return;
    }

    this.loading = true;
    this.usuarioService.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.mostrarAlerta('Contraseña cambiada correctamente', 'exito');
        this.cerrarModalPassword();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al cambiar contraseña:', err);
        this.mostrarAlerta(err.error?.message || 'Error al cambiar contraseña. Verifica tu contraseña actual.', 'error');
        this.loading = false;
      }
    });
  }

  // Paginación
  actualizarPaginacion(): void {
    const filtered = this.usuariosFiltrados;
    this.totalPaginas = Math.ceil(filtered.length / this.itemsPorPagina) || 1;
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }
  }

  actualizarPaginacionRoles(): void {
    const filtered = this.rolesFiltrados;
    this.totalPaginasRoles = Math.ceil(filtered.length / this.itemsPorPagina) || 1;
    if (this.paginaRolesActual > this.totalPaginasRoles) {
      this.paginaRolesActual = 1;
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  cambiarPaginaRoles(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginasRoles) {
      this.paginaRolesActual = pagina;
    }
  }

  get usuariosFiltrados(): UsuarioDTO[] {
    const q = this.search.toLowerCase().trim();
    return this.usuarios.filter(u =>
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.nombreCompleto.toLowerCase().includes(q)
    );
  }

  get usuariosVisibles(): UsuarioDTO[] {
    const filtered = this.usuariosFiltrados;
    this.totalPaginas = Math.ceil(filtered.length / this.itemsPorPagina) || 1;
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtered.slice(inicio, fin);
  }

  get rolesFiltrados(): RolDTO[] {
    const q = this.searchRoles.toLowerCase().trim();
    return this.roles.filter(r =>
      !q ||
      r.nombre.toLowerCase().includes(q) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(q))
    );
  }

  get rolesVisibles(): RolDTO[] {
    const filtered = this.rolesFiltrados;
    this.totalPaginasRoles = Math.ceil(filtered.length / this.itemsPorPagina) || 1;
    const inicio = (this.paginaRolesActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtered.slice(inicio, fin);
  }

  mostrarAlerta(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'info'): void {
    this.alertaVisible = true;
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    setTimeout(() => (this.alertaVisible = false), 3500);
  }
}
