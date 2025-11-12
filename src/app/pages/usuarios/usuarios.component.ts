import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';

interface Usuario {
  idUsuario?: number;
  username: string;
  password?: string;
  nombreCompleto: string;
  rol: 'ADMIN' | 'VENDEDOR';
  activo: boolean;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuarioForm!: FormGroup;
  mostrarModalUsuario = false;
  mostrarModalPassword = false;
  editandoUsuario: Usuario | null = null;
  
  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;
  
  // Búsqueda
  search = '';
  
  // Cambio de contraseña
  passwordForm!: FormGroup;
  currentUser: any;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  initForms(): void {
    this.usuarioForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombreCompleto: ['', Validators.required],
      rol: ['VENDEDOR', Validators.required],
      activo: [true]
    });

    this.passwordForm = this.fb.group({
      passwordActual: ['', Validators.required],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: ['', Validators.required]
    });
  }

  cargarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (data: Usuario[]) => {
        this.usuarios = data;
        this.actualizarPaginacion();
      },
      error: (err: any) => console.error('Error al cargar usuarios:', err)
    });
  }

  abrirModalUsuario(): void {
    this.editandoUsuario = null;
    this.usuarioForm.reset({ rol: 'VENDEDOR', activo: true });
    this.mostrarModalUsuario = true;
  }

  editarUsuario(usuario: Usuario): void {
    this.editandoUsuario = usuario;
    this.usuarioForm.patchValue({
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      activo: usuario.activo
    });
    // No incluir password en edición
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario = false;
    this.editandoUsuario = null;
    this.usuarioForm.reset();
    // Restaurar validador de password
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) return;

    const usuario = this.usuarioForm.value;

    if (this.editandoUsuario?.idUsuario) {
      // Editar
      this.usuarioService.actualizar(this.editandoUsuario.idUsuario, usuario).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err: any) => console.error('Error al actualizar usuario:', err)
      });
    } else {
      // Crear
      this.usuarioService.crear(usuario).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err: any) => console.error('Error al crear usuario:', err)
      });
    }
  }

  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.usuarioService.eliminar(id).subscribe({
        next: () => this.cargarUsuarios(),
        error: (err: any) => console.error('Error al eliminar usuario:', err)
      });
    }
  }

  toggleEstadoUsuario(usuario: Usuario): void {
    if (!usuario.idUsuario) return;
    
    const nuevoEstado = !usuario.activo;
    this.usuarioService.actualizar(usuario.idUsuario, { ...usuario, activo: nuevoEstado }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err: any) => console.error('Error al cambiar estado:', err)
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
    if (this.passwordForm.invalid) return;

    const { passwordActual, passwordNueva, passwordConfirmar } = this.passwordForm.value;

    if (passwordNueva !== passwordConfirmar) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.usuarioService.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        alert('Contraseña cambiada exitosamente');
        this.cerrarModalPassword();
      },
      error: (err: any) => {
        console.error('Error al cambiar contraseña:', err);
        alert('Error al cambiar contraseña. Verifica tu contraseña actual.');
      }
    });
  }

  // Paginación
  actualizarPaginacion(): void {
    const filtered = this.usuariosFiltrados;
    this.totalPaginas = Math.ceil(filtered.length / this.itemsPorPagina);
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  get usuariosFiltrados(): Usuario[] {
    const q = this.search.toLowerCase().trim();
    return this.usuarios.filter(u =>
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.nombreCompleto.toLowerCase().includes(q)
    );
  }

  get usuariosVisibles(): Usuario[] {
    const filtered = this.usuariosFiltrados;
    this.totalPaginas = Math.ceil(filtered.length / this.itemsPorPagina);
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return filtered.slice(inicio, fin);
  }
}
