import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { cn } from '@/lib/utils';

interface SessionRow {
  id: string;
  fecha: string;
  nombre: string;
  trainingSlug: string;
  trainingColor: string;
  horaInicio: string;
  horaFin: string;
  capacidadMax: number;
  ocupados: number;
  estado: string;
}

type FilterKey = 'todos' | 'funcional' | 'futbol' | 'kids';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'funcional', label: 'Funcional' },
  { key: 'futbol', label: 'Fútbol' },
  { key: 'kids', label: 'Kids' },
];

function matchesFilter(s: SessionRow, filter: FilterKey): boolean {
  if (filter === 'todos') return true;
  const slug = s.trainingSlug.toLowerCase();
  const name = s.nombre.toLowerCase();
  if (filter === 'funcional') return slug.includes('funcional') && !slug.includes('futbol') && !name.includes('kids');
  if (filter === 'futbol') return slug.includes('futbol') || name.includes('fútbol') || name.includes('futbol');
  if (filter === 'kids') return slug.includes('kids') || name.includes('kids');
  return true;
}

function formatDayHeader(fecha: string, today: string): string {
  const isToday = fecha === today;
  const date = new Date(fecha + 'T12:00');
  const weekday = date.toLocaleDateString('es-CO', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('es-CO', { month: 'short' });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return isToday ? `HOY · ${cap(weekday)} ${day} ${cap(month)}` : `${cap(weekday)} ${day} ${cap(month)}`;
}

export function SchedulePicker() {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState<FilterKey>('todos');

  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const from = format(monday, 'yyyy-MM-dd');
  const to = format(addDays(monday, 6), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const sessions = useQuery({
    queryKey: ['sessions', from, to],
    queryFn: () => api.get<{ sessions: SessionRow[] }>(`/classes/sessions?from=${from}&to=${to}`),
  });

  const myBookings = useQuery({
    queryKey: ['bookings-me'],
    queryFn: () =>
      api.get<{ bookings: Array<{ sessionId: string; estado: string }> }>('/bookings/me'),
  });

  const reservedSet = new Set(
    (myBookings.data?.bookings ?? [])
      .filter((b) => b.estado === 'activa' || b.estado === 'asistio')
      .map((b) => b.sessionId),
  );

  const reserve = useMutation({
    mutationFn: (sessionId: string) => api.post('/bookings', { sessionId }),
    onSuccess: (_, sessionId) => {
      toast.success('Reservado ✨');
      qc.invalidateQueries({ queryKey: ['bookings-me'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      void sessionId;
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const map: Record<string, string> = {
          sin_plan_activo: 'No tienes plan activo.',
          plan_no_cubre_training: 'Tu plan no cubre este tipo de clase.',
          kids_solo_por_admin: 'Las clases Kids se inscriben con el admin.',
          ya_reservada: 'Ya tienes esta clase reservada.',
          sesion_no_disponible: 'Esta sesión ya no está disponible.',
        };
        toast.error(map[err.data?.error] ?? 'No se pudo reservar.');
      }
    },
  });

  const allSessions = sessions.data?.sessions ?? [];
  const filtered = allSessions.filter((s) => matchesFilter(s, filter));

  const groups: Record<string, SessionRow[]> = {};
  for (const s of filtered) {
    (groups[s.fecha] ??= []).push(s);
  }

  return (
    <div className="space-y-4">
      {/* Header with week nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Horarios</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="size-9 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 h-9 rounded-full border border-border text-xs font-medium hover:border-primary hover:text-primary transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="size-9 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {format(monday, 'd MMM')} – {format(addDays(monday, 6), 'd MMM')}
      </p>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 px-4 h-8 rounded-full text-xs font-medium transition-all',
              filter === f.key
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sessions */}
      <div className="space-y-6">
        {sessions.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse flex gap-3">
                <div className="w-1 h-14 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-white/10 rounded" />
                  <div className="h-3 w-24 bg-white/10 rounded" />
                  <div className="h-1.5 w-full bg-white/10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {Object.entries(groups).length === 0 && !sessions.isLoading && (
          <p className="text-center text-muted-foreground py-12">
            {filter !== 'todos' ? `Sin clases de ${FILTERS.find((f) => f.key === filter)?.label} esta semana.` : 'Sin clases en esta semana.'}
          </p>
        )}

        {Object.entries(groups).map(([fecha, list]) => (
          <div key={fecha}>
            {/* Day header — sticky */}
            <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm py-1 mb-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {formatDayHeader(fecha, today)}
              </p>
            </div>

            <div className="grid gap-2">
              {list.map((s) => {
                const reserved = reservedSet.has(s.id);
                const libres = s.capacidadMax - s.ocupados;
                const full = libres <= 0;
                const pct = Math.min(100, (s.ocupados / s.capacidadMax) * 100);

                return (
                  <motion.div key={s.id} whileTap={{ scale: 0.99 }}>
                    <div className="rounded-2xl bg-card border border-border overflow-hidden flex">
                      {/* Color accent strip */}
                      <div className="w-1 shrink-0" style={{ background: s.trainingColor }} />

                      <div className="flex-1 p-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{s.nombre.split('·')[0].trim()}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)}
                          </p>

                          {/* Capacity bar */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  full ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-primary',
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-medium shrink-0',
                                full ? 'text-red-400' : 'text-muted-foreground',
                              )}
                            >
                              {full ? 'Lleno' : `${libres} libre${libres !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        {reserved ? (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <Check className="size-3" />
                            Reservada
                          </span>
                        ) : full ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 border-amber-500/40 text-amber-400 hover:border-amber-500"
                            loading={reserve.isPending && reserve.variables === s.id}
                            onClick={() => reserve.mutate(s.id)}
                          >
                            Lista espera
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="shrink-0"
                            loading={reserve.isPending && reserve.variables === s.id}
                            onClick={() => reserve.mutate(s.id)}
                          >
                            Reservar
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
