import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
imports: [
    CommonModule, 
    RouterOutlet,
    RouterModule,
    SidebarComponent,
    NavbarComponent // 👈 Agrega el NavbarComponent aquí
  ],
    templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend-dicsar';
}
