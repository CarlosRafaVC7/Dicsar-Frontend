import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { VentasComponent } from './pages/ventas/ventas.component';
import { MiperfilComponent } from './seguridad/navbar/miperfil/miperfil.component';
import { CambiarcontrasenaComponent } from './seguridad/navbar/cambiarcontrasena/cambiarcontrasena.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'inventario', component: InventarioComponent },
  { path: 'clientes', component: ClientesComponent },
  { path: 'proveedores', component: ProveedoresComponent },
  { path: 'ventas', component: VentasComponent },
  { path: '**', redirectTo: '/dashboard' },
{ path: 'mi-perfil', component: MiperfilComponent },
{ path: 'cambiar-contrasena', component: CambiarcontrasenaComponent }
];
