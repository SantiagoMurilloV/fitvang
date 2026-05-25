import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Calendar, Dumbbell, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '@/lib/api';
import { Card, StatCard } from '@/components/shared/Card';

interface Journey {
  inicio: string;
  nombre: string;
  asistencias: number;
  planes: number;
}

interface Milestone {
  label: string;
  achieved: boolean;
  icon: string;
}

function getMilestones(asistencias: number, planes: number): Milestone[] {
  return [
    { label: 'Primera clase', achieved: asistencias >= 1, icon: '🏁' },
    { label: '10 clases completadas', achieved: asistencias >= 10, icon: '💪' },
    { label: '50 clases — ¡Elite!', achieved: asistencias >= 50, icon: '🔥' },
    { label: '100 clases — ¡Leyenda!', achieved: asistencias >= 100, icon: '🏆' },
    { label: 'Primer mes en Fitvang', achieved: planes >= 1, icon: '🌱' },
    { label: '3 meses de constancia', achieved: planes >= 3, icon: '📅' },
    { label: '6 meses — ¡Comprometido!', achieved: planes >= 6, icon: '⚡' },
    { label: '1 año en Fitvang', achieved: planes >= 12, icon: '🎖️' },
  ];
}

function MilestoneSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />
      ))}
    </div>
  );
}

export function JourneyView() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['journey-me'],
    queryFn: () => api.get<Journey>('/stats/me/journey'),
  });

  const milestones = data ? getMilestones(data.asistencias, data.planes) : [];
  const achievedCount = milestones.filter((m) => m.achieved).length;

  const memberSince = data?.inicio
    ? format(parseISO(data.inicio), "MMMM yyyy", { locale: es })
    : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-bold">Mi Recorrido</h1>
        <p className="text-sm text-muted-foreground mt-1">Tu historia en el club Fitvang.</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 rounded-2xl bg-card animate-pulse" />
          <div className="h-28 rounded-2xl bg-card animate-pulse" />
        </div>
      ) : isError ? (
        <Card>
          <p className="text-sm text-muted-foreground">No se pudo cargar tu recorrido. Intenta de nuevo.</p>
        </Card>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <StatCard label="Total clases" value={data!.asistencias} accent />
            <StatCard label="Planes activos" value={data!.planes} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-primary/30 flex items-center gap-4">
              <div className="flex-shrink-0 size-12 rounded-full bg-primary/15 flex items-center justify-center">
                <Calendar className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Miembro desde</p>
                <p className="text-xl font-bold capitalize mt-0.5">{memberSince ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{data!.nombre}</p>
              </div>
            </Card>
          </motion.div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Star className="size-4 text-primary" />
                Logros
              </h2>
              <span className="text-xs text-muted-foreground">{achievedCount}/{milestones.length} conseguidos</span>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone, i) => (
                <motion.div
                  key={milestone.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.25 + i * 0.07 }}
                >
                  <Card
                    className={
                      milestone.achieved
                        ? 'border-primary/40 bg-primary/5'
                        : 'opacity-50'
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{milestone.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${milestone.achieved ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {milestone.label}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {milestone.achieved ? (
                          <CheckCircle2 className="size-5 text-primary" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {achievedCount === milestones.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              <Card className="border-primary/60 bg-gradient-to-br from-primary/10 to-transparent text-center py-6">
                <p className="text-3xl">🏆</p>
                <p className="mt-2 font-bold text-primary">¡Leyenda Fitvang!</p>
                <p className="text-sm text-muted-foreground mt-1">Has completado todos los logros. ¡Eres increíble!</p>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
