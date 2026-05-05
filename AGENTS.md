# AGENTS.md - Almacén de Vehículos (CTV)

## Project Structure

```
Almacén_vehiculos/
├── backend/           # Express API (port 3001 by default)
│   ├── src/
│   │   ├── routes/   # 14 route modules (auth, vehiculos, salidas, etc.)
│   │   ├── middleware/  # auth.ts, roles.ts, upload.ts
│   │   └── utils/     # jwt.ts, prisma.ts
│   ├── prisma/
│   │   ├── schema.prisma  # Full DB schema (447 lines)
│   │   └── seed.ts   # Initial data
│   └── .env          # DATABASE_URL required
└── frontend/         # React 19 + Vite (port 5173)
    └── src/
        ├── pages/    # Role-based pages under pages/{admin,conductor,autorizador,vigilante,consultas}/
        ├── api/     # Axios API clients
        ├── hooks/   # useVehiculos, useSalidas, useConductores, useCatalogos
        └── context/  # AuthContext.tsx with JWT token management
```

## Commands

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure DATABASE_URL
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:seed       # Load initial data
npm run dev          # Start server (nodemon on port 3001)
```

### Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3001/api" > .env
npm run dev          # Start Vite (port 5173)
npm run build       # Build for production
npm run lint        # Run ESLint
```

### Both
```bash
# Development requires both running
# Backend: http://localhost:3001
# Frontend: http://localhost:5173 (proxied to backend)
```

## Key Technical Details

- **Port mismatch**: Backend defaults to `3001`, not 3000. Check `backend/.env` and `vite.config.ts` proxy.
- **Database required**: MySQL 8.0 must exist before running migrations. Schema has 20+ tables.
- **Role-based routing**: Routes in `App.tsx` protected by roles array. ADMIN has access to all routes.
- **File uploads**: Backend serves `/uploads` statically. Frontend proxy handles it.
- **Cron job**: Runs daily at midnight to mark expired requisitos as VENCIDO.
- **Auth**: JWT with 7-day expiry. Token stored in cookie (credentials: true).
- **Query client**: TanStack Query with 30s staleTime and retry: 1.

## Common Pitfalls

1. **Forgetting DATABASE_URL**: Backend won't start without it. Copy from `.env.example`.
2. **Port conflicts**: If 3001 or 5173 are taken, check both `.env` and `vite.config.ts`.
3. **Prisma not generated**: Run `npm run db:generate` after installing or pulling new schema changes.
4. **CORS issues**: Ensure `FRONTEND_URL` in backend `.env` matches frontend URL exactly.
5. **Missing seed**: New DB needs `npm run db:seed` for initial users (admin/conductor/etc.).

## Database Schema Notes

- Users table linked to Conductor via one-to-one (each user can be a driver)
- SalidaVehiculo has state machine: PENDIENTE → APROBADA → EN_SALIDA → FINALIZADA
- ControlRequisito (SOAT, tecnomecánica, póliza) - auto-expires via cron
- All tables use `modifica_f` (timestamp) and `modifica_u` (user) audit fields

## API Entry Points

All routes prefixed with `/api/`. Key endpoints:
- `POST /api/auth/login` - Returns JWT cookie
- `/api/vehiculos` - CRUD for vehicles
- `/api/salidas` - Vehicle exit requests with approval flow
- `/api/inspecciones` - Pre/post operational checks
- `/api/mantenimiento` - Maintenance records
- `/api/requisitos` - Legal requirements (SOAT, etc.)

## Environment Variables

**Backend (.env)**:
```env
DATABASE_URL="mysql://user:pass@localhost:3306/ctv_db"
JWT_SECRET="your-secret"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:3001/api
```