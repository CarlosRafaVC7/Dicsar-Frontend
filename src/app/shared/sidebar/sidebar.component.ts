import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;   // contendrá la clase de Font Awesome
  route: string;
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
    { label: 'Dashboard',   icon: 'fa-solid fa-grip', route: '/dashboard' },
    { label: 'Inventario',  icon: 'fa-solid fa-cube', route: '/inventario' },
    { label: 'Clientes',    icon: 'fa-solid fa-people-group', route: '/clientes' },
    { label: 'Proveedores', icon: 'fa-solid fa-truck-field', route: '/proveedores' },
    { label: 'Ventas',      icon: 'fa-solid fa-cart-shopping', route: '/ventas' },
  ];
}
