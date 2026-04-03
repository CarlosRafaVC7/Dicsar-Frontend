import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  toastService = inject(ToastService);

  get toasts(): Toast[] {
    return this.toastService.toasts();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✔';
      case 'error': return '✖';
      case 'warning': return '⚠️';
      case 'info':
      default: return 'ℹ️';
    }
  }

  dismiss(id: number): void {
    this.toastService.remove(id);
  }

  trackById(index: number, toast: Toast): number {
    return toast.id;
  }
}
