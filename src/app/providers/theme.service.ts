import { Injectable, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  
  // Signal para el tema actual
  readonly theme = signal<Theme>(this.getInitialTheme());
  
  constructor() {
    // Aplicar tema inicial
    this.applyTheme(this.theme());
    
    // Efecto para sincronizar cambios de tema
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
      this.persistTheme(currentTheme);
    });
  }
  
  /**
   * Obtiene el tema inicial basado en localStorage o preferencia del sistema
   */
  private getInitialTheme(): Theme {
    // 1. Revisar localStorage primero
    const stored = localStorage.getItem('dicsar-theme') as Theme;
    if (stored && (stored === 'light' || stored === 'dark')) {
      return stored;
    }
    
    // 2. Revisar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // 3. Default a light
    return 'light';
  }
  
  /**
   * Aplica el tema al documento HTML
   */
  private applyTheme(theme: Theme): void {
    const html = this.document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
  
  /**
   * Persiste el tema en localStorage
   */
  private persistTheme(theme: Theme): void {
    localStorage.setItem('dicsar-theme', theme);
  }
  
  /**
   * Toggle entre light y dark
   */
  toggleTheme(): void {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }
  
  /**
   * Establece un tema específico
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
  
  /**
   * Indica si el tema actual es dark
   */
  isDark(): boolean {
    return this.theme() === 'dark';
  }
  
  /**
   * Observable para cambios de tema (para componentes que necesiten reaccionar)
   */
  themeChange = () => this.theme();
}
