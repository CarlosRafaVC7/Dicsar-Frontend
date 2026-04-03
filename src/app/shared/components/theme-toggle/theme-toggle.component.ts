import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../providers/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="toggleTheme()"
      class="theme-toggle-btn"
      [attr.aria-label]="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      title="Cambiar tema"
    >
      <!-- Sol (modo claro) -->
      <svg 
        *ngIf="isDark"
        xmlns="http://www.w3.org/2000/svg" 
        class="icon sun-icon"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        stroke-width="2"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
        />
      </svg>
      
      <!-- Luna (modo oscuro) -->
      <svg 
        *ngIf="!isDark"
        xmlns="http://www.w3.org/2000/svg" 
        class="icon moon-icon"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        stroke-width="2"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
        />
      </svg>
    </button>
  `,
  styles: [`
    .theme-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .theme-toggle-btn:hover {
      background-color: var(--primary-50);
      border-color: var(--primary-300);
      color: var(--primary-600);
    }

    .dark .theme-toggle-btn:hover {
      background-color: var(--primary-900);
      color: white;
    }

    .theme-toggle-btn:active {
      transform: scale(0.95);
    }

    .icon {
      width: 20px;
      height: 20px;
      transition: transform 0.3s ease;
    }

    .theme-toggle-btn:hover .icon {
      transform: rotate(15deg);
    }

    .sun-icon {
      color: var(--secondary-500);
    }

    .moon-icon {
      color: var(--primary-500);
    }
  `]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);
  
  get isDark(): boolean {
    return this.themeService.isDark();
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
