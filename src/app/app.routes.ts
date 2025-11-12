import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { ProductosProveedorComponent } from './pages/proveedores/productos-proveedor.component';
import { VentasComponent } from './pages/ventas/ventas.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { MiperfilComponent } from './seguridad/navbar/miperfil/miperfil.component';
import { CambiarcontrasenaComponent } from './seguridad/navbar/cambiarcontrasena/cambiarcontrasena.component';
import { HistorialPreciosComponent } from './pages/historial-precios/historial-precios.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'inventario', 
    component: InventarioComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'historial-precios', 
    component: HistorialPreciosComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'clientes', 
    component: ClientesComponent,
    canActivate: [authGuard, adminGuard]
  },
  { 
    path: 'proveedores', 
    component: ProveedoresComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'productos-proveedor', 
    component: ProductosProveedorComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'ventas', 
    component: VentasComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'usuarios', 
    component: UsuariosComponent,
    canActivate: [authGuard, adminGuard]
  },
  { 
    path: 'mi-perfil', 
    component: MiperfilComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'cambiar-contrasena', 
    component: CambiarcontrasenaComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' },
];

