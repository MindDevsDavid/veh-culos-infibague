# CHANGELOG — CTV Sistema de Gestión Vehicular

Registro de cambios por sesión de desarrollo. Orden: más reciente primero.

---

## [Sin commit] — 2026-05-19

### Mantenimiento — impresión historial oficial por vehículo
- `frontend/src/pages/admin/Mantenimiento.tsx` — botón `Printer` en header de cada acordeón de vehículo
- `generarHistorialPDF(placa, linea, items)` — genera PDF con el formato oficial INFIbagué: encabezado 3 columnas (logo / título institución + "FORMATO DE HISTORIAL" / Versión-Código-Vigencia), tabla `jspdf-autotable` con columnas FECHA / TIPO / DESCRIPCIÓN / FIRMA RESPONSABLE, filas vacías hasta mínimo 20, pie de página con dirección/teléfono/web
- `frontend/package.json` — añadida dependencia `jspdf-autotable ^5.0.8`

### Mantenimiento — vistas duales
- `frontend/src/pages/admin/Mantenimiento.tsx` — dos vistas con tabs: "Historial" (DataTable existente) y "Por vehículo" (acordeón agrupado por vehículo)
- `VehiculoMantenimientos` component: muestra placa, línea, badge "X en taller", count registros; despliega lista con tipo badge, descripción, fechas, estado
- `MantenimientoActions` extraído como componente reutilizable entre ambas vistas
- Header actualizado: muestra count de vehículos con mantenimientos

---

## [048d3b1] — 2026-05-18 — docs(readme): actualización completa

- `README.md` reescrito: roles actualizados (ALMACENISTA, permisos correctos AUTORIZADOR/CONSULTAS), tablas BD corregidas, UNIQUE constraints documentados, endpoints completos con roles, consideraciones técnicas (PDF BLOB, bloqueo licencia, unicidad), FAQ ampliado

---

## [0f408e3] — feat(integridad,componentes,mantenimiento)

### Integridad — UNIQUE constraints
- `ctv_chips_gasolina.numero_chip` — UNIQUE, backend captura `ER_DUP_ENTRY` → 400
- `ctv_control_requisitos (id_tipo_requisito, numero_requisito)` — UNIQUE compuesta; mismo número solo puede repetirse entre tipos distintos
- Catálogos: UNIQUE en `descripcion` para marcas, colores, tipos_vehiculo, tipos_requisito, dependencias; UNIQUE en `nombre_componente` para tipos_componente
- Patrón uniforme: try/catch en POST y PUT de cada ruta → mensaje descriptivo al usuario

### Catálogo Tipos Componente (nuevo)
- `backend/src/routes/catalogos.ts` — router `/catalogos/tipos-componente` con CRUD completo; campos `nombre_componente` + `descripcion_componente`
- `frontend/src/api/catalogos.ts` — interface `TipoComponente`, endpoint `tiposComponente`
- `frontend/src/hooks/useCatalogos.ts` — hook `useTiposComponente`
- `frontend/src/pages/admin/Catalogos.tsx` — tab "Tipos Componente" con formulario de 2 campos

### Componentes — rediseño
- `backend/src/routes/componentes.ts` — reescrito: SELECT con JOIN a `ctv_tipos_componente` y `ctv_vehiculos`; POST usa `id_tipo_componente`
- `frontend/src/pages/admin/Componentes.tsx` — reescrito: acordeón `VehiculoComponentes` agrupado por vehículo; formulario solo `id_vehiculo` + `id_tipo_componente`

### Mantenimiento — PDF factura
- `backend/src/routes/mantenimiento.ts` — POST y PUT usan `uploadPdf.single('archivo')`; PDF guardado en `ctv_pdfs` via `transaction()`; nuevo endpoint `GET /:id/archivo` devuelve blob
- `frontend/src/api/mantenimiento.ts` — `create`/`update` aceptan `FormData`; `archivoUrl(id)` añadido
- `frontend/src/pages/admin/Mantenimiento.tsx` — campo file input en formulario; botón ExternalLink para abrir PDF en nueva pestaña

---

## [7f330d6] — fix(roles,conductor)

### Permisos por rol
- `backend/src/routes/requisitos.ts` — GET `/` y GET `/:id` permiten `AUTORIZADOR`
- `frontend/src/pages/admin/Requisitos.tsx` — botones crear/eliminar tipo y eliminar documento condicionados a `isAdmin`
- `frontend/src/pages/admin/Tanqueos.tsx` — `CONSULTAS` puede ver; botones crear/eliminar condicionados a `isAdmin`/`isAlmacenista`
- `frontend/src/components/Layout.tsx` — nav AUTORIZADOR incluye "Requisitos"; nav CONSULTAS incluye "Tanqueos"

### UX Conductor
- `frontend/src/components/Layout.tsx` — link "Solicitar Viaje" en sidebar construye URL con `?inspeccion=ID` del último preoperacional pendiente automáticamente (useQuery `preop-pendiente`)
- `backend/src/routes/inspecciones.ts` — separación `fechaHoy` / `horaAhora` al insertar; ya no se guarda `new Date()` en columna hora
- `frontend/src/pages/conductor/MisInspecciones.tsx` — display hora corregido: detecta si viene como datetime y extrae solo HH:MM

---

## [b2595f6] — feat(admin): unique constraints, vehicle/conductor detail, catalogos CRUD, bug fixes

### UNIQUE constraints
- `ctv_vehiculos.placa_vehiculo` — UNIQUE; backend captura `ER_DUP_ENTRY` → 400
- `ctv_conductores.cedula` — UNIQUE; backend captura `ER_DUP_ENTRY` → 400

### Detalle vehículo
- `frontend/src/pages/admin/Vehiculos.tsx` — botón ojo abre modal de detalle con info del vehículo y tabla de requisitos con colores de vencimiento (rojo <0 días, amarillo ≤30)
- `frontend/src/types/index.ts` — `Vehiculo` interface incluye `requisitos?: ControlRequisito[]`

### Catálogos CRUD
- `frontend/src/pages/admin/Catalogos.tsx` — nueva página con 6 tabs: Marcas, Colores, Tipos Vehículo, Tipos Requisito, Tipos Componente, Dependencias; `CatalogoSection` genérico con flags `isComp`/`isDep`
- `frontend/src/components/Layout.tsx` — nav ADMIN incluye "Catálogos"

### Bug fixes
- `frontend/src/pages/admin/Dashboard.tsx` — `<a href>` → `<Link to>` (React Router); hard navigation destruía auth state
- `frontend/src/pages/admin/Requisitos.tsx` — clave cache `['tiposRequisito']` (era `['tipos-requisito']`); fix invalidación al crear tipo

---

## [cc592df] — feat(chips): rename to Chip Gasolina, add vehicle assignment and dual status

- Entidad renombrada de "chip GPS" a "Chip Gasolina" en UI y BD
- Asignación de chip a vehículo desde el formulario
- Estado dual automático: `INSTALADO` si tiene vehículo asignado, `NO_INSTALADO` si no; `VENCIDO` por fecha
- Badge de estado en tabla

---

## [5e63919] — feat(conductores,auth): block expired license login + expiry alerts + fix stale pool bug

### Bloqueo licencia vencida
- `backend/src/routes/auth.ts` — login devuelve `403 { licencia_vencida: true, fecha_vencimiento }` si conductor con licencia vencida intenta entrar
- `frontend/src/pages/Login.tsx` / layout conductor — pantalla de bloqueo roja con fecha de vencimiento; sin acceso al dashboard

### Alertas de vencimiento
- Dashboard ADMIN y AUTORIZADOR — banner ROJO si hay licencias vencidas, AMARILLO si vencen en ≤30 días
- Panel Conductores — filas con color por estado de licencia

### Bug fix pool
- `backend/src/utils/db.ts` — recreación automática del pool ante `ECONNRESET` (MySQL 5.x cierra conexiones inactivas)

---

## [5d44ae6] — feat(tanqueos): conductor requests, almacenista authorization, and historial detail

### Tanqueos
- Flujo completo: CONDUCTOR solicita → ALMACENISTA autoriza → estado `AUTORIZADA`
- `backend/src/routes/tanqueos.ts` — rutas con `allowRoles` por acción
- `frontend/src/pages/almacenista/` — vista de tanqueos pendientes con botón autorizar
- `frontend/src/pages/conductor/` — formulario solicitud tanqueo durante viaje activo

### Historial detalle
- `backend/src/routes/historial.ts` — `GET /:id` devuelve viaje con tanqueos relacionados
- `frontend/src/pages/admin/Historial.tsx` — modal de detalle con sección tanqueos

---

## [0904fae] — feat(inspecciones,salidas): bind pre/post-op inspections to trip + enforce single active trip

- Preoperacional vinculada al viaje via `id_inspeccion_pre`
- Postoperacional vinculada al viaje via `id_inspeccion_post`
- Conductor no puede solicitar viaje si ya tiene uno activo (PENDIENTE/AUTORIZADA/EN_CURSO)
- Validación en backend: verifica estado antes de crear solicitud

---

## [79409cf] — feat(inspecciones): enforce postop completion and vehicle availability rules

- Postoperacional obligatoria antes de completar viaje
- Vehículo pasa a `EN_MANTENIMIENTO` al registrar mantenimiento; vuelve a `ACTIVO` al registrar fecha_salida
- Vehículo `EN_MANTENIMIENTO` no disponible para nuevas solicitudes

---

## [836522f] — feat(conductor,dashboard): enforce preop inspection flow + richer fleet view

- Conductor bloqueado en "Solicitar Viaje" si no tiene preoperacional reciente
- Dashboard admin: KPIs (vehículos activos, salidas del día, conductores, requisitos vencidos)
- Vista flota enriquecida con estado y alertas

---

## [5440def] — feat(auth,conductores): session-only auth + auto-create user on conductor creation

- JWT access token + refresh token en cookies HttpOnly
- Al crear conductor desde admin, se crea usuario vinculado automáticamente (`id_usuario`)
- Roles: ADMIN, AUTORIZADOR, CONDUCTOR, VIGILANTE, ALMACENISTA, CONSULTAS

---

## [ab6dc57] — feat(ui): make all views responsive + update README

- Todas las vistas adaptadas a mobile/tablet con grid responsive
- README inicial

---

## [b7f70bc] — feat(frontend): inspecciones/historial detail modals + LAN support

- Modales de detalle para inspecciones y viajes del historial
- CORS ampliado para rango `10.1.1.x`
- Vite expone frontend en `0.0.0.0` para acceso LAN

---

## [a2fd295] — feat(backend): migrate to mysql2/promise with MySQL 5.0.51b support

- Migración de Prisma a `mysql2/promise` (SQL raw) por incompatibilidad con MySQL 5.0.51b
- Pool con `timezone: 'local'` y retry ante desconexiones

---

## [e89bf6f] — first commit

- Estructura inicial del proyecto: Express + React + TypeScript + Tailwind
- Entidades base: vehículos, conductores, salidas, inspecciones
- Autenticación básica
