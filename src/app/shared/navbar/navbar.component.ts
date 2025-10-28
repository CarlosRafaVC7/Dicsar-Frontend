import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Notificacion, NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isDropdownOpen = false;
  isNotificationsOpen = false;
  notificaciones: Notificacion[] = [];
  filtroProducto: number | null = null;
  productosConNotificaciones: any[] = [];

  constructor(private notiService: NotificacionService) {}

  ngOnInit(): void {}

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
    switch(tipo) {
      case 'ADVERTENCIA': return 'tipo-ADVERTENCIA';
      case 'CRITICA': return 'tipo-CRITICA';
      case 'INFORMACION': return 'tipo-INFORMACION';
      default: return '';
    }
  }

  getTipoIcon(tipo: string): string {
    switch(tipo) {
      case 'ADVERTENCIA': return 'fa-triangle-exclamation';
      case 'CRITICA': return 'fa-circle-exclamation';
      case 'INFORMACION': return 'fa-circle-info';
      default: return 'fa-bell';
    }
  }
}
