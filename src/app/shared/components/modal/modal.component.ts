import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() title = '';
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  cerrar() {
    this.close.emit();
  }
}
