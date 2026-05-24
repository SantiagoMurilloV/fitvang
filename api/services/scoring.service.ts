import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { db } from '../db/client';
import { bookings, attendances, classSessions, attendanceScoring } from '../db/schema';

type Nivel = 'rookie' | 'regular' | 'constante' | 'elite' | 'leyenda';

function nivelFromPct(pct: number): Nivel {
  if (pct >= 95) return 'leyenda';
  if (pct >= 80) return 'elite';
  if (pct >= 60) return 'constante';
  if (pct >= 40) return 'regular';
  return 'rookie';
}

export interface UserScoring {
  mes: string;
  totalSesiones: number;
  asistencias: number;
  porcentaje: number;
  rachaActual: number;
  rachaMaxima: number;
  nivel: Nivel;
}

/**
 * Calcula el scoring del usuario para el mes actual al vuelo.
 * No se almacena en caché — se materializa solo cuando el cron lo persiste.
 */
export async function computeUserScoring(userId: string, mes?: string): Promise<UserScoring> {
  const ref = mes ? new Date(mes + '-01') : new Date();
  const ini = format(startOfMonth(ref), 'yyyy-MM-dd');
  const fin = format(endOfMonth(ref), 'yyyy-MM-dd');
  const mesStr = format(ref, 'yyyy-MM');

  const rows = await db
    .select({
      fecha: classSessions.fecha,
      presente: attendances.presente,
    })
    .from(bookings)
    .innerJoin(classSessions, eq(bookings.sessionId, classSessions.id))
    .leftJoin(attendances, eq(attendances.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.userId, userId),
        gte(classSessions.fecha, ini),
        lte(classSessions.fecha, fin),
      ),
    );

  const totalSesiones = rows.length;
  const asistencias = rows.filter((r) => r.presente === true).length;
  const porcentaje = totalSesiones === 0 ? 0 : Math.round((asistencias / totalSesiones) * 100);

  // Racha: días consecutivos con al menos una asistencia, hacia atrás desde hoy.
  const presentDays = new Set(rows.filter((r) => r.presente).map((r) => r.fecha));
  let rachaActual = 0;
  let cursor = new Date();
  while (presentDays.has(format(cursor, 'yyyy-MM-dd'))) {
    rachaActual++;
    cursor = subDays(cursor, 1);
  }

  // Racha máxima histórica del mes: máxima ventana consecutiva en el mes.
  const sortedDates = Array.from(presentDays).sort();
  let rachaMaxima = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sortedDates) {
    const dt = new Date(d);
    if (prev && format(addDays(prev, 1), 'yyyy-MM-dd') === d) {
      run++;
    } else {
      run = 1;
    }
    if (run > rachaMaxima) rachaMaxima = run;
    prev = dt;
  }

  return {
    mes: mesStr,
    totalSesiones,
    asistencias,
    porcentaje,
    rachaActual,
    rachaMaxima,
    nivel: nivelFromPct(porcentaje),
  };
}

/**
 * Persiste el scoring computed en `attendance_scoring`.
 */
export async function persistScoring(userId: string): Promise<UserScoring> {
  const s = await computeUserScoring(userId);
  await db
    .insert(attendanceScoring)
    .values({ userId, ...s })
    .onConflictDoUpdate({
      target: [attendanceScoring.userId, attendanceScoring.mes],
      set: {
        totalSesiones: s.totalSesiones,
        asistencias: s.asistencias,
        porcentaje: s.porcentaje,
        rachaActual: s.rachaActual,
        rachaMaxima: s.rachaMaxima,
        nivel: s.nivel,
        updatedAt: new Date(),
      },
    });
  return s;
}

// Silence unused import warning
void sql;
