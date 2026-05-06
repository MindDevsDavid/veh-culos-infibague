# Sistema de Control de Vehículos — INFIbagué (CTV)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-5.0.51b-4479A1?style=flat&logo=mysql)](https://www.mysql.com)
[![Status](https://img.shields.io/badge/Status-Activo-brightgreen)](#)

> Sistema web para gestión de flota vehicular: solicitudes de salida, inspecciones preoperacionales/postoperacionales, mantenimiento, requisitos documentales y control de portería.

## Tabla de Contenidos

1. [Características](#características)
2. [Stack tecnológico](#stack-tecnológico)
3. [Roles de usuario](#roles-de-usuario)
4. [Flujo de un viaje](#flujo-de-un-viaje)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Instalación](#instalación)
7. [Variables de entorno](#variables-de-entorno)
8. [Levantar en desarrollo](#levantar-en-desarrollo)
9. [Acceso desde red local LAN](#acceso-desde-red-local-lan)
10. [API Endpoints](#api-endpoints)
11. [Scripts disponibles](#scripts-disponibles)
12. [Consideraciones técnicas](#consideraciones-técnicas)
13. [FAQ](#faq)

---

## Características

- Gestión completa de vehículos (CRUD)
- Control de conductores, licencias y autorización TH
- Solicitudes de salida con aprobación por autorizador
- Inspecciones pre y postoperacionales con checklist completo
- Control de mantenimientos preventivos y correctivos
- Gestión de requisitos legales (SOAT, tecnomecánica, pólizas) con alertas de vencimiento
- Control de tanqueos de combustible
- Sistema de chips de rastreo GPS
- Historial de uso y kilometraje por viaje
- Carga de fotografías en check de salida/entrada
- Carga de documentos PDF para requisitos
- Panel de estadísticas en dashboard
- Autenticación JWT con refresh tokens (cookies HttpOnly)
- Diseño responsive: funciona en desktop, tablet y móvil

---

## Stack tecnológico

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Entorno de ejecución |
| Express | 4.x | Framework web REST API |
| TypeScript | 5.x | Tipado estático |
| mysql2/promise | 3.x | Acceso a BD (raw SQL — Prisma no soporta MySQL 5.x) |
| JWT | — | Autenticación con access + refresh tokens |
| bcryptjs | — | Hashing de contraseñas |
| Multer | — | Manejo de archivos (fotos, PDFs) |
| node-cron | — | Tarea diaria para marcar requisitos vencidos |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18 | Biblioteca UI |
| TypeScript | 5.x | Tipado estático |
| Vite | — | Bundler y dev server |
| Tailwind CSS | v4 | Estilos Utility-First |
| TanStack Query | v5 | Estado del servidor y caché |
| React Router | v6 | Enrutamiento |
| Axios | — | Cliente HTTP |
| Lucide React | — | Iconos |
| Sonner | — | Notificaciones toast |

---

## Roles de usuario

| Rol | Permisos |
|-----|---------|
| `ADMIN` | Acceso total: vehículos, conductores, mantenimiento, requisitos, chips, tanqueos, salidas, historial, usuarios, inspecciones |
| `AUTORIZADOR` | Aprobar/rechazar solicitudes de salida, ver historial e inspecciones |
| `CONDUCTOR` | Crear inspecciones pre/postoperacionales, solicitar viajes, ver sus solicitudes |
| `VIGILANTE` | Check de salida y entrada de vehículos en portería |
| `CONSULTAS` | Solo lectura: viajes en curso e historial |

---

## Flujo de un viaje

```
Conductor llena inspección preoperacional
        ↓
Conductor solicita viaje (adjunta ID de inspección)
        ↓
Autorizador autoriza o rechaza
        ↓
Vigilante hace check-salida (registra hora exacta de salida + fotos)
        ↓
[Viaje en curso]
        ↓
Vigilante hace check-entrada (registra hora exacta de regreso + fotos)
        ↓
Conductor llena inspección postoperacional
        ↓
Historial de uso registrado con km inicial/final/recorrido
```

---

## Estructura del proyecto

```
Almacén_vehiculos/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point, CORS, cron de requisitos vencidos
│   │   ├── routes/               # Un archivo por entidad
│   │   │   ├── auth.ts
│   │   │   ├── vehiculos.ts
│   │   │   ├── conductores.ts
│   │   │   ├── salidas.ts
│   │   │   ├── inspecciones.ts
│   │   │   ├── historial.ts
│   │   │   ├── mantenimiento.ts
│   │   │   ├── requisitos.ts
│   │   │   ├── tanqueos.ts
│   │   │   ├── chips.ts
│   │   │   ├── componentes.ts
│   │   │   ├── catalogos.ts
│   │   │   └── usuarios.ts
│   │   └── utils/
│   │       └── db.ts             # Pool mysql2 con retry/recreación en ECONNRESET
│   ├── prisma/
│   │   └── seed.ts               # Seed inicial: admin + catálogos base
│   └── uploads/                  # Fotos de inspecciones y documentos PDF
│
└── frontend/
    └── src/
        ├── api/                  # Clientes axios por entidad
        ├── components/           # Layout, DataTable, Modal, InspeccionForm, FormField, etc.
        ├── hooks/                # useVehiculos, useConductores, useSalidas, useCatalogos, etc.
        ├── pages/
        │   ├── admin/            # Dashboard, Vehículos, Conductores, Mantenimiento, etc.
        │   ├── autorizador/      # Pendientes, Salidas, Vehículos, Conductores, Historial
        │   ├── conductor/        # Solicitar, Solicitudes, Inspecciones
        │   ├── vigilante/        # Activos, CheckSalida, CheckEntrada
        │   └── consultas/        # Activos, Historial
        ├── context/              # AuthContext
        └── types/                # Definiciones TypeScript
```

---

## Instalación

### Requisitos previos

| Requisito | Versión mínima |
|-----------|----------------|
| Node.js | 18.x |
| MySQL | 5.0.51b o superior |
| npm | 9.x |

### 1. Clonar el proyecto

```bash
git clone <url-del-repositorio>
cd Almacén_vehiculos
```

### 2. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Crear la base de datos

```sql
CREATE DATABASE ctv_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Aplicar el schema

> El proyecto usa SQL raw (mysql2/promise) porque Prisma no soporta MySQL 5.0.51b.  
> Aplicar las tablas directamente en MySQL.

**Tablas principales:**

- `usuarios` — cuentas de acceso al sistema
- `ctv_conductores` — perfil de conductores (vinculado a `usuarios.id` via `id_usuario`)
- `ctv_vehiculos` — flota de vehículos
- `ctv_salidas_vehiculos` — solicitudes/viajes
- `ctv_inspecciones` — inspecciones preoperacionales y postoperacionales
- `ctv_historial_uso` — registro de km por viaje (requiere columna `id_salida`)
- `ctv_control_requisitos` — documentos vencibles por vehículo
- `ctv_mantenimiento` — registros de taller
- `ctv_chips_gps`, `ctv_control_componentes`, `ctv_control_tanqueo`
- `ctv_fotos_salida_entrada` — fotos de check salida/entrada
- Catálogos: `ctv_marcas`, `ctv_colores`, `ctv_tipos_vehiculo`, `ctv_dependencias`, `ctv_componentes`, `ctv_tipos_requisito`

**Columnas adicionales requeridas (no incluidas en el schema original):**

```sql
ALTER TABLE ctv_historial_uso ADD COLUMN id_salida INT NULL;
ALTER TABLE ctv_conductores ADD COLUMN id_usuario INT NULL;
ALTER TABLE ctv_salidas_vehiculos ADD COLUMN estado VARCHAR(30) DEFAULT 'PENDIENTE';
ALTER TABLE ctv_salidas_vehiculos ADD COLUMN id_vigilante_salida INT NULL;
ALTER TABLE ctv_salidas_vehiculos ADD COLUMN id_vigilante_entrada INT NULL;
ALTER TABLE ctv_salidas_vehiculos ADD COLUMN motivo_rechazo TEXT NULL;
ALTER TABLE ctv_fotos_salida_entrada ADD COLUMN id_salida INT NULL;
ALTER TABLE ctv_fotos_salida_entrada ADD COLUMN id_subido_por INT NULL;
```

### 5. Crear `backend/.env`

```env
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/ctv_db"
JWT_SECRET="secreto-minimo-32-caracteres"
JWT_REFRESH_SECRET="otro-secreto-diferente-minimo-32"
PORT=3001
```

### 6. Seedear datos iniciales

```bash
cd backend
npm run db:seed
```

Crea el usuario administrador: `admin@infibague.gov.co` / `Admin123!` y los catálogos base (marcas, colores, tipos de vehículo, dependencias, componentes, tipos de requisito).

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Cadena de conexión MySQL (`mysql://user:pass@host:port/db`) | Sí |
| `JWT_SECRET` | Secreto para firmar access tokens (mín. 32 chars) | Sí |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens (diferente al anterior) | Sí |
| `PORT` | Puerto del backend (default: `3001`) | No |

---

## Levantar en desarrollo

```bash
# Terminal 1 — backend (puerto 3001)
cd backend
npm run dev

# Terminal 2 — frontend (puerto 5173)
cd frontend
npm run dev
```

Frontend disponible en `http://localhost:5173`.  
El proxy de Vite redirige `/api` y `/uploads` automáticamente a `localhost:3001`.

---

## Acceso desde red local LAN

Backend escucha en `0.0.0.0:3001`. Vite también expone el frontend en `0.0.0.0`.  
CORS permite el rango `10.1.1.x` y `localhost`.

Desde otro equipo de la red interna: `http://<IP-del-servidor>:5173`

---

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `POST` | `/api/auth/refresh` | Renovar access token |
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
| `DELETE` | `/api/conductores/:id` | Eliminar conductor |

### Salidas de Vehículos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/salidas` | Listar salidas (filtradas por rol) |
| `GET` | `/api/salidas/:id` | Obtener salida por ID |
| `POST` | `/api/salidas` | Crear solicitud de salida |
| `PUT` | `/api/salidas/:id/autorizar` | Autorizar salida |
| `PUT` | `/api/salidas/:id/rechazar` | Rechazar salida |
| `PUT` | `/api/salidas/:id/check-salida` | Registrar salida física (vigilante) |
| `PUT` | `/api/salidas/:id/check-entrada` | Registrar entrada física (vigilante) |
| `DELETE` | `/api/salidas/:id` | Eliminar salida |

### Inspecciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/inspecciones` | Listar inspecciones (filtradas por rol) |
| `POST` | `/api/inspecciones` | Crear inspección (multipart, admite fotos) |

### Historial de Uso

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/historial` | Listar historial con JOIN completo |

### Mantenimiento

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/mantenimiento` | Listar mantenimientos |
| `POST` | `/api/mantenimiento` | Registrar mantenimiento |
| `PUT` | `/api/mantenimiento/:id` | Actualizar mantenimiento |
| `DELETE` | `/api/mantenimiento/:id` | Eliminar mantenimiento |

### Requisitos / Documentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/requisitos` | Listar requisitos |
| `POST` | `/api/requisitos` | Crear requisito (multipart, admite PDF) |
| `DELETE` | `/api/requisitos/:id` | Eliminar requisito |

### Tanqueos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/tanqueos` | Listar tanqueos |
| `POST` | `/api/tanqueos` | Registrar tanqueo |
| `DELETE` | `/api/tanqueos/:id` | Eliminar tanqueo |

### Catálogos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/catalogos/marcas` | Listar marcas |
| `GET` | `/api/catalogos/colores` | Listar colores |
| `GET` | `/api/catalogos/tipos-vehiculo` | Listar tipos de vehículo |
| `GET` | `/api/catalogos/dependencias` | Listar dependencias |
| `GET` | `/api/catalogos/tipos-requisito` | Listar tipos de requisito |

### Health check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Estado del servidor |

---

## Scripts disponibles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo (nodemon + ts-node) |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run start` | Ejecuta servidor compilado en producción |
| `npm run db:seed` | Carga datos iniciales (admin + catálogos) |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Construye para producción |
| `npm run preview` | Previsualiza el build localmente |

---

## Consideraciones técnicas

### MySQL 5.0.51b
- Prisma no soporta esta versión → todo el acceso a BD es SQL raw con `mysql2/promise`.
- El pool se recrea automáticamente ante errores `ECONNRESET` (MySQL legacy cierra conexiones inactivas sin previo aviso).
- `timezone: 'local'` en el pool para evitar desfases de hora.

### Relación conductor ↔ usuario
`ctv_conductores.id` ≠ `usuarios.id`. El vínculo es `ctv_conductores.id_usuario = usuarios.id`.  
Al filtrar salidas/inspecciones por conductor logueado se usa subquery:

```sql
id_conductor = (SELECT id FROM ctv_conductores WHERE id_usuario = ? LIMIT 1)
```

Al crear un conductor desde el panel admin, vincular manualmente el campo `id_usuario` con el ID del usuario correspondiente.

### Cron job
El backend ejecuta diariamente a medianoche:

```sql
UPDATE ctv_control_requisitos
SET estado_requisito = 'VENCIDO'
WHERE fecha_vencimiento < NOW() AND estado_requisito = 'VIGENTE'
```

### Archivos subidos
Los archivos (fotos e inspecciones, PDFs de requisitos) se almacenan en `backend/uploads/`.  
Se sirven como estáticos en `/uploads/:filename`.

---

## FAQ

### ¿Cómo crear un usuario nuevo?

1. Iniciar sesión como `ADMIN`
2. Ir a **Usuarios** → **Nuevo usuario**
3. Completar nombre, correo, contraseña y rol
4. Si el rol es `CONDUCTOR`, luego ir a **Conductores** → **Nuevo conductor** y completar el perfil, asignando el `id_usuario` correspondiente

### ¿Cómo registrar una salida de vehículo?

1. El conductor llena la **inspección preoperacional** y obtiene su ID
2. Va a **Solicitar Viaje** y completa el formulario (adjunta ID de inspección)
3. El autorizador aprueba o rechaza desde **Solicitudes Pendientes**
4. El vigilante hace **check-salida** para registrar la hora exacta de partida
5. Al regresar, el vigilante hace **check-entrada**
6. El conductor llena la **inspección postoperacional**

### ¿Por qué no se usa Prisma?

La base de datos MySQL es versión 5.0.51b. Prisma requiere MySQL 5.7+. Se optó por `mysql2/promise` con SQL raw.

### ¿Cómo ver requisitos próximos a vencer?

En el panel **Requisitos**, los documentos vencidos aparecen en rojo y los que vencen en los próximos 30 días en amarillo. El CRON nocturno actualiza automáticamente los estados a `VENCIDO`.

### ¿Cómo acceder desde otro equipo de la red?

Levantar el proyecto en el servidor y acceder desde `http://<IP-del-servidor>:5173`. El backend permite el rango `10.1.1.x` por CORS.

### ¿Cómo cambiar el rol de un usuario?

Solo `ADMIN` puede hacerlo:
1. Ir a **Usuarios**
2. Editar el usuario deseado
3. Cambiar el rol en el formulario
