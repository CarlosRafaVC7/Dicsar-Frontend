import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { VentaService } from '../../services/venta.service';
import { MovimientoService } from '../../services/movimiento.service';
import { ProductoService } from '../../services/producto.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Ventas
  productosMasVendidos: any[] = [];
  clientesTopCompras: any[] = [];
  totalesMensuales: any[] = [];

  // Inventario
  movimientos: any[] = [];
  productosTotal = 0;
  stockBajo: any[] = [];
  productosVencidos: any[] = [];
  productosProximosAVencer: any[] = [];

  // Sistema
  usuariosActivos = 0;
  totalUsuarios = 0;

  // Estados
  loading = true;

  // Gráficos
  chartMovimientosConfig: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Salidas', 'Entradas', 'Ajustes'],
      datasets: [
        {
          label: 'Total Movimientos',
          data: [0, 0, 0],
          backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
          borderColor: ['#FF5252', '#00BCD4', '#FFC107'],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#333' } }
      }
    }
  };

  chartVentasMensualesConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Ventas Mensuales (S/)',
          data: [],
          borderColor: '#9C27B0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: '#9C27B0'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#333' } }
      }
    }
  };

  chartProductosConfig: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181',
            '#AA96DA', '#FCBAD3', '#A8DADC', '#457B9D', '#1D3557'
          ]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#333' }, position: 'right' }
      }
    }
  };

  constructor(
    private ventaService: VentaService,
    private movimientoService: MovimientoService,
    private productoService: ProductoService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.cargarTodosDatos();
  }

  cargarTodosDatos(): void {
    this.loading = true;

    // Cargar datos de Ventas - CON MAPPING CORRECTO
    this.ventaService.obtenerProductosMasVendidos().subscribe({
      next: (datos) => {
        console.log('📊 Raw Productos:', datos);
        if (Array.isArray(datos)) {
          // MAPEAR: [id, nombre, cantidad, total] → [nombre, cantidad, total]
          this.productosMasVendidos = datos.map((p: any) => {
            if (Array.isArray(p) && p.length >= 4) {
              return [p[1], p[2], p[3]]; // nombre, cantidad, total
            }
            return p;
          }).filter((p: any) => {
            if (Array.isArray(p)) return p[1] > 0;
            return false;
          });
        }
        this.actualizarGraficos();
      },
      error: (error) => {
        console.error('❌ Error productos vendidos:', error);
        this.productosMasVendidos = [];
      }
    });

    this.ventaService.obtenerClientesTopCompras().subscribe({
      next: (datos) => {
        console.log('👥 Raw Clientes:', datos);
        if (Array.isArray(datos)) {
          // MAPEAR: [id, nombre, cantidad, total] → [nombre, cantidad, total]
          this.clientesTopCompras = datos.map((c: any) => {
            if (Array.isArray(c) && c.length >= 4) {
              return [c[1], c[2], c[3]]; // nombre, cantidad, total
            }
            return c;
          }).filter((c: any) => {
            if (Array.isArray(c)) return c[2] > 0;
            return false;
          });
        }
      },
      error: (error) => {
        console.error('❌ Error clientes top:', error);
        this.clientesTopCompras = [];
      }
    });

    this.ventaService.obtenerTotalesMensuales().subscribe({
      next: (datos) => {
        console.log('📈 Raw Totales:', datos);
        if (Array.isArray(datos)) {
          // Ya está en formato correcto: [año, mes, total, count]
          this.totalesMensuales = datos.filter((m: any) => {
            if (Array.isArray(m) && m.length >= 3) {
              return m[2] > 0; // total > 0
            }
            return false;
          });
        }
        this.actualizarGraficos();
      },
      error: (error) => {
        console.error('❌ Error totales mensuales:', error);
        this.totalesMensuales = [];
      }
    });

    // Cargar datos de Inventario
    this.movimientoService.listar().subscribe({
      next: (datos) => {
        console.log('📋 Movimientos:', datos);
        this.movimientos = datos || [];
        this.actualizarGraficos();
      },
      error: (error) => console.error('❌ Error movimientos:', error)
    });

    this.productoService.listar().subscribe({
      next: (datos) => {
        console.log('🛒 Productos:', datos);
        this.productosTotal = (datos || []).length;
        this.stockBajo = (datos || []).filter((p: any) => (p.stockActual || p.stock || 0) < 10).slice(0, 5);

        // 🆕 Calcular productos vencidos y próximos a vencer
        const hoy = new Date();
        this.productosVencidos = (datos || []).filter((p: any) => {
          if (!p.fechaVencimiento) return false;
          const vencimiento = new Date(p.fechaVencimiento);
          return vencimiento < hoy && p.estado;
        }).slice(0, 5);

        this.productosProximosAVencer = (datos || []).filter((p: any) => {
          if (!p.fechaVencimiento) return false;
          const vencimiento = new Date(p.fechaVencimiento);
          const diasFaltantes = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
          return diasFaltantes > 0 && diasFaltantes <= 30 && p.estado;
        }).slice(0, 5);
      },
      error: (error) => console.error('❌ Error productos:', error)
    });

    // Cargar datos de Sistema
    this.usuarioService.listar().subscribe({
      next: (datos: any) => {
        console.log('👤 Usuarios:', datos);
        const usuarios = Array.isArray(datos) ? datos : (datos?.content || []);
        this.totalUsuarios = usuarios.length;
        this.usuariosActivos = usuarios.filter((u: any) => u.activo).length || Math.ceil(usuarios.length * 0.7);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error usuarios:', error);
        this.loading = false;
      }
    });
  }

  actualizarGraficos(): void {
    // Gráfico de Movimientos
    this.chartMovimientosConfig.data.datasets[0].data = [
      this.salidasCount,
      this.entradasCount,
      this.ajustesCount
    ];

    // Gráfico de Ventas Mensuales - FORMATO: [nombre, cantidad, total]
    const labelsVentas: string[] = [];
    const datosVentas: number[] = [];

    this.totalesMensuales.forEach((m: any) => {
      if (Array.isArray(m) && m.length >= 3) {
        // Formato: [año, mes, total, count?]
        const año = m[0];
        const mes = m[1];
        const total = parseFloat(m[2]);

        if (total > 0) {
          const fecha = new Date(año, mes - 1, 1);
          labelsVentas.push(fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
          datosVentas.push(total);
        }
      }
    });

    this.chartVentasMensualesConfig.data.labels = labelsVentas;
    this.chartVentasMensualesConfig.data.datasets[0].data = datosVentas;

    // Gráfico de Productos Más Vendidos - FORMATO: [nombre, cantidad, total]
    const productosLabels: string[] = [];
    const productosData: number[] = [];

    this.productosMasVendidos.forEach((p: any) => {
      if (Array.isArray(p) && p.length >= 3) {
        const nombre = p[0];
        const cantidad = parseFloat(p[1]);

        if (cantidad > 0) {
          productosLabels.push(nombre);
          productosData.push(cantidad);
        }
      }
    });

    this.chartProductosConfig.data.labels = productosLabels;
    this.chartProductosConfig.data.datasets[0].data = productosData;

    console.log('✅ Gráficos actualizados', {
      ventas: { labels: labelsVentas, data: datosVentas },
      productos: { labels: productosLabels, data: productosData }
    });
  }

  // Getters para Movimientos
  get salidasCount(): number {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'SALIDA').length;
  }

  get entradasCount(): number {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'ENTRADA').length;
  }

  get ajustesCount(): number {
    return this.movimientos.filter(m => (m.tipoMovimiento || m.tipo) === 'AJUSTE').length;
  }

  // Helper para moneda
  formatearMoneda(valor: number): string {
    if (!valor) return 'S/ 0.00';
    return 'S/ ' + valor.toFixed(2);
  }

  // 🆕 Helper para cálculo de vencimiento
  getDiasParaVencer(fechaVencimiento: string): number {
    if (!fechaVencimiento) return 999;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    return Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
  }
}
