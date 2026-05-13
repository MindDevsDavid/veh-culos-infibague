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

- Gestión completa de vehículos con detalle de requisitos por vehículo
- Control de conductores, licencias y alertas de vencimiento
- Bloqueo de acceso a conductores con licencia vencida
- Solicitudes de salida con aprobación por autorizador
- Inspecciones pre y postoperacionales con checklist completo
- Control de mantenimientos preventivos y correctivos con factura PDF adjunta
- Gestión de requisitos legales (SOAT, tecnomecánica, pólizas) con alertas de vencimiento
- Control de tanqueos de combustible con flujo solicitud → autorización almacenista
- Sistema de chips de gasolina con asignación a vehículo
- Control de componentes por vehículo agrupado visualmente
- Catálogos CRUD: marcas, colores, tipos vehículo, tipos requisito, tipos componente, dependencias
- Historial de uso y kilometraje por viaje con detalle de tanqueos
- Carga de fotografías en check de salida/entrada
- Carga de documentos PDF para requisitos y facturas de mantenimiento
- Panel de estadísticas en dashboard con alertas de requisitos y licencias
- Autenticación JWT con refresh tokens (cookies HttpOnly)
- Control de acceso por rol en backend (middleware `allowRoles`) y UI (botones condicionados)
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
| Multer | — | Manejo de archivos (fotos, PDFs en memoria) |
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
| `ADMIN` | Acceso total: vehículos, conductores, mantenimiento, requisitos, chips, tanqueos, salidas, historial, usuarios, inspecciones, catálogos, componentes |
| `AUTORIZADOR` | Aprobar/rechazar solicitudes de salida; lectura de vehículos, conductores, requisitos e historial |
| `ALMACENISTA` | Autorizar tanqueos de combustible |
| `CONDUCTOR` | Crear inspecciones pre/postoperacionales, solicitar viajes, ver sus solicitudes |
| `VIGILANTE` | Check de salida y entrada de vehículos en portería |
| `CONSULTAS` | Solo lectura: viajes en curso, historial, tanqueos |

---

## Flujo de un viaje

```
Conductor llena inspección preoperacional
        ↓
Conductor solicita viaje (la inspección se adjunta automáticamente)
        ↓
Autorizador autoriza o rechaza
        ↓
Vigilante hace check-salida (registra hora exacta de salida + fotos)
        ↓
[Viaje en curso — conductor puede solicitar tanqueo]
        ↓
Almacenista autoriza tanqueo
        ↓
Vigilante hace check-entrada (registra hora exacta de regreso + fotos)
        ↓
Conductor llena inspección postoperacional
        ↓
Conductor registra kilómetro final → viaje COMPLETADO
        ↓
Historial de uso registrado con km inicial/final/recorrido + tanqueos
```

---

## Estructura del proyecto

```
Almacén_vehiculos/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point, CORS, cron de requisitos vencidos
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT authenticate
│   │   │   ├── roles.ts          # allowRoles guard
│   │   │   └── upload.ts         # Multer memoryStorage (fotos + PDFs)
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
│   └── prisma/
│       └── seed.ts               # Seed inicial: admin + catálogos base
│
└── frontend/
    └── src/
        ├── api/                  # Clientes axios por entidad
        ├── components/           # Layout, DataTable, Modal, InspeccionForm, FormField, etc.
        ├── hooks/                # useVehiculos, useConductores, useSalidas, useCatalogos, etc.
        ├── pages/
        │   ├── admin/            # Dashboard, Vehículos, Conductores, Mantenimiento,
        │   │                     # Requisitos, Chips, Componentes, Catálogos, Usuarios,
        │   │                     # Tanqueos, Historial
        │   ├── autorizador/      # Pendientes, Salidas, Vehículos, Conductores,
        │   │                     # Requisitos, Historial
        │   ├── conductor/        # Solicitar, Solicitudes, Inspecciones
        │   ├── vigilante/        # Activos, CheckSalida, CheckEntrada
        │   ├── almacenista/      # Tanqueos pendientes
        │   └── consultas/        # Activos, Historial, Tanqueos
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

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Cuentas de acceso al sistema |
| `ctv_conductores` | Perfil de conductores (vinculado a `usuarios.id` via `id_usuario`) |
| `ctv_vehiculos` | Flota de vehículos |
| `ctv_salidas_vehiculos` | Solicitudes/viajes con estados y fotoss |
| `ctv_inspecciones` | Inspecciones preoperacionales y postoperacionales |
| `ctv_historial_uso` | Registro de km por viaje |
| `ctv_control_requisitos` | Documentos vencibles por vehículo |
| `ctv_mantenimientos` | Registros de taller |
| `ctv_chips_gasolina` | Chips de gasolina asignables a vehículos |
| `ctv_control_componentes` | Componentes asignados a vehículos |
| `ctv_control_tanqueo` | Solicitudes de tanqueo por conductor |
| `ctv_fotos_salida_entrada` | Fotos de check salida/entrada |
| `ctv_pdfs` | Archivos PDF generales (requisitos, facturas) — almacenados como BLOB |

**Catálogos:**

| Tabla | Descripción |
|-------|-------------|
| `ctv_marcas` | Marcas de vehículos |
| `ctv_colores` | Colores |
| `ctv_tipos_vehiculo` | Tipos de vehículo |
| `ctv_tipos_requisito` | Tipos de documento/requisito |
| `ctv_tipos_componente` | Tipos de componente con nombre y descripción |
| `ctv_dependencias` | Dependencias organizacionales |

**Restricciones UNIQUE relevantes:**

```sql
-- Chips: número único
ALTER TABLE ctv_chips_gasolina ADD UNIQUE (numero_chip);

-- Requisitos: mismo tipo no puede tener mismo número
ALTER TABLE ctv_control_requisitos ADD UNIQUE (id_tipo_requisito, numero_requisito);

-- Catálogos: no duplicar descripciones
ALTER TABLE ctv_marcas ADD UNIQUE (descripcion);
ALTER TABLE ctv_colores ADD UNIQUE (descripcion);
ALTER TABLE ctv_tipos_vehiculo ADD UNIQUE (descripcion);
ALTER TABLE ctv_tipos_requisito ADD UNIQUE (descripcion);
ALTER TABLE ctv_dependencias ADD UNIQUE (descripcion);
ALTER TABLE ctv_tipos_componente ADD UNIQUE (nombre_componente);
```

**Columnas adicionales requeridas:**

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

Crea el usuario administrador `admin@infibague.gov.co` / `Admin123!` y los catálogos base (marcas, colores, tipos de vehículo, dependencias, tipos de componente, tipos de requisito).

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
El proxy de Vite redirige `/api` automáticamente a `localhost:3001`.

---

## Acceso desde red local LAN

Backend escucha en `0.0.0.0:3001`. Vite también expone el frontend en `0.0.0.0`.  
CORS permite el rango `10.1.1.x` y `localhost`.

Desde otro equipo de la red interna: `http://<IP-del-servidor>:5173`

---

## API Endpoints

### Autenticación

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `POST` | `/api/auth/login` | — | Iniciar sesión |
| `POST` | `/api/auth/logout` | — | Cerrar sesión |
| `POST` | `/api/auth/refresh` | — | Renovar access token |
| `GET` | `/api/auth/me` | todos | Obtener usuario actual |

### Vehículos

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/vehiculos` | todos | Listar vehículos |
| `GET` | `/api/vehiculos/:id` | todos | Obtener vehículo por ID |
| `POST` | `/api/vehiculos` | ADMIN | Crear vehículo |
| `PUT` | `/api/vehiculos/:id` | ADMIN | Actualizar vehículo |
| `DELETE` | `/api/vehiculos/:id` | ADMIN | Eliminar vehículo |

### Conductores

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/conductores` | ADMIN, AUTORIZADOR | Listar conductores |
| `GET` | `/api/conductores/:id` | ADMIN, AUTORIZADOR | Obtener conductor |
| `POST` | `/api/conductores` | ADMIN | Crear conductor (crea usuario automáticamente) |
| `PUT` | `/api/conductores/:id` | ADMIN | Actualizar conductor |
| `DELETE` | `/api/conductores/:id` | ADMIN | Eliminar conductor |

### Salidas de Vehículos

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/salidas` | todos | Listar salidas (filtradas por rol) |
| `GET` | `/api/salidas/:id` | todos | Obtener salida por ID |
| `POST` | `/api/salidas` | CONDUCTOR | Crear solicitud de salida |
| `PUT` | `/api/salidas/:id/autorizar` | AUTORIZADOR | Autorizar salida |
| `PUT` | `/api/salidas/:id/rechazar` | AUTORIZADOR | Rechazar salida |
| `PUT` | `/api/salidas/:id/check-salida` | VIGILANTE | Registrar salida física |
| `PUT` | `/api/salidas/:id/check-entrada` | VIGILANTE | Registrar entrada física |
| `DELETE` | `/api/salidas/:id` | ADMIN | Eliminar salida |

### Inspecciones

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/inspecciones` | todos | Listar inspecciones (filtradas por rol) |
| `POST` | `/api/inspecciones` | CONDUCTOR | Crear inspección (multipart, admite fotos) |

### Historial de Uso

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/historial` | ADMIN, AUTORIZADOR, CONSULTAS | Listar historial con JOIN completo |
| `GET` | `/api/historial/:id` | ADMIN, AUTORIZADOR, CONSULTAS | Detalle de viaje con tanqueos |

### Mantenimiento

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/mantenimiento` | ADMIN, AUTORIZADOR | Listar mantenimientos |
| `GET` | `/api/mantenimiento/:id` | ADMIN, AUTORIZADOR | Obtener mantenimiento |
| `POST` | `/api/mantenimiento` | ADMIN | Registrar mantenimiento (multipart, admite PDF factura) |
| `PUT` | `/api/mantenimiento/:id` | ADMIN | Actualizar mantenimiento (multipart, admite PDF factura) |
| `GET` | `/api/mantenimiento/:id/archivo` | ADMIN, AUTORIZADOR | Descargar factura PDF |
| `DELETE` | `/api/mantenimiento/:id` | ADMIN | Eliminar mantenimiento |

### Requisitos / Documentos

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/requisitos` | ADMIN, AUTORIZADOR | Listar requisitos |
| `GET` | `/api/requisitos/:id` | ADMIN, AUTORIZADOR | Obtener requisito |
| `POST` | `/api/requisitos` | ADMIN | Crear requisito (multipart, admite PDF) |
| `PUT` | `/api/requisitos/:id` | ADMIN | Actualizar requisito |
| `GET` | `/api/requisitos/:id/archivo` | ADMIN, AUTORIZADOR | Descargar PDF del requisito |
| `DELETE` | `/api/requisitos/:id` | ADMIN | Eliminar requisito |

### Tanqueos

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/tanqueos` | ADMIN, ALMACENISTA, CONSULTAS | Listar tanqueos |
| `POST` | `/api/tanqueos` | CONDUCTOR, ADMIN | Registrar solicitud de tanqueo |
| `PUT` | `/api/tanqueos/:id/autorizar` | ALMACENISTA | Autorizar tanqueo |
| `DELETE` | `/api/tanqueos/:id` | ADMIN | Eliminar tanqueo |

### Chips de Gasolina

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/chips` | ADMIN | Listar chips |
| `POST` | `/api/chips` | ADMIN | Crear chip |
| `PUT` | `/api/chips/:id` | ADMIN | Actualizar chip |
| `DELETE` | `/api/chips/:id` | ADMIN | Eliminar chip |

### Componentes

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/componentes` | ADMIN | Listar componentes asignados (con vehículo y tipo) |
| `POST` | `/api/componentes` | ADMIN | Asignar componente a vehículo |
| `DELETE` | `/api/componentes/:id` | ADMIN | Desasignar componente |

### Catálogos

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET/POST` | `/api/catalogos/marcas` | ADMIN | Marcas |
| `PUT/DELETE` | `/api/catalogos/marcas/:id` | ADMIN | Editar/eliminar marca |
| `GET/POST` | `/api/catalogos/colores` | ADMIN | Colores |
| `PUT/DELETE` | `/api/catalogos/colores/:id` | ADMIN | Editar/eliminar color |
| `GET/POST` | `/api/catalogos/tipos-vehiculo` | ADMIN | Tipos de vehículo |
| `PUT/DELETE` | `/api/catalogos/tipos-vehiculo/:id` | ADMIN | Editar/eliminar tipo |
| `GET/POST` | `/api/catalogos/tipos-requisito` | todos | Tipos de requisito |
| `PUT/DELETE` | `/api/catalogos/tipos-requisito/:id` | ADMIN | Editar/eliminar tipo |
| `GET/POST` | `/api/catalogos/tipos-componente` | ADMIN | Tipos de componente |
| `PUT/DELETE` | `/api/catalogos/tipos-componente/:id` | ADMIN | Editar/eliminar tipo |
| `GET/POST` | `/api/catalogos/dependencias` | ADMIN | Dependencias |
| `PUT/DELETE` | `/api/catalogos/dependencias/:id` | ADMIN | Editar/eliminar dependencia |

### Usuarios

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| `GET` | `/api/usuarios` | ADMIN | Listar usuarios |
| `POST` | `/api/usuarios` | ADMIN | Crear usuario |
| `PUT` | `/api/usuarios/:id` | ADMIN | Actualizar usuario |
| `DELETE` | `/api/usuarios/:id` | ADMIN | Eliminar usuario |

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

### Almacenamiento de PDFs
PDFs (requisitos, facturas de mantenimiento) se almacenan como BLOB en la tabla `ctv_pdfs` con la estructura `(nombre_tabla, id_tabla, nombre_archivo, contenido)`. Se requiere `SET SESSION max_allowed_packet = 67108864` antes de cada INSERT para soportar archivos de hasta 64 MB.

### Relación conductor ↔ usuario
`ctv_conductores.id` ≠ `usuarios.id`. El vínculo es `ctv_conductores.id_usuario = usuarios.id`.  
Al crear un conductor desde el panel admin, el sistema crea automáticamente el usuario vinculado.  
Al filtrar salidas/inspecciones por conductor logueado se usa subquery:

```sql
id_conductor = (SELECT id FROM ctv_conductores WHERE id_usuario = ? LIMIT 1)
```

### Cron job
El backend ejecuta diariamente a medianoche:

```sql
UPDATE ctv_control_requisitos
SET estado_requisito = 'VENCIDO'
WHERE fecha_vencimiento < NOW() AND estado_requisito = 'VIGENTE'
```

### Bloqueo por licencia vencida
Si un conductor intenta iniciar sesión con la licencia vencida, el backend devuelve `403` con `{ licencia_vencida: true, fecha_vencimiento }`. El frontend muestra una pantalla de bloqueo en lugar del dashboard.

### Control de acceso por rol
- **Backend**: middleware `allowRoles(...roles)` en cada ruta.
- **Frontend**: hook `useAuth()` expone `user.rol`; los botones de escritura se renderizan condicionalmente con `{isAdmin && <button>}`.

### Restricciones de unicidad
Las siguientes restricciones UNIQUE previenen duplicados en base de datos; el backend captura `ER_DUP_ENTRY` y devuelve `400` con mensaje descriptivo:
- `ctv_vehiculos.placa_vehiculo`
- `ctv_conductores.cedula`
- `ctv_chips_gasolina.numero_chip`
- `ctv_control_requisitos (id_tipo_requisito, numero_requisito)` — compuesta
- Todos los catálogos: `descripcion` / `nombre_componente`

---

## FAQ

### ¿Cómo crear un usuario nuevo?

1. Iniciar sesión como `ADMIN`
2. Ir a **Usuarios** → **Nuevo usuario**
3. Completar nombre, correo, contraseña y rol
4. Si el rol es `CONDUCTOR`, ir a **Conductores** → **Nuevo conductor** y completar el perfil (el usuario se vincula automáticamente)

### ¿Cómo registrar una salida de vehículo?

1. El conductor llena la **inspección preoperacional**
2. El conductor hace clic en **Solicitar Viaje** — el sistema adjunta automáticamente el ID de inspección más reciente
3. El autorizador aprueba o rechaza desde **Solicitudes Pendientes**
4. El vigilante hace **check-salida** para registrar la hora exacta de partida
5. Al regresar, el vigilante hace **check-entrada**
6. El conductor llena la **inspección postoperacional** y registra el kilómetro final

### ¿Por qué no se usa Prisma?

La base de datos MySQL es versión 5.0.51b. Prisma requiere MySQL 5.7+. Se optó por `mysql2/promise` con SQL raw.

### ¿Cómo ver requisitos próximos a vencer?

En el panel **Requisitos**, los documentos vencidos aparecen en rojo y los que vencen en los próximos 30 días en amarillo. El dashboard muestra banners de alerta. El cron nocturno actualiza automáticamente los estados a `VENCIDO`.

### ¿Cómo adjuntar una factura a un mantenimiento?

En **Mantenimiento** → **Nuevo mantenimiento** o al editar uno existente, hay un campo "Factura PDF" para subir el archivo. Al guardar, el PDF queda vinculado al registro. El botón de enlace en la tabla abre el PDF en una nueva pestaña.

### ¿Cómo acceder desde otro equipo de la red?

Levantar el proyecto en el servidor y acceder desde `http://<IP-del-servidor>:5173`. El backend permite el rango `10.1.1.x` por CORS.

### ¿Cómo cambiar el rol de un usuario?

Solo `ADMIN` puede hacerlo:
1. Ir a **Usuarios**
2. Editar el usuario deseado
3. Cambiar el rol en el formulario
