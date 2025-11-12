import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService, ExportColumn } from '../../services/export.service';

export interface TableColumn {
  header: string;
  field: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  template?: TemplateRef<any>;
}

export interface TableAction {
  label: string;
  icon: string;
  color: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  action: (item: any) => void;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="table-container">
      <!-- Header con título y acciones -->
      <div class="table-header">
        <div class="table-title-section">
          <h3 class="table-title">{{ title }}</h3>
          <span class="table-subtitle">{{ subtitle }}</span>
        </div>
        
        <div class="table-actions">
          <!-- Búsqueda global -->
          <div class="search-box" *ngIf="globalSearch">
            <i class="fa-solid fa-search search-icon"></i>
            <input 
              type="text"
              [(ngModel)]="globalSearchTerm"
              (input)="onGlobalSearch()"
              placeholder="Buscar..."
              class="search-input">
          </div>

          <!-- Botones de exportación -->
          <div class="export-buttons" *ngIf="exportable">
            <button class="export-btn pdf-btn" (click)="exportToPDF()" title="Exportar a PDF">
              <i class="fa-solid fa-file-pdf"></i>
              PDF
            </button>
            <button class="export-btn excel-btn" (click)="exportToExcel()" title="Exportar a Excel">
              <i class="fa-solid fa-file-excel"></i>
              Excel
            </button>
            <button class="export-btn csv-btn" (click)="exportToCSV()" title="Exportar a CSV">
              <i class="fa-solid fa-file-csv"></i>
              CSV
            </button>
          </div>

          <!-- Botones de acción personalizados -->
          <ng-content select="[slot=actions]"></ng-content>
        </div>
      </div>

      <!-- Filtros por columna -->
      <div class="column-filters" *ngIf="showColumnFilters">
        <div class="filter-row">
          <div *ngFor="let col of columns" 
               class="filter-item"
               [style.width]="col.width || 'auto'">
            <input 
              *ngIf="col.filterable"
              type="text"
              [(ngModel)]="columnFilters[col.field]"
              (input)="onColumnFilter()"
              [placeholder]="'Filtrar ' + col.header"
              class="column-filter-input">
          </div>
          <div class="filter-actions-space"></div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th *ngFor="let col of columns" 
                  [style.width]="col.width"
                  [class.sortable]="col.sortable"
                  (click)="col.sortable && sort(col.field)">
                
                <div class="header-content">
                  <span>{{ col.header }}</span>
                  <i *ngIf="col.sortable" 
                     class="fa-solid sort-icon"
                     [class.fa-sort]="sortField !== col.field"
                     [class.fa-sort-up]="sortField === col.field && sortDirection === 'asc'"
                     [class.fa-sort-down]="sortField === col.field && sortDirection === 'desc'">
                  </i>
                </div>
              </th>
              <th *ngIf="actions && actions.length > 0" class="actions-header">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of paginatedData; let i = index" 
                [class.selected]="selectedItems.includes(item)"
                (click)="selectItem(item)">
              
              <td *ngFor="let col of columns">
                <ng-container *ngIf="col.template; else defaultCell">
                  <ng-container *ngTemplateOutlet="col.template; context: { $implicit: item, field: col.field }">
                  </ng-container>
                </ng-container>
                <ng-template #defaultCell>
                  {{ getNestedValue(item, col.field) }}
                </ng-template>
              </td>
              
              <td *ngIf="actions && actions.length > 0" class="actions-cell">
                <div class="action-buttons">
                  <button *ngFor="let action of actions"
                          [class]="'action-btn ' + action.color + '-btn'"
                          (click)="action.action(item); $event.stopPropagation()"
                          [title]="action.label">
                    <i [class]="action.icon"></i>
                    {{ action.label }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- Mensaje cuando no hay datos -->
            <tr *ngIf="paginatedData.length === 0">
              <td [colSpan]="columns.length + (actions && actions.length > 0 ? 1 : 0)" class="no-data">
                <div class="no-data-content">
                  <i class="fa-solid fa-inbox"></i>
                  <h4>No hay datos disponibles</h4>
                  <p>No se encontraron registros que coincidan con los criterios de búsqueda.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div class="table-footer" *ngIf="pageable && filteredData.length > 0">
        <div class="pagination-info">
          Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ filteredData.length }} registros
        </div>
        
        <div class="pagination-controls">
          <select [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="page-size-select">
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="100">100</option>
          </select>
          
          <button class="page-btn" 
                  [disabled]="currentPage === 0"
                  (click)="goToPage(0)">
            <i class="fa-solid fa-angles-left"></i>
          </button>
          
          <button class="page-btn" 
                  [disabled]="currentPage === 0"
                  (click)="goToPage(currentPage - 1)">
            <i class="fa-solid fa-angle-left"></i>
          </button>
          
          <span class="page-info">
            {{ currentPage + 1 }} / {{ totalPages }}
          </span>
          
          <button class="page-btn" 
                  [disabled]="currentPage >= totalPages - 1"
                  (click)="goToPage(currentPage + 1)">
            <i class="fa-solid fa-angle-right"></i>
          </button>
          
          <button class="page-btn" 
                  [disabled]="currentPage >= totalPages - 1"
                  (click)="goToPage(totalPages - 1)">
            <i class="fa-solid fa-angles-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() pageable: boolean = true;
  @Input() pageSize: number = 10;
  @Input() globalSearch: boolean = true;
  @Input() showColumnFilters: boolean = false;
  @Input() exportable: boolean = true;
  @Input() selectable: boolean = false;
  @Input() exportFileName: string = 'datos';

  @Output() itemSelected = new EventEmitter<any>();
  @Output() itemsSelected = new EventEmitter<any[]>();

  // Estado interno
  currentPage = 0;
  globalSearchTerm = '';
  columnFilters: { [key: string]: string } = {};
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedItems: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  constructor(private exportService: ExportService) {}

  ngOnInit() {
    this.filteredData = [...this.data];
    this.updatePaginatedData();
  }

  ngOnChanges() {
    this.filteredData = [...this.data];
    this.applyFilters();
  }

  // Búsqueda global
  onGlobalSearch() {
    this.currentPage = 0;
    this.applyFilters();
  }

  // Filtros por columna
  onColumnFilter() {
    this.currentPage = 0;
    this.applyFilters();
  }

  // Aplicar todos los filtros
  applyFilters() {
    let filtered = [...this.data];

    // Filtro global
    if (this.globalSearchTerm) {
      const searchTerm = this.globalSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        this.columns.some(col => {
          const value = this.getNestedValue(item, col.field);
          return String(value).toLowerCase().includes(searchTerm);
        })
      );
    }

    // Filtros por columna
    Object.keys(this.columnFilters).forEach(field => {
      const filterValue = this.columnFilters[field];
      if (filterValue) {
        filtered = filtered.filter(item => {
          const value = this.getNestedValue(item, field);
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    this.filteredData = filtered;
    this.updatePaginatedData();
  }

  // Ordenamiento
  sort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aValue = this.getNestedValue(a, field);
      const bValue = this.getNestedValue(b, field);

      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updatePaginatedData();
  }

  // Paginación
  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get startIndex(): number {
    return this.currentPage * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredData.length);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePaginatedData();
  }

  onPageSizeChange() {
    this.currentPage = 0;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = this.startIndex;
    const end = this.endIndex;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  // Selección
  selectItem(item: any) {
    if (!this.selectable) return;

    const index = this.selectedItems.indexOf(item);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(item);
    }

    this.itemSelected.emit(item);
    this.itemsSelected.emit(this.selectedItems);
  }

  // Exportación
  exportToPDF() {
    const exportColumns: ExportColumn[] = this.columns.map(col => ({
      header: col.header,
      field: col.field
    }));

    this.exportService.exportToPDF(
      this.filteredData,
      exportColumns,
      this.exportFileName,
      this.title || 'Reporte'
    );
  }

  exportToExcel() {
    const exportColumns: ExportColumn[] = this.columns.map(col => ({
      header: col.header,
      field: col.field
    }));

    this.exportService.exportToExcel(
      this.filteredData,
      exportColumns,
      this.exportFileName,
      this.title || 'Datos'
    );
  }

  exportToCSV() {
    const exportColumns: ExportColumn[] = this.columns.map(col => ({
      header: col.header,
      field: col.field
    }));

    this.exportService.exportToCSV(
      this.filteredData,
      exportColumns,
      this.exportFileName
    );
  }

  // Utilidades
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}