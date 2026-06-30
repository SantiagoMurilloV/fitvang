import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Sprout, Medal, Flame, Zap, Crown, Check, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatCop } from '@/lib/utils';
import { useAuth } from '@/lib/auth-store';

interface MyPlan {
  plan: null | {
    id: string;
    planNombre: string;
    modalidad: string;
    trainingNombre: string;
    fechaInicio: string;
    fechaFin: string;
    sesionesTotales: number | null;
    sesionesUsadas: number;
    precioCopAplicado: number;
    accesoMulti: boolean;
  };
}

interface Scoring {
  mes: string;
  totalSesiones: number;
  asistencias: number;
  porcentaje: number;
  rachaActual: number;
  rachaMaxima: number;
  nivel: 'rookie' | 'regular' | 'constante' | 'elite' | 'leyenda';
}

interface Booking {
  sessionId: string;
  estado: string;
  fecha?: string;
  nombre?: string;
  horaInicio?: string;
  horaFin?: string;
  trainingColor?: string;
}

const NIVEL_LABEL: Record<string, string> = {
  rookie: 'Rookie',
  regular: 'Regular',
  constante: 'Constante',
  elite: 'Elite',
  leyenda: 'Leyenda',
};

const NIVEL_ICON: Record<string, { Icon: LucideIcon; color: string }> = {
  rookie: { Icon: Sprout, color: '#4ade80' },
  regular: { Icon: Medal, color: '#3DC4DB' },
  constante: { Icon: Flame, color: '#facc15' },
  elite: { Icon: Zap, color: '#f87171' },
  leyenda: { Icon: Crown, color: '#fbbf24' },
};

function todaySpanish(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function UserDashboard() {
  const user = useAuth((s) => s.user);
  const firstName = user?.nombre?.split(' ')[0] ?? 'Atleta';

  const plan = useQuery({
    queryKey: ['plan-me'],
    queryFn: () => api.get<MyPlan>('/plans/me'),
  });
  const scoring = useQuery({
    queryKey: ['scoring-me'],
    queryFn: () => api.get<Scoring>('/stats/me/scoring'),
  });
  const bookings = useQuery({
    queryKey: ['bookings-me'],
    queryFn: () => api.get<{ bookings: Booking[] }>('/bookings/me'),
  });

  const p = plan.data?.plan;
  const diasRestantes = p
    ? Math.max(0, Math.ceil((new Date(p.fechaFin).getTime() - Date.now()) / 86400000))
    : 0;
  // Duración real del plan (fechaFin - fechaInicio), no 30 días fijos.
  const totalDays = p
    ? Math.max(1, Math.round((new Date(p.fechaFin).getTime() - new Date(p.fechaInicio).getTime()) / 86400000))
    : 1;
  const daysUsed = Math.max(0, totalDays - diasRestantes);
  const progressPct = Math.min(100, Math.round((daysUsed / totalDays) * 100));

  const sc = scoring.data;
  const nivel = sc?.nivel ?? 'rookie';

  const upcoming = (bookings.data?.bookings ?? [])
    .filter((b) => b.estado === 'activa')
    .slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold">Hola, {firstName}</h1>
        <p className="text-sm text-muted-foreground capitalize">{todaySpanish()}</p>
      </div>

      {/* Hero Plan Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {plan.isLoading ? (
          <div className="rounded-2xl bg-card border border-border p-5 animate-pulse space-y-3">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-7 w-48 bg-white/10 rounded" />
            <div className="h-2 w-full bg-white/10 rounded-full" />
          </div>
        ) : !p ? (
          <Card className="border-border text-center py-8 space-y-3">
            <p className="text-muted-foreground text-sm">No tienes un plan activo</p>
            <Button size="sm" onClick={() => (window.location.href = '/app/pagos')}>
              Ver planes
            </Button>
          </Card>
        ) : (
          <Card className="border-l-4 border-l-primary border-border">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">{p.planNombre}</h2>
                <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {p.trainingNombre}
                </span>
              </div>
              {diasRestantes <= 5 && (
                <a
                  href="/app/pagos"
                  className="shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition"
                >
                  Renueva
                </a>
              )}
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{diasRestantes} días restantes</span>
                <span>Hasta {new Date(p.fechaFin).toLocaleDateString('es-CO')}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center text-center"
        >
          <p className="text-2xl font-bold flex items-center justify-center gap-1">
            {sc?.rachaActual ?? 0}
            {(sc?.rachaActual ?? 0) > 5 && <Flame className="size-5 text-orange-400" />}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">días racha</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center text-center"
        >
          <p className="text-2xl font-bold">{sc?.porcentaje ?? 0}%</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">este mes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center text-center"
        >
          {(() => {
            const N = NIVEL_ICON[nivel];
            const Icon = N.Icon;
            return <Icon className="size-6" style={{ color: N.color }} />;
          })()}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
            {NIVEL_LABEL[nivel]}
          </p>
        </motion.div>
      </div>

      {/* Upcoming Classes */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Próximas clases</h2>
          <a href="/app/horarios" className="text-xs text-primary hover:underline">
            Ver horarios
          </a>
        </div>

        {bookings.isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse flex gap-3">
                <div className="w-1 h-12 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded" />
                  <div className="h-3 w-20 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No tienes clases reservadas</p>
            <a
              href="/app/horarios"
              className="inline-block text-xs font-semibold text-primary hover:underline"
            >
              Reservar clase
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div
                key={b.sessionId}
                className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3"
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: b.trainingColor ?? '#3DC4DB' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.nombre ?? 'Clase reservada'}</p>
                  {b.fecha && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.fecha + 'T12:00').toLocaleDateString('es-CO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      {b.horaInicio ? ` · ${b.horaInicio.slice(0, 5)}` : ''}
                      {b.horaFin ? ` – ${b.horaFin.slice(0, 5)}` : ''}
                    </p>
                  )}
                </div>
                <Check className="size-4 text-primary shrink-0" />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
