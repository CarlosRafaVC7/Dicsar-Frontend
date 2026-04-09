import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-vista-no-encontrada',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vista-no-encontrada.component.html',
  styleUrls: ['./vista-no-encontrada.component.css']
})
export class VistaNoEncontradaComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
