import { Component } from '@angular/core';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ThemeService } from './providers/theme.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    RouterModule,
    SidebarComponent,
    NavbarComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'DICSAR - Sistema de Gestión';
  showLayout = true;
  sidebarExpanded = true;

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) {
    // Inicializar tema desde localStorage o preferencia del sistema
    this.themeService.theme(); // Esto fuerza la lectura y aplicación del tema
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showLayout = !event.url.includes('/login');
    });
  }

  onSidebarToggle(expanded: boolean): void {
    this.sidebarExpanded = expanded;
  }
}
