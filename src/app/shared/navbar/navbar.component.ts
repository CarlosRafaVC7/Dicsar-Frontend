import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Notificacion, NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isDropdownOpen = false;
  isNotificationsOpen = false;
  notificaciones: Notificacion[] = [];

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
    this.notiService.listar().subscribe({
      next: data => this.notificaciones = data,
      error: err => console.error('Error cargando notificaciones', err)
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
