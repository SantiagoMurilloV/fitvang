import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Zap, X, Users2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Session {
  id: string;
  fecha: string;
  estado: 'programada' | 'cancelada' | 'finalizada';
  nombre: string;
  trainingSlug: string;
  trainingColor: string;
  horaInicio: string;
  horaFin: string;
  ocupados: number;
  capacidadMax: number;
  diaSemana: string;
}

interface Attendee {
  bookingId: string;
  userId: string;
  nombre: string;
  estado: 'activa' | 'asistio' | 'no_asistio';
  esMenor: boolean;
}

const DIAS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_SHORT: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue',
  viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
};

/* ─── Attendees Sheet ───────────────────────────────────────────────── */
function AttendeesSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['session-attendees', session.id],
    queryFn: () => api.get<{ attendees: Attendee[] }>(`/classes/sessions/${session.id}/attendees`),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="w-full max-w-md bg-card border-t md:border border-border md:rounded-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <p className="font-bold">{session.nombre}</p>
            <p className="text-xs text-muted-foreground">{session.horaInicio} · {session.ocupados}/{session.capacidadMax} reservados</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)
          ) : !data?.attendees.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nadie reservó esta clase aún.</p>
          ) : (
            data.attendees.map((a) => {
              const initials = a.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');
              const statColor = a.estado === 'asistio' ? 'text-green-400' : a.estado === 'no_asistio' ? 'text-red-400' : 'text-blue-400';
              return (
                <div key={a.bookingId} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                  <div className="size-9 rounded-full bg-white/10 grid place-items-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <p className="flex-1 text-sm font-medium">{a.nombre}</p>
                  <span className={`text-[10px] font-semibold uppercase ${statColor}`}>{a.estado}</span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Cancel Modal ───────────────────────────────────────────────────── */
function CancelModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const [motivo, setMotivo] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean; notificados: number }>(`/classes/sessions/${session.id}/cancel`, { motivo: motivo || undefined }),
    onSuccess: (data) => {
      toast.success(`Clase cancelada. ${data.notificados} usuario${data.notificados !== 1 ? 's' : ''} notificado${data.notificados !== 1 ? 's' : ''}.`);
      qc.invalidateQueries({ queryKey: ['sessions-week'] });
      onClose();
    },
    onError: () => toast.error('No se pudo cancelar la clase.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
        <Card className="border-red-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-red-400">Cancelar clase</p>
              <p className="text-xs text-muted-foreground mt-0.5">{session.nombre} · {session.horaInicio}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Motivo (opcional)</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Ej: El coach está indispuesto..."
            className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition resize-none text-sm"
          />
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button variant="danger" size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()} className="flex-1">Confirmar</Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/* ─── Session Cell ───────────────────────────────────────────────────── */
function SessionCell({ session, onClick }: { session: Session; onClick: () => void }) {
  const pct = session.capacidadMax > 0 ? (session.ocupados / session.capacidadMax) : 0;
  const isFull = session.ocupados >= session.capacidadMax;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg p-1.5 border transition-all hover:scale-[1.02] active:scale-[0.98] ${
        session.estado === 'cancelada'
          ? 'border-red-500/30 bg-red-500/10 opacity-60'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
      style={{ borderLeftColor: session.trainingColor || '#3DC4DB', borderLeftWidth: 3 }}
    >
      <p className="text-[10px] font-semibold truncate leading-tight">{session.nombre}</p>
      <p className="text-[9px] text-muted-foreground">{session.horaInicio}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: isFull ? '#ef4444' : (session.trainingColor || '#3DC4DB') }} />
        </div>
        <span className="text-[8px] text-muted-foreground">{session.ocupados}</span>
      </div>
    </button>
  );
}

/* ─── Weekly Calendar View ───────────────────────────────────────────── */
function WeeklyCalendar() {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null);
  const [attendeesTarget, setAttendeesTarget] = useState<Session | null>(null);

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const from = format(weekStart, 'yyyy-MM-dd');
  const to = format(weekEnd, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['sessions-week', from, to],
    queryFn: () => api.get<{ sessions: Session[] }>(`/classes/sessions?from=${from}&to=${to}`),
    refetchInterval: 60_000,
  });

  const generate = useMutation({
    mutationFn: () => api.post<{ inserted: number }>('/classes/generate?days=30'),
    onSuccess: (d) => {
      toast.success(`${d.inserted} sesiones generadas.`);
      qc.invalidateQueries({ queryKey: ['sessions-week'] });
    },
    onError: () => toast.error('Error al generar sesiones.'),
  });

  // Agrupar sesiones por día
  const byDay = DIAS_ORDER.reduce<Record<string, Session[]>>((acc, d) => { acc[d] = []; return acc; }, {});
  for (const s of (data?.sessions ?? [])) {
    if (s.diaSemana && byDay[s.diaSemana]) byDay[s.diaSemana].push(s);
  }

  // Horas únicas para el eje Y
  const allHours = [...new Set((data?.sessions ?? []).map((s) => s.horaInicio.slice(0, 2)))].sort();

  return (
    <div className="space-y-4">
      {/* Controles semana */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((v) => v - 1)} className="size-8 rounded-full border border-border flex items-center justify-center hover:bg-white/5 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold">
            {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d MMM yyyy", { locale: es })}
          </span>
          <button onClick={() => setWeekOffset((v) => v + 1)} className="size-8 rounded-full border border-border flex items-center justify-center hover:bg-white/5 transition-colors">
            <ChevronRight size={14} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline">Hoy</button>
          )}
        </div>
        <Button size="sm" loading={generate.isPending} onClick={() => generate.mutate()} className="gap-1.5">
          <Zap size={12} /> Generar 30d
        </Button>
      </div>

      {/* Grilla semanal */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-card animate-pulse" />
      ) : (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[560px]">
            {/* Cabecera días */}
            <div className="grid grid-cols-8 gap-0.5 mb-1">
              <div className="flex items-center justify-center">
                <Clock size={12} className="text-muted-foreground" />
              </div>
              {DIAS_ORDER.map((dia, i) => {
                const date = addDays(weekStart, i);
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div key={dia} className={`text-center py-1 rounded-lg ${isToday ? 'bg-primary/15' : ''}`}>
                    <p className={`text-[10px] font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {DIAS_SHORT[dia]}
                    </p>
                    <p className={`text-xs font-bold ${isToday ? 'text-primary' : ''}`}>
                      {format(date, 'd')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Filas de horas */}
            {allHours.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No hay sesiones esta semana.
                <br />
                <button onClick={() => generate.mutate()} className="text-primary hover:underline mt-1">Generar sesiones</button>
              </div>
            ) : (
              allHours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 gap-0.5 mb-0.5 min-h-[52px]">
                  <div className="flex items-start justify-end pr-2 pt-1">
                    <span className="text-[10px] text-muted-foreground">{hour}:00</span>
                  </div>
                  {DIAS_ORDER.map((dia) => {
                    const sessions = byDay[dia].filter((s) => s.horaInicio.startsWith(hour));
                    return (
                      <div key={dia} className="space-y-0.5 min-h-[48px]">
                        {sessions.map((s) => (
                          <SessionCell
                            key={s.id}
                            session={s}
                            onClick={() => {
                              if (s.estado === 'programada') setAttendeesTarget(s);
                            }}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Leyenda */}
      {(data?.sessions ?? []).length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Toca una clase para ver los reservados · Arrastra para reorganizar (próximamente)
        </p>
      )}

      <AnimatePresence>
        {cancelTarget && <CancelModal session={cancelTarget} onClose={() => setCancelTarget(null)} />}
        {attendeesTarget && <AttendeesSheet session={attendeesTarget} onClose={() => setAttendeesTarget(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function ClassesAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clases</h1>
        <p className="text-sm text-muted-foreground mt-1">Horario semanal · toca una clase para ver reservados.</p>
      </div>
      <WeeklyCalendar />
    </div>
  );
}
