import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table',
  standalone: true,
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent {
  @Input() headers: string[] = [];
  @Input() rows: any[] = [];
  @Input() emptyMessage: string = 'No hay registros.';
}
