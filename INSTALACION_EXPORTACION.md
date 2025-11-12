# 🎨 Sistema de Gestión DICSAR - Guía de Instalación

## 📦 Librerías de Exportación

Para habilitar la funcionalidad completa de exportación a PDF y Excel, instale las siguientes librerías:

### Método 1: NPM (Recomendado)
```bash
npm install jspdf jspdf-autotable xlsx file-saver
npm install --save-dev @types/file-saver
```

### Método 2: Yarn
```bash
yarn add jspdf jspdf-autotable xlsx file-saver
yarn add --dev @types/file-saver
```

## 🔧 Configuración Post-Instalación

Una vez instaladas las librerías, descomente las siguientes líneas en `/src/app/services/export.service.ts`:

```typescript
// Líneas 4-7: Descomente estas importaciones
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Líneas 25-65: Descomente la implementación del método exportToPDF
// Líneas 85-125: Descomente la implementación del método exportToExcel
```
