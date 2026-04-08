import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Notificacion, NotificacionService } from '../../services/notificacion.service';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.model';
import { UsuarioService } from '../../services/usuario.service';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, ReactiveFormsModule, ThemeToggleComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isDropdownOpen = false;
  isNotificationsOpen = false;
  notificaciones: Notificacion[] = [];
  filtroProducto: number | null = null;
  productosConNotificaciones: any[] = [];
  currentUser: AuthResponse | null = null;
  mostrarModalPassword = false;
  passwordForm: FormGroup;

  constructor(
    private notiService: NotificacionService,
    private authService: AuthService,
    private router: Router,
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.passwordForm = this.fb.group({
      passwordActual: ['', [Validators.required, Validators.minLength(6)]],
      passwordNueva: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.cargarNotificaciones();
    }
  }

  cargarNotificaciones(): void {
    if (this.filtroProducto) {
      this.notiService.listarPorProducto(this.filtroProducto).subscribe({
        next: data => this.notificaciones = data,
        error: err => console.error('Error cargando notificaciones por producto', err)
      });
    } else {
      this.notiService.listar().subscribe({
        next: data => {
          this.notificaciones = data;
          this.extraerProductosConNotificaciones();
        },
        error: err => console.error('Error cargando notificaciones', err)
      });
    }
  }

  extraerProductosConNotificaciones(): void {
    const productos = new Map();
    this.notificaciones.forEach(noti => {
      if (!productos.has(noti.producto.idProducto)) {
        productos.set(noti.producto.idProducto, noti.producto);
      }
    });
    this.productosConNotificaciones = Array.from(productos.values());
  }

  filtrarPorProducto(idProducto: number | null): void {
    this.filtroProducto = idProducto;
    this.cargarNotificaciones();
  }

  eliminarNotificacion(id: number): void {
    this.notiService.eliminar(id).subscribe({
      next: () => {
        this.notificaciones = this.notificaciones.filter(n => n.id !== id);
        this.extraerProductosConNotificaciones();
      },
      error: err => console.error('Error eliminando notificación', err)
    });
  }

  getTipoClass(tipo: string): string {
    switch (tipo) {
      case 'ADVERTENCIA': return 'tipo-ADVERTENCIA';
      case 'CRITICA': return 'tipo-CRITICA';
      case 'INFORMACION': return 'tipo-INFORMACION';
      case 'PRECIO': return 'tipo-PRECIO';
      case 'ALERTA_PRECIO': return 'tipo-ALERTA_PRECIO';
      case 'ALERTA_VENCIMIENTO': return 'tipo-ALERTA_VENCIMIENTO';
      case 'STOCK_BAJO': return 'tipo-STOCK_BAJO';
      default: return 'tipo-INFORMACION';
    }
  }

  getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'ADVERTENCIA': return 'fa-triangle-exclamation';
      case 'CRITICA': return 'fa-circle-exclamation';
      case 'INFORMACION': return 'fa-circle-info';
      case 'PRECIO': return 'fa-dollar-sign';
      case 'ALERTA_PRECIO': return 'fa-dollar-sign';
      case 'ALERTA_VENCIMIENTO': return 'fa-calendar-exclamation';
      case 'STOCK_BAJO': return 'fa-box-exclamation';
      default: return 'fa-bell';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleName(): string {
    const rol = this.currentUser?.rol;
    const nombre = this.currentUser?.nombreCompleto?.toLowerCase() || '';
    // Si el rol es ADMIN o si el nombre contiene "admin" (por inconsistencias del backend)
    if (rol === 'ADMIN' || nombre.includes('admin')) {
      return 'Administrador';
    }
    return rol === 'VENDEDOR' ? 'Vendedor' : 'Usuario';
  }

  isAdminUser(): boolean {
    const rol = this.currentUser?.rol;
    const nombre = this.currentUser?.nombreCompleto?.toLowerCase() || '';
    return rol === 'ADMIN' || nombre.includes('admin');
  }

  abrirModalPassword(): void {
    this.mostrarModalPassword = true;
    this.isDropdownOpen = false;
  }

  cerrarModalPassword(): void {
    this.mostrarModalPassword = false;
    this.passwordForm.reset();
  }

  cambiarPassword(): void {
    if (this.passwordForm.invalid) return;

    const { passwordActual, passwordNueva, passwordConfirmar } = this.passwordForm.value;

    if (passwordNueva !== passwordConfirmar) {
      this.toastService.error('Las contraseñas no coinciden');
      return;
    }

    this.usuarioService.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.toastService.success('Contraseña cambiada exitosamente');
        this.cerrarModalPassword();
      },
      error: (err: any) => {
        console.error('Error al cambiar contraseña:', err);
        this.toastService.error('Error al cambiar contraseña. Verifica tu contraseña actual.');
      }
    });
  }
}
