import { Hono } from 'hono';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { db } from '../db/client';
import {
  users,
  bookings,
  payments,
  userPlans,
  classSessions,
} from '../db/schema';
import { requireAuth } from '../middleware/jwt';
import { requireAdmin } from '../middleware/rbac';
import { computeUserScoring } from '../services/scoring.service';

export const statsRouter = new Hono();
statsRouter.use('*', requireAuth);

// Mi scoring
statsRouter.get('/me/scoring', async (c) => {
  const me = c.get('user');
  const mes = c.req.query('mes');
  const data = await computeUserScoring(me.sub, mes);
  return c.json(data);
});

// Mi recorrido (timeline)
statsRouter.get('/me/journey', async (c) => {
  const me = c.get('user');
  const userRow = await db.select({ createdAt: users.createdAt, nombre: users.nombreCompleto }).from(users).where(eq(users.id, me.sub)).limit(1);
  const totalAsistencias = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(eq(bookings.userId, me.sub), eq(bookings.estado, 'asistio')));
  const planes = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userPlans)
    .where(eq(userPlans.userId, me.sub));
  return c.json({
    inicio: userRow[0]?.createdAt ?? null,
    nombre: userRow[0]?.nombre ?? null,
    asistencias: totalAsistencias[0]?.n ?? 0,
    planes: planes[0]?.n ?? 0,
  });
});

// Dashboard admin KPIs
statsRouter.get('/admin/overview', requireAdmin, async (c) => {
  const now = new Date();
  const inicioMes = format(startOfMonth(now), 'yyyy-MM-dd');
  const finMes = format(endOfMonth(now), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');

  const activos = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(and(eq(users.activo, true), eq(users.rol, 'user')));
  const planesActivos = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userPlans)
    .where(eq(userPlans.estado, 'activo'));
  const ingresosMes = await db
    .select({ total: sql<number>`COALESCE(SUM(${payments.montoCop}), 0)::bigint` })
    .from(payments)
    .where(and(eq(payments.estado, 'exitoso'), gte(payments.createdAt, new Date(inicioMes)), lte(payments.createdAt, new Date(finMes + 'T23:59:59'))));
  const clasesHoy = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(classSessions)
    .where(and(eq(classSessions.fecha, today), eq(classSessions.estado, 'programada')));

  return c.json({
    usuariosActivos: activos[0]?.n ?? 0,
    planesActivos: planesActivos[0]?.n ?? 0,
    ingresosMesCop: Number(ingresosMes[0]?.total ?? 0),
    clasesHoy: clasesHoy[0]?.n ?? 0,
  });
});
