import { Component, HostListener, Output, EventEmitter } from '@angular/core';
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
  badge?: number | string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  // Estado del sidebar: expandido o colapsado
  sidebarExpanded = true;

  // Evento para notificar al componente padre sobre el cambio de estado
  @Output() sidebarToggle = new EventEmitter<boolean>();

  // Breakpoint para responsive (1024px)
  private readonly MOBILE_BREAKPOINT = 1024;
  isMobile = false;

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
        { label: 'Movimientos', icon: 'fa-solid fa-arrows-rotate', route: '/movimientos' },
        { label: 'Historial de Precios', icon: 'fa-solid fa-chart-line', route: '/historial-precios' }
      ]
    },
    {
      label: 'Proveedores',
      icon: 'fa-solid fa-truck-field',
      route: '/proveedores'
    },
    {
      label: 'Ventas',
      icon: 'fa-solid fa-cash-register',
      route: '/ventas'
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

    // Verificar si estamos en mobile al iniciar
    this.checkMobile();
  }

  // Listener para resize de ventana
  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < this.MOBILE_BREAKPOINT;

    // En móvil, el sidebar empieza cerrado
    if (this.isMobile && this.sidebarExpanded) {
      this.sidebarExpanded = false;
    }
    // En desktop, el sidebar empieza abierto
    if (!this.isMobile && !this.sidebarExpanded) {
      this.sidebarExpanded = true;
    }
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
    this.sidebarToggle.emit(this.sidebarExpanded);

    // Cuando el sidebar está contraído, mantener el submenú de Inventario visible
    if (!this.sidebarExpanded) {
      const inventarioItem = this.items.find(item => item.label === 'Inventario');
      if (inventarioItem) {
        inventarioItem.expanded = true;
      }
    }
  }

  toggleSubmenu(item: NavItem): void {
    if (item.submenu) {
      item.expanded = !item.expanded;
    }
  }

  // Getter para verificar si el sidebar está contraído
  get isCollapsed(): boolean {
    return !this.sidebarExpanded;
  }

  getRoleName(): string {
    return this.currentUser?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor';
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}




