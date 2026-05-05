# Almacén de Vehículos (CTV)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat&logo=prisma)](https://www.prisma.io)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql)](https://www.mysql.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Activo-brightgreen)](https://github.com/ctv-proyecto/almacen-vehiculos)

> Sistema de gestión de flota vehicular para el control de entradas, salidas, mantenimientos, inspecciones y requisitos legales de vehículos.

## Tabla de Contenidos

1. [Capturas de Pantalla](#capturas-de-pantalla)
2. [Características](#características)
3. [Tecnologías](#tecnologías)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Roles de Usuario](#roles-de-usuario)
6. [API Endpoints](#api-endpoints)
7. [Instalación](#instalación)
8. [Variables de Entorno](#variables-de-entorno)
9. [Scripts Disponibles](#scripts-disponibles)
10. [Funcionalidades Principales](#funcionalidades-principales)
11. [Contribución](#contribución)
12. [Licencia](#licencia)
13. [FAQ](#faq)

## Capturas de Pantalla

| Dashboard | Gestión de Vehículos |
|-----------|---------------------|
| ![Dashboard](https://placehold.co/600x400/1e293b/ffffff?text=Dashboard+CTV) | ![Vehículos](https://placehold.co/600x400/1e293b/ffffff?text=Gestión+Vehículos) |

| Registro de Salidas | Inspecciones |
|---------------------|---------------|
| ![Salidas](https://placehold.co/600x400/1e293b/ffffff?text=Registro+de+Salidas) | ![Inspecciones](https://placehold.co/600x400/1e293b/ffffff?text=Inspecciones) |

*[Agrega capturas reales del proyecto en la carpeta `docs/screenshots/`]*

## Características

- ✅ Gestión completa de vehículos (CRUD)
- ✅ Control de conductores y licencias
- ✅ Registro de salidas y entradas con fotografías
- ✅ Inspecciones pre y post operacionales
- ✅ Control de mantenimientos preventivos y correctivos
- ✅ Gestión de requisitos legales (SOAT, tecnomecánica, pólizas)
- ✅ Control de tanqueos de combustible
- ✅ Sistema de chips de rastreo GPS
- ✅ Historial de uso y kilometraje
- ✅ Carga de documentos PDF y fotos
- ✅ Panel de estadísticas y reportes
- ✅ Autenticación y autorización por roles

## Tecnologías

### Backend

| Tecnología | Propósito |
|------------|-----------|
| **Node.js** | Entorno de ejecución |
| **Express** | Framework web REST API |
| **TypeScript** | Tipado estático |
| **Prisma ORM** | Acceso a base de datos |
| **MySQL 8.0** | Base de datos relacional |
| **JWT** | Autenticación stateless |
| **bcryptjs** | Hashing de contraseñas |
| **Multer** | Manejo de archivos |
| **node-cron** | Tareas programadas |
| **CORS** | Cross-Origin Resource Sharing |

### Frontend

| Tecnología | Propósito |
|------------|-----------|
| **React 19** | Biblioteca UI |
| **TypeScript** | Tipado estático |
| **Vite** | Bundler y dev server |
| **Tailwind CSS v4** | Estilos Utility-First |
| **TanStack Query v5** | Estado del servidor |
| **React Router v7** | Enrutamiento |
| **Axios** | Cliente HTTP |
| **Lucide React** | Iconos |
| **Sonner** | Notificaciones toast |

## Estructura del Proyecto

```
Almacén_vehiculos/
├── .gitignore
├── README.md
├── LICENSE
├── backend/                    # API REST con Express y Prisma
│   ├── src/
│   │   ├── controllers/        # Lógica de negocio
│   │   ├── routes/             # Definición de rutas
│   │   ├── middleware/         # Middleware auth, validation
│   │   ├── services/           # Servicios reutilizables
│   │   ├── utils/              # Utilidades
│   │   └── index.ts            # Entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Definición de modelos
│   │   ├── migrations/         # Migraciones de BD
│   │   └── seed.ts             # Datos iniciales
│   ├── uploads/                # Archivos subidos (imágenes, PDFs)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                    # Variables de entorno
│   └── .env.example            # Plantilla de variables
│
└── frontend/                   # Aplicación cliente React
    ├── src/
    │   ├── components/         # Componentes reutilizables
    │   ├── pages/              # Páginas de la app
    │   ├── hooks/              # Custom hooks
    │   ├── services/           # Integración con API
    │   ├── types/              # Definiciones TypeScript
    │   ├── styles/             # Estilos globales
    │   ├── App.tsx             # Componente principal
    │   └── main.tsx            # Entry point
    ├── public/                  # Archivos estáticos
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── .eslintrc.js
```

## Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **ADMIN** | Administrador del sistema | Acceso total, gestión de usuarios, configuración |
| **CONDUCTOR** | Conductores de vehículos | Registro de salidas, inspecciones, ver vehículos asignados |
| **AUTORIZADOR** | Autoriza salidas y tanqueos | Aprobación de solicitudes de salida y combustible |
| **VIGILANTE** | Registra entradas/salidas físicas | Registro de paso vehicular, carga de fotos |
| **CONSULTAS** | Consulta general | Solo lectura de información |

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `GET` | `/api/auth/me` | Obtener usuario actual |

### Vehículos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/vehiculos` | Listar vehículos |
| `GET` | `/api/vehiculos/:id` | Obtener vehículo por ID |
| `POST` | `/api/vehiculos` | Crear vehículo |
| `PUT` | `/api/vehiculos/:id` | Actualizar vehículo |
| `DELETE` | `/api/vehiculos/:id` | Eliminar vehículo |

### Conductores

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/conductores` | Listar conductores |
| `GET` | `/api/conductores/:id` | Obtener conductor |
| `POST` | `/api/conductores` | Crear conductor |
| `PUT` | `/api/conductores/:id` | Actualizar conductor |

### Salidas de Vehículos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/salidas` | Listar salidas |
| `POST` | `/api/salidas` | Crear solicitud de salida |
| `PUT` | `/api/salidas/:id/aprobar` | Aprobar salida |
| `PUT` | `/api/salidas/:id/rechazar` | Rechazar salida |
| `PUT` | `/api/salidas/:id/registrar-entrada` | Registrar entrada |

### Inspecciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/inspecciones` | Listar inspecciones |
| `POST` | `/api/inspecciones` | Crear inspección |
| `GET` | `/api/inspecciones/:id` | Ver inspección |

### Mantenimientos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/mantenimientos` | Listar mantenimientos |
| `POST` | `/api/mantenimientos` | Registrar mantenimiento |
| `PUT` | `/api/mantenimientos/:id` | Actualizar mantenimiento |

### Requisitos Legales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/requisitos` | Listar requisitos |
| `GET` | `/api/requisitos/vencidos` | Ver requisitos próximos a vencer |
| `POST` | `/api/requisitos` | Agregar requisito |

### Tanqueos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/tanqueos` | Listar tanqueos |
| `POST` | `/api/tanqueos` | Registrar tanqueo |
| `PUT` | `/api/tanqueos/:id/aprobar` | Aprobar tanqueo |

### Archivos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/upload` | Subir archivo |
| `GET` | `/api/upload/:filename` | Descargar archivo |

*[Swagger/OpenAPI completo en `/api/docs`]*

## Instalación

### Prerrequisitos

| Requisito | Versión Mínima |
|-----------|----------------|
| Node.js | 18.x |
| MySQL | 8.0 |
| npm | 9.x |

### Clonar el Proyecto

```bash
git clone https://github.com/ctv-proyecto/almacen-vehiculos.git
cd almacen-vehiculos
```

### Configuración del Backend

```bash
cd backend
npm install
```

Copia el archivo de configuración ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales (ver sección [Variables de Entorno](#variables-de-entorno)).

### Configuración de la Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Cargar datos iniciales (seed)
npm run db:seed
```

### Iniciar el Backend

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm run build
npm run start
```

### Configuración del Frontend

```bash
cd ../frontend
npm install
```

Crea el archivo `.env` si es necesario:

```bash
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

### Iniciar el Frontend

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

### Acceso a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (ejecutar `npm run db:studio`)

## Variables de Entorno

### Backend (.env)

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DATABASE_URL="mysql://root:password@localhost:3306/ctv_db"

# Autenticación
JWT_SECRET=tu_secreto_jwt_muy_largo_y_seguro_12345
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development`, `production` |
| `DATABASE_URL` | Connection string MySQL | `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | Clave para firmar tokens JWT | Cadena aleatoria segura |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `7d`, `24h` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` |
| `UPLOAD_DIR` | Directorio para archivos subidos | `./uploads` |
| `MAX_FILE_SIZE` | Tamaño máximo de archivo (bytes) | `5242880` (5MB) |

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api` |

## Scripts Disponibles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo (nodemon) |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run start` | Ejecuta servidor en producción |
| `npm run db:migrate` | Crea/actualiza tablas de BD |
| `npm run db:seed` | Carga datos iniciales |
| `npm run db:studio` | Abre interfaz visual de Prisma |
| `npm run db:generate` | Genera cliente Prisma |
| `npm run db:reset` | Resetea BD (migrate + seed) |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Construye para producción |
| `npm run preview` | Previsualiza build local |
| `npm run lint` | Ejecuta ESLint |
| `npm run lint:fix` | Corrige errores de lint |

## Funcionalidades Principales

### Gestión de Vehículos
- Registro de vehículos con características completas
- Historial de mantenimientos
- Control de estado (disponible, en uso, mantenimiento)
- Gestión de chips GPS

### Control de Conductores
- Registro de conductores con licencia
- Control de vencimiento de licencias
- Historial de viajes por conductor
- Vinculación con usuario del sistema

### Registro de Salidas/Entradas
- Solicitud de salida con motivo y destino
- Aprobación por autorizado
- Registro de salida por vigilante
- Registro de entrada con kilometraje
- Carga de fotografías del vehículo

### Inspecciones
- Checklist pre-operacional
- Checklist post-operacional
- Registro de fallas reportadas
- Historial de inspecciones por vehículo

### Mantenimientos
- Registro de ingresos a taller
- Control de gastos por mantenimiento
- Historial de reparaciones
- Seguimiento de kilometraje

### Requisitos Legales
- SOAT
- Tecnomecánica
- Póliza de seguros
- Seguimiento de vencimientos
- Notificaciones de próximos a vencer

### Control de Tanqueos
- Registro de consumo de combustible
- Aprobación de tanqueos
- Historial por vehículo
- Reportes de consumo

### Reportes y Estadísticas
- Vehículos por dependencia
- Consumos de combustible
- Kilometraje acumulado
- Requisitos por vencer
- Historial de uso

## Contribución

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. **Fork** el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un **Pull Request**

### Estándares de Código

- Backend: ESLint + Prettier
- Frontend: ESLint + reglas de React
- Commits: Conventional Commits
- Branches: `feature/`, `bugfix/`, `hotfix/`

### Testing

```bash
# Backend - ejecutar tests
npm run test

# Frontend - ejecutar tests
npm run test
```

## Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2024 CTV - Almacén de Vehículos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## FAQ

### ¿Cómo agregar un nuevo vehículo?

1. Inicia sesión como ADMIN
2. Ve a **Vehículos** > **Nuevo Vehículo**
3. Completa el formulario con los datos requeridos
4. Assigna un conductor si es necesario
5. Guarda el registro

### ¿Cómo registrar una salida de vehículo?

1. El conductor inicia sesión
2. Va a **Salidas** > **Nueva Salida**
3. Selecciona el vehículo, conductor y destino
4. Especifica el motivo de la salida
5. Un AUTORIZADOR debe aprobar la solicitud
6. El VIGILANTE registra la salida física

### ¿Cómo ver los requisitos próximos a vencer?

1. Ve a **Mantenimientos** > **Requisitos**
2. El sistema muestra automáticamente los requisitos que vencen en los próximos 30 días
3. Puedes filtrar por tipo de requisito

### ¿Cómo cargar documentos PDF?

1. Ve a la sección对应的 (vehículo, conductor, requisito)
2. Busca la opción **Adjuntar Documento**
3. Selecciona el archivo PDF
4. El sistema lo almacenará en `/uploads`

### ¿El sistema envía notificaciones?

Por defecto no. Las notificaciones se muestran en el panel cuando:
- Una salida requiere aprobación
- Un requisito está por vencer (próximamente)
- Una inspección tiene fallas reportadas

### ¿Cómo cambiar el rol de un usuario?

Solo los usuarios con rol ADMIN pueden cambiar roles:
1. Ve a **Administración** > **Usuarios**
2. Busca el usuario
3. Edita y selecciona el nuevo rol

### ¿Soporta múltiples idiomas?

Actualmente solo español. Contribuciones para i18n son bienvenidas.