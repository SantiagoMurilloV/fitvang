import { Fragment, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X, Clock, Users } from 'lucide-react';
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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function dayHeader(date: Date): { wd: string; n: number } {
  const wd = date.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '');
  return { wd: cap(wd), n: date.getDate() };
}

function dateLong(fecha: string): string {
  const d = new Date(fecha + 'T12:00');
  return cap(d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }));
}

const shortName = (s: SessionRow) => s.nombre.split('·')[0].trim();

export function SchedulePicker() {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);

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
    onSuccess: () => {
      toast.success('Reservado');
      qc.invalidateQueries({ queryKey: ['bookings-me'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setSelectedId(null);
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

  // Días de la semana (lun → dom) como columnas
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { iso: format(date, 'yyyy-MM-dd'), date };
  });

  // Horas presentes esta semana → filas
  const times = Array.from(new Set(filtered.map((s) => s.horaInicio.slice(0, 5)))).sort();

  // Mapa celda → sesiones (puede haber varias clases a la misma hora/día)
  const cellMap = new Map<string, SessionRow[]>();
  for (const s of filtered) {
    const key = `${s.fecha}|${s.horaInicio.slice(0, 5)}`;
    const arr = cellMap.get(key) ?? [];
    arr.push(s);
    cellMap.set(key, arr);
  }

  const selected = selectedId ? allSessions.find((s) => s.id === selectedId) ?? null : null;

  // Centrar la columna de hoy al cargar la semana actual
  useEffect(() => {
    if (weekOffset !== 0) return;
    const sc = scrollRef.current;
    const tc = todayColRef.current;
    if (!sc || !tc) return;
    sc.scrollLeft = tc.offsetLeft - sc.clientWidth / 2 + tc.clientWidth / 2;
  }, [weekOffset, times.length, sessions.dataUpdatedAt]);

  return (
    <div className="space-y-4">
      {/* Header con navegación de semana */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {format(monday, 'd MMM')} – {format(addDays(monday, 6), 'd MMM')}
        </p>
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

      {/* Filtros */}
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

      {/* Cuadrícula semanal */}
      {sessions.isLoading ? (
        <div className="rounded-2xl bg-card border border-border p-4 animate-pulse h-72" />
      ) : times.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {filter !== 'todos'
            ? `Sin clases de ${FILTERS.find((f) => f.key === filter)?.label} esta semana.`
            : 'Sin clases en esta semana.'}
        </p>
      ) : (
        <div ref={scrollRef} className="relative overflow-x-auto scrollbar-none">
          <div
            className="grid min-w-[720px]"
            style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}
          >
            {/* Esquina superior izquierda (fija al hacer scroll horizontal) */}
            <div className="sticky left-0 z-20 bg-background border-r border-b border-border" />

            {/* Encabezados de día */}
            {days.map((d) => {
              const isToday = d.iso === today;
              const h = dayHeader(d.date);
              return (
                <div
                  key={d.iso}
                  ref={isToday ? todayColRef : undefined}
                  className="px-1 pb-2 text-center border-b border-border"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{h.wd}</p>
                  <p
                    className={cn(
                      'mx-auto mt-0.5 size-6 flex items-center justify-center rounded-full text-sm font-bold',
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {h.n}
                  </p>
                </div>
              );
            })}

            {/* Filas por hora */}
            {times.map((t) => (
              <Fragment key={t}>
                {/* Etiqueta de hora (fija al hacer scroll horizontal) */}
                <div className="sticky left-0 z-10 bg-background flex items-center justify-end pr-2 py-1 border-r border-t border-border">
                  <span className="text-[11px] font-semibold text-foreground/70 tabular-nums">{t}</span>
                </div>

                {/* Celdas de cada día */}
                {days.map((d) => {
                  const list = cellMap.get(`${d.iso}|${t}`) ?? [];
                  const isToday = d.iso === today;
                  return (
                    <div
                      key={d.iso + t}
                      className={cn(
                        'min-h-[60px] p-0.5 border-t border-l border-border/40',
                        isToday && 'bg-primary/4',
                      )}
                    >
                      {list.map((s) => {
                        const reserved = reservedSet.has(s.id);
                        const libres = s.capacidadMax - s.ocupados;
                        const full = libres <= 0;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedId(s.id)}
                            className={cn(
                              'w-full text-left rounded-lg px-1.5 py-1 mb-0.5 border transition active:scale-[0.97]',
                              reserved && 'ring-1 ring-primary',
                              full && !reserved && 'opacity-70',
                            )}
                            style={{
                              backgroundColor: `${s.trainingColor}1f`,
                              borderColor: reserved ? '' : `${s.trainingColor}55`,
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <span
                                className="size-1.5 rounded-full shrink-0"
                                style={{ background: s.trainingColor }}
                              />
                              <span className="text-[10px] font-semibold leading-tight truncate">
                                {shortName(s)}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'mt-0.5 flex items-center gap-0.5 text-[9px] leading-none',
                                full ? 'text-red-400' : 'text-muted-foreground',
                              )}
                            >
                              {reserved ? (
                                <>
                                  <Check className="size-2.5 text-primary" />
                                  <span className="text-primary font-medium">Reservada</span>
                                </>
                              ) : full ? (
                                'Lleno'
                              ) : (
                                `${libres} libre${libres !== 1 ? 's' : ''}`
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {!sessions.isLoading && times.length > 0 && (
        <p className="text-center text-[11px] text-muted-foreground">
          Toca una clase para ver el detalle y reservar.
        </p>
      )}

      {/* Hoja de detalle / reserva */}
      <DetailSheet
        session={selected}
        reserved={selected ? reservedSet.has(selected.id) : false}
        reserving={reserve.isPending}
        onReserve={(id) => reserve.mutate(id)}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function DetailSheet({
  session,
  reserved,
  reserving,
  onReserve,
  onClose,
}: {
  session: SessionRow | null;
  reserved: boolean;
  reserving: boolean;
  onReserve: (id: string) => void;
  onClose: () => void;
}) {
  if (typeof document === 'undefined') return null;

  const libres = session ? session.capacidadMax - session.ocupados : 0;
  const full = libres <= 0;
  const pct = session ? Math.min(100, (session.ocupados / session.capacidadMax) * 100) : 0;

  return createPortal(
    <AnimatePresence>
      {session && (
        <motion.div
          key="sheet-backdrop"
          className="fixed inset-0 z-300 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            key="sheet-card"
            className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-[#111] shadow-2xl overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="h-1.5 w-full" style={{ background: session.trainingColor }} />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 size-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: session.trainingColor }} />
                <h2 className="text-xl font-bold leading-tight">{shortName(session)}</h2>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{dateLong(session.fecha)}</p>
                <p className="flex items-center gap-2 text-foreground">
                  <Clock className="size-4 text-muted-foreground" />
                  {session.horaInicio.slice(0, 5)} – {session.horaFin.slice(0, 5)}
                </p>
                <p className="flex items-center gap-2 text-foreground">
                  <Users className="size-4 text-muted-foreground" />
                  {session.ocupados}/{session.capacidadMax} ocupados
                </p>
              </div>

              {/* Barra de capacidad */}
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      full ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-primary',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={cn('text-xs font-medium', full ? 'text-red-400' : 'text-muted-foreground')}>
                  {full ? 'Clase llena' : `${libres} cupo${libres !== 1 ? 's' : ''} disponible${libres !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Acción */}
              {reserved ? (
                <div className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                  <Check className="size-4" />
                  Ya reservada
                </div>
              ) : full ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-amber-500/40 text-amber-400 hover:border-amber-500"
                  loading={reserving}
                  onClick={() => onReserve(session.id)}
                >
                  Unirme a lista de espera
                </Button>
              ) : (
                <Button size="lg" className="w-full" loading={reserving} onClick={() => onReserve(session.id)}>
                  Reservar
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
