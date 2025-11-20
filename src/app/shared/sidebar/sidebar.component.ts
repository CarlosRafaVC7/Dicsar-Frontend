import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  submenu?: NavItem[];
  expanded?: boolean;
  roles?: string[];  // Para mostrar solo a ciertos roles
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']  // ojo: debe ser "styleUrls" (plural)
})
export class SidebarComponent implements OnInit, OnDestroy {
  items: NavItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
    this.items = this.buildMenu();
    // Suscribirse a cambios en el usuario para actualizar el menú inmediatamente
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        console.log('Current user changed, rebuilding menu. User role:', user?.rol);
        this.items = this.buildMenu();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildMenu(): NavItem[] {
    const currentUser = this.authService.currentUserValue;
    // Verificar si es admin por rol O por nombre (si el backend tiene inconsistencia)
    const isAdmin = currentUser?.rol === 'ADMIN' ||
      (currentUser?.nombreCompleto?.toLowerCase().includes('admin') ?? false);
    const baseItems: NavItem[] = [
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
        label: 'Clientes',
        icon: 'fa-solid fa-people-group',
        expanded: false,
        submenu: [
          { label: 'Gestión de Clientes', icon: 'fa-solid fa-user-tie', route: '/clientes' }
        ]
      },
      // ✅ Sección Administración (solo para ADMIN)
      ...(isAdmin ? [
        {
          label: 'Administración',
          icon: 'fa-solid fa-tools',
          expanded: false,
          submenu: [
            {
              label: 'Gestión de Usuarios',
              icon: 'fa-solid fa-users',
              route: '/usuarios'
            }
          ]
        }
      ] : [])
    ];

    return baseItems;
  }

  toggleSubmenu(item: NavItem): void {
    if (item.submenu) {
      item.expanded = !item.expanded;
    }
  }
}




