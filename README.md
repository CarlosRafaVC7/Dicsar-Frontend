# DICSAR Frontend - Aplicacion Web de Gestion

## Descripcion

Aplicacion web del sistema de gestion de inventario **DICSAR S.A.C.**, desarrollada en **Angular 19** con **PrimeNG** y **Angular Material**.

---

## Tecnologia

| Componente | Tecnologia |
|------------|------------|
| Framework | Angular 19.2 |
| UI Components | PrimeNG 16.9, Angular Material 19.2 |
| Graficos | Chart.js 4.5 |
| Icons | Font Awesome 7.1, PrimeIcons |
| Exportacion | jsPDF, XLSX, FileSaver |
| HTTP Client | Angular HttpClient |

---

## Arquitectura

```
src/app/
├── pages/                    # Paginas principales
│   ├── login/               # Autenticacion
│   ├── dashboard/           # Panel principal con graficos
│   ├── productos/          # Gestion de productos
│   ├── proveedores/        # Gestion de proveedores
│   ├── clientes/           # Gestion de clientes
│   ├── ventas/             # Registro de ventas
│   ├── reportes/          # Reportes y estadisticas
│   └── usuarios/           # Gestion de usuarios (Admin)
├── shared/                  # Componentes reutilizables
│   ├── navbar/             # Barra de navegacion superior
│   ├── sidebar/            # Menu lateral
│   └── data-table/         # Componente de tabla de datos
├── interceptors/            # Interceptores HTTP
│   └── auth.interceptor.ts # Agrega token JWT a peticiones
├── guards/                  # Proteccion de rutas
│   ├── auth.guard.ts        # Verifica autenticacion
│   ├── no-auth.guard.ts    # Previene acceso si ya logueado
│   └── admin.guard.ts       # Solo admins pueden acceder
├── services/                # Servicios API
├── app.routes.ts           # Definicion de rutas
└── app.config.ts          # Configuracion de la app
```

---

## Paginas y Funcionalidades

### Login
- Formulario de autenticacion
- Validacion de credenciales
- Almacenamiento de token JWT

### Dashboard
- Graficos de ventas (Chart.js)
- Resumen de inventario
- Estadisticas rapidas
- Notificaciones recientes

### Productos
- Tabla con filtros y busqueda
- CRUD completo de productos
- Gestion de stock y precios
- Control de vencimiento

### Proveedores
- Registro de proveedores
- Validacion de RUC
- Historial de adquisiciones

### Clientes
- Gestion de clientes
- Registro de ventas por cliente

### Ventas
- Registro de nuevas ventas
- Seleccion de productos
- Calculo de totales
- Generacion de boleta

### Reportes
- Reporte de inventario
- Reporte de ventas
- Exportacion a PDF y Excel

### Usuarios (Solo Admin)
- Gestion de usuarios del sistema
- Asignacion de roles

---

## Caracteristicas

- **Interfaz responsiva** - Se adapta a diferentes tamanos de pantalla
- **Tablas avanzadas** - Filtros, paginacion, ordenamiento
- **Graficos** - Visualizacion de datos en el dashboard
- **Exportacion** - PDF y Excel para reportes
- **Seguridad** - Rutas protegidas por roles
- **UX/UI** - Diseño moderno con PrimeNG

---

## Ejecucion

### Requisitos Previos
- Node.js 18+
- npm 9+

### Instalar dependencias

```bash
cd Dicsar-Frontend
npm install
```

### Ejecutar en desarrollo

```bash
npm start
```

La aplicacion estara disponible en `http://localhost:4200`

### Compilar para produccion

```bash
npm run build
```

---

## Integracion con Backend

El frontend se conecta con la API en `http://localhost:8080`

Los endpoints consumidos:

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/auth/login` | Autenticacion |
| GET | `/api/productos` | Listar productos |
| POST | `/api/productos` | Crear producto |
| GET | `/api/proveedores` | Listar proveedores |
| GET | `/api/clientes` | Listar clientes |
| POST | `/api/ventas` | Registrar venta |
| GET | `/api/reportes/*` | Obtener reportes |

---

## Presentacion para GitHub

**DICSAR** es un sistema completo de gestion de inventario que incluye:

- Backend API REST con Spring Boot
- Frontend web con Angular
- Base de datos MySQL
- Autenticacion JWT
- Reportes y graficos

**Usuario de prueba:**
- Usuario: `admin`
- Contrasena: `admin123`

**Tecnologias:**
- Angular 19 + PrimeNG
- Spring Boot 3 + MySQL
- JWT Authentication
- Chart.js + jsPDF

---

## Estructura de Proyecto

```
DICSAR/
├── Dicsar-Frontend/         # Aplicacion Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   ├── shared/
│   │   │   ├── interceptors/
│   │   │   ├── guards/
│   │   │   └── services/
│   │   └── styles.css
│   ├── package.json
│   └── angular.json
└── DICSAR-Backend/         # API Spring Boot
    ├── src/
    │   └── main/
    │       └── java/com/dicsar/
    └── pom.xml
```

---

## License

Proyecto de desarrollo academico - FEPI 2025