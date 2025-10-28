import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  ];

  toggleSubmenu(item: NavItem): void {
    if (item.submenu) {
      item.expanded = !item.expanded;
    }
  }
}
