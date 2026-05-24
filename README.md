# Fitvang

Plataforma del club Fitvang — Cl. 13b #37-86, El Dorado, Cali · [@fitvang10](https://instagram.com/fitvang10).

Gestión interna: usuarios, planes, reservas, asistencias, pagos (Wompi + efectivo) y notificaciones push.

## Stack

- **Astro 4 SSR** + **React** (islands) + **Tailwind v4** + **motion**
- **Hono.js** (backend, montado sobre Astro endpoints serverless)
- **PostgreSQL** + **Drizzle ORM**
- **JWT** (cookies HttpOnly, access 15min + refresh 7d con rotación)
- **Wompi** (pagos COP) · efectivo (registrado por coach/admin)
- **Web Push API** (`web-push` + service worker)
- Deploy en **Vercel**

## Estado

- [x] Schema Drizzle completo (15 tablas + enums + relations + índices)
- [x] Seed con datos reales (precios, horarios L–V, super admin)
- [x] Auth JWT end-to-end (login, logout, refresh con rotación, /me, rate limit)
- [x] Middleware Astro SSR para rutas protegidas `/admin /coach /app`
- [x] Routers Hono: auth, users, plans, classes, bookings, attendance, payments, notifications, stats
- [x] Services: Wompi (intent + webhook firmado), Web Push, scheduler (genera sesiones), scoring
- [x] Lógica completa de reservas (validación de plan/cupos/dobles), lista de espera con promoción automática
- [x] Notificaciones push automáticas (asistencia, pago, bienvenida, plan vence, etc.)
- [x] Frontend: Login + dashboards user/coach/admin con React Query
- [x] Campanita de notificaciones con drawer e historial
- [x] Service Worker push receiver
- [ ] Portar componentes shadcn de `figma-ui/` para look más detallado
- [ ] Cron jobs Vercel (generar sesiones diarias, expirar planes)
- [ ] Forgot password (magic link)

## Arranque local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# Edita .env y pega tu DATABASE_URL (Neon recomendado: https://neon.tech)

# 3. Generar VAPID keys para Web Push
npx web-push generate-vapid-keys
# pega VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en .env

# 4. Generar y aplicar migraciones
npm run db:generate
npm run db:migrate

# 5. Sembrar datos
npm run db:seed
# → super admin: admin@fitvang.com / Fitvang2026!
#   training types, planes (precios reales), 45 class templates

# 6. (Opcional) Generar sesiones para los próximos 30 días
# Inicia el dev y haz POST /api/classes/generate como admin, o agrega un cron Vercel.

# 7. Dev
npm run dev
# → http://localhost:4321
```

## Endpoints principales

| Método | Path | Notas |
|---|---|---|
| `POST` | `/api/auth/login` | `{ email, password }` → setea cookies HttpOnly + redirect según rol |
| `POST` | `/api/auth/logout` | revoca refresh |
| `POST` | `/api/auth/refresh` | rotación de refresh |
| `GET` | `/api/auth/me` | usuario actual |
| `GET/POST/PATCH/DELETE` | `/api/users` | admin CRUD |
| `GET` | `/api/users/:id/menores` | menores a cargo del acudiente |
| `GET` | `/api/plans/types` | catálogo |
| `POST` | `/api/plans/assign` | asignar plan a usuario (admin) |
| `GET` | `/api/plans/me` | plan activo del usuario |
| `GET` | `/api/classes/sessions?from=&to=` | calendario |
| `GET` | `/api/classes/sessions/:id/attendees` | lista para coach |
| `POST` | `/api/classes/generate` | genera sesiones próximas (admin) |
| `POST` | `/api/bookings` | reservar (con lista de espera) |
| `POST` | `/api/bookings/:id/cancel` | cancelar |
| `POST` | `/api/attendance/mark` | marcar asistencia (coach) |
| `POST` | `/api/attendance/bulk` | marcar todos presentes |
| `POST` | `/api/payments/efectivo` | registrar pago efectivo (coach/admin) |
| `POST` | `/api/payments/wompi/intent` | crear intención → checkoutUrl |
| `POST` | `/api/payments/wompi-webhook` | webhook firmado |
| `GET` | `/api/notifications` | historial campanita |
| `POST` | `/api/notifications/subscribe` | registra suscripción push |
| `GET` | `/api/stats/me/scoring` | racha, %, nivel |
| `GET` | `/api/stats/admin/overview` | KPIs |

## Estructura

```
fitvang/
├── api/
│   ├── index.ts                    # Hono app + montaje de routers
│   ├── lib/{env,jwt,password,cookies}.ts
│   ├── middleware/{jwt,rbac}.ts
│   ├── routes/{auth,users,plans,classes,bookings,attendance,payments,notifications,stats}.ts
│   ├── services/{webpush,wompi,scheduler,scoring}.service.ts
│   └── db/{schema,client,migrate,seed}.ts
├── src/
│   ├── middleware.ts               # SSR auth guard (Astro)
│   ├── pages/
│   │   ├── index.astro             # Login
│   │   ├── api/[...path].ts        # Catch-all → Hono
│   │   ├── app/{index,horarios,asistencias,pagos}.astro
│   │   ├── coach/index.astro
│   │   └── admin/{index,usuarios}.astro
│   ├── components/
│   │   ├── entry.tsx               # Switch de vistas por página
│   │   ├── shared/{AppPage,Button,Card,NotificationBell}.tsx
│   │   ├── auth/LoginForm.tsx
│   │   ├── user/{UserDashboard,SchedulePicker,ScoringView,PaymentsView}.tsx
│   │   ├── coach/CoachDashboard.tsx
│   │   └── admin/{AdminDashboard,UsersAdmin}.tsx
│   ├── layouts/RootLayout.astro
│   ├── lib/{api,auth-store,push,query,utils}.ts
│   └── styles/global.css
├── public/sw.js                    # Service Worker push
├── figma-ui/                       # Bundle Figma original preservado
├── astro.config.mjs · drizzle.config.ts · tsconfig.json · .env.example
```

## Reglas de negocio implementadas

- **Acceso a clases**: VIP entra a Funcional y Fútbol (no Kids). Resto solo a su training. Kids solo se inscribe por admin.
- **Cupos**: si está lleno → entra a `waitlist` automáticamente con posición. Al cancelar otro, el primero de la lista se promueve a `bookings` y recibe push.
- **Cancelación**: ventana configurable (default 2h antes). Si cancelas fuera de ventana, la respuesta marca `fueraDeVentana: true` para que el cliente lo refleje.
- **Doble reserva**: bloqueado por unique index `(user_id, session_id)`.
- **Scoring**: % = asistencias/reservas del mes. Racha = días consecutivos hasta hoy. Niveles 🌱 Rookie (0–39) → 🔵 Regular (40–59) → 🟡 Constante (60–79) → 🔴 Elite (80–94) → 🏆 Leyenda (95–100).
- **Pago Wompi**: webhook valida firma `sha256(props + timestamp + WOMPI_EVENT_SECRET)`. Solo entonces activa el plan y dispara push.
- **Bienvenida**: al crear un usuario, se inserta una `notification` de bienvenida que aparecerá en la campanita la primera vez que entre.
- **Planes grupales**: `planGroups` agrupa miembros pareja/amigos. El admin puede asignar a un grupo existente o crear uno nuevo. Cada miembro paga su cuota individualmente.

## Próximos pasos

1. Crear DB en [Neon](https://neon.tech), pegar URL en `.env`, correr migrate + seed
2. Crear cuenta sandbox en [Wompi](https://comercios.wompi.co), pegar keys
3. Generar VAPID con `npx web-push generate-vapid-keys`
4. Deploy a Vercel (`vercel`), configurar env vars del dashboard
5. Configurar un Cron Vercel diario: `POST /api/classes/generate?days=30`
6. Portar componentes shadcn de `figma-ui/src/app/components/ui/` para look refinado

## Credenciales seed por defecto

- **Super admin:** `admin@fitvang.com` / `Fitvang2026!`

Cámbialas en `.env` antes de correr el seed si no las quieres expuestas.

## Licencia

Privado · Fitvang.
