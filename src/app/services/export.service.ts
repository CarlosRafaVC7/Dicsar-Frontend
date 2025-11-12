import { Injectable } from '@angular/core';

// Librerías para exportación
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  header: string;
  field: string;
  width?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {}

  /**
   * Exporta datos a PDF con logo de DICSAR
   */
  async exportToPDF(data: any[], columns: ExportColumn[], fileName: string, title: string): Promise<void> {
    try {
      const doc = new jsPDF();
      
      // Logo DICSAR (simulado con texto)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 44, 140); // Color azul DICSAR
      doc.text('DICSAR S.A.C.', 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Sistema de Gestión de Inventario', 20, 30);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 20, 38);
      doc.text(`Hora: ${new Date().toLocaleTimeString('es-PE')}`, 120, 38);
      
      // Título del reporte
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(title, 20, 55);
      
      // Crear tabla
      const headers = columns.map(col => col.header);
      const rows = data.map(item => 
        columns.map(col => {
          const value = this.getNestedValue(item, col.field);
          // Formatear valores especiales
          if (col.field.includes('precio') || col.field.includes('valor')) {
            return value ? this.formatCurrencyForExport(value) : '-';
          }
          if (col.field.includes('fecha')) {
            return value ? this.formatDateForExport(value) : '-';
          }
          return value || '-';
        })
      );
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 65,
        theme: 'grid',
        headStyles: {
          fillColor: [10, 44, 140], // Color azul DICSAR
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [245, 247, 255]
        },
        margin: { top: 70, left: 15, right: 15 },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height || pageSize.getHeight();
          
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            data.settings.margin.left,
            pageHeight - 10
          );
          
          doc.text(
            'Generado por DICSAR S.A.C.',
            pageSize.width - 60,
            pageHeight - 10
          );
        }
      });
      
      doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
            
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      alert('Error al exportar a PDF: ' + error);
    }
  }

  /**
   * Exporta datos a Excel
   */
  async exportToExcel(data: any[], columns: ExportColumn[], fileName: string, sheetName: string = 'Datos'): Promise<void> {
    try {
      // Preparar datos con formateo
      const exportData = data.map(item => {
        const row: any = {};
        columns.forEach(col => {
          const value = this.getNestedValue(item, col.field);
          
          // Formatear valores especiales
          if (col.field.includes('precio') || col.field.includes('valor')) {
            row[col.header] = value ? this.formatCurrencyForExport(value) : '-';
          } else if (col.field.includes('fecha')) {
            row[col.header] = value ? this.formatDateForExport(value) : '-';
          } else if (typeof value === 'boolean') {
            row[col.header] = value ? 'Activo' : 'Inactivo';
          } else {
            row[col.header] = value || '-';
          }
        });
        return row;
      });
      
      // Crear hoja de información
      const infoData = [
        ['DICSAR S.A.C.'],
        ['Sistema de Gestión de Inventario'],
        [''],
        ['Reporte:', fileName],
        ['Fecha:', new Date().toLocaleDateString('es-PE')],
        ['Hora:', new Date().toLocaleTimeString('es-PE')],
        ['Registros:', data.length.toString()],
        ['']
      ];
      
      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Hoja de información
      const infoWs = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(wb, infoWs, 'Información');
      
      // Hoja de datos
      const dataWs = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, dataWs, sheetName);
      
      // Configurar anchos de columna para la hoja de datos
      const columnWidths = columns.map(col => ({ width: col.width || 15 }));
      dataWs['!cols'] = columnWidths;
      
      // Configurar anchos para la hoja de información
      infoWs['!cols'] = [{ width: 20 }, { width: 30 }];
      
      // Generar archivo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
            
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel: ' + error);
    }
  }

  /**
   * Exporta datos a CSV
   */
  exportToCSV(data: any[], columns: ExportColumn[], fileName: string): void {
    try {
      // Crear encabezados
      const headers = columns.map(col => col.header).join(',');
      
      // Crear filas
      const rows = data.map(item => 
        columns.map(col => {
          const value = this.getNestedValue(item, col.field) || '';
          // Escapar comillas y comas
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      );
      
      // Combinar todo
      const csvContent = [headers, ...rows].join('\n');
      
      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      alert('Error al exportar a CSV');
    }
  }

  /**
   * Obtiene valor anidado de un objeto usando notación de punto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Formatea fecha para exportación
   */
  formatDateForExport(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  /**
   * Formatea moneda para exportación
   */
  formatCurrencyForExport(amount: number): string {
    if (amount === null || amount === undefined) return '';
    return `S/ ${amount.toFixed(2)}`;
  }
}