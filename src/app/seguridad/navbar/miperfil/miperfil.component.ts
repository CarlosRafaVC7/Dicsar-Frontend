import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AuthResponse } from '../../../models/auth.model';
import { ModalPasswordService } from '../../../services/modal-password.service';

@Component({
  selector: 'app-miperfil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './miperfil.component.html',
  styleUrls: ['./miperfil.component.css']
})
export class MiperfilComponent implements OnInit {
  user: AuthResponse | null = null;

  constructor(
    private authService: AuthService,
    private modalPasswordService: ModalPasswordService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
  }

  getInitials(nombreCompleto: string): string {
    const parts = nombreCompleto.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nombreCompleto.substring(0, 2).toUpperCase();
  }

  getRolLabel(rol: string): string {
    return rol === 'ADMIN' ? 'Administrador' : 'Vendedor';
  }

  getRolBadgeClass(rol: string): string {
    return rol === 'ADMIN' ? 'badge-admin' : 'badge-vendedor';
  }

  abrirCambiarContrasena(): void {
    this.modalPasswordService.open();
  }
}
