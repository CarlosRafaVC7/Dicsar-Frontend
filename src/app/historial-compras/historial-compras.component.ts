import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReporteVentaDTO } from '../models/reporte-venta.model';
import { ReporteVentaService } from '../services/reporte-venta.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-historial-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-compras.component.html',
  styleUrls: ['./historial-compras.component.css']
})
export class HistorialComprasComponent implements OnInit {
  compras: ReporteVentaDTO[] = [];
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 1;
  clienteId: number | null = null;
  fechaInicio = '';
  fechaFin = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private reporteService: ReporteVentaService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('clienteId');
    this.clienteId = id ? Number(id) : null;
    this.cargar();
  }

  cargar(page: number = 0): void {
    if (!this.clienteId) {
      return;
    }

    this.loading = true;
    this.page = page;
    this.reporteService.ventasPorCliente(this.clienteId, page, this.size).subscribe({
      next: res => {
        const contenido = res.content || [];
        this.compras = this.aplicarFiltroLocal(contenido);
        this.page = res.pageNumber || 0;
        this.size = res.pageSize || this.size;
        this.totalElements = this.fechaInicio || this.fechaFin ? this.compras.length : (res.totalElements || this.compras.length);
        this.totalPages = Math.ceil(this.totalElements / this.size) || 1;
        this.loading = false;
      },
      error: err => {
        console.error('Error cargando historial', err);
        this.toastService.error('Error al cargar historial de compras');
        this.loading = false;
      }
    });
  }

  aplicarFiltroFecha(): void {
    this.page = 0;
    this.cargar(0);
  }

  private aplicarFiltroLocal(contenido: ReporteVentaDTO[]): ReporteVentaDTO[] {
    if (!this.fechaInicio && !this.fechaFin) {
      return contenido;
    }

    const inicio = this.fechaInicio ? new Date(this.fechaInicio) : null;
    const fin = this.fechaFin ? new Date(this.fechaFin) : null;

    return contenido.filter(compra => {
      const fecha = new Date(compra.fechaVenta);
      if (Number.isNaN(fecha.getTime())) {
        return false;
      }
      if (inicio && fecha < inicio) {
        return false;
      }
      if (fin) {
        fin.setHours(23, 59, 59, 999);
        if (fecha > fin) {
          return false;
        }
      }
      return true;
    });
  }

  limpiarFiltroFecha(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.cargar(0);
  }

  exportarExcel(): void {
    if (!this.clienteId) {
      return;
    }

    this.reporteService.exportarVentasClienteExcel(this.clienteId).subscribe({
      next: blob => this.reporteService.descargarArchivo(blob, `ventas_cliente_${this.clienteId}.xlsx`),
      error: () => this.toastService.error('Error al exportar Excel')
    });
  }

  exportarPDFHistorial(): void {
    if (!this.clienteId) {
      return;
    }

    this.reporteService.exportarVentasClientePDF(this.clienteId).subscribe({
      next: blob => this.reporteService.descargarArchivo(blob, `ventas_cliente_${this.clienteId}.pdf`),
      error: () => this.toastService.error('Error al exportar PDF')
    });
  }

  descargarComprobante(ventaId: number): void {
    this.reporteService.exportarComprobantePDF(ventaId).subscribe({
      next: blob => this.reporteService.descargarArchivo(blob, `comprobante_${ventaId}.pdf`),
      error: () => this.toastService.error('Error al descargar comprobante')
    });
  }

  imprimirComprobante(ventaId: number): void {
    this.reporteService.exportarComprobantePDF(ventaId).subscribe({
      next: blob => this.reporteService.abrirPDF(blob, `comprobante_${ventaId}.pdf`),
      error: () => this.toastService.error('Error al imprimir comprobante')
    });
  }

  irPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.cargar(page);
    }
  }

  formatearMoneda(valor: number | undefined): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(valor ?? 0);
  }

  calcularSubtotal(total?: number): number {
    return this.reporteService.calcularSubtotal(total);
  }

  calcularIgv(total?: number): number {
    return this.reporteService.calcularIgv(total);
  }

  formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) {
      return 'Sin fecha';
    }

    return fechaObj.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
