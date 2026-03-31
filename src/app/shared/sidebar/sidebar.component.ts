import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.model';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  submenu?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']  // ojo: debe ser "styleUrls" (plural)
})
export class SidebarComponent {
  items: NavItem[] = [
    { 
      label: 'Dashboard', 
      icon: 'fa-solid fa-chart-line', 
      route: '/dashboard' 
    },
    {
      label: 'Inventario',
      icon: 'fa-solid fa-boxes-stacked',
      expanded: true,
      submenu: [
        { label: 'Productos', icon: 'fa-solid fa-cube', route: '/inventario' },
        { label: 'Movimientos', icon: 'fa-solid fa-arrows-rotate', route: '/ventas' },
        { label: 'Historial de Precios', icon: 'fa-solid fa-chart-line', route: '/historial-precios' }
      ]
    },
    { 
      label: 'Proveedores', 
      icon: 'fa-solid fa-truck-field', 
      route: '/proveedores' 
    },
    { 
      label: 'Clientes', 
      icon: 'fa-solid fa-people-group', 
      route: '/clientes' 
    }
    ,
    {
      label: 'Usuarios',
      icon: 'fa-solid fa-user-group',
      route: '/usuarios'
    }
  ];

  currentUser: AuthResponse | null = null;

  constructor(private authService: AuthService) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSubmenu(item: NavItem): void {
    if (item.submenu) {
      item.expanded = !item.expanded;
    }
  }

  getRoleName(): string {
    return this.currentUser?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor';
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
