import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Users2, ChevronLeft, ChevronRight, Clock, Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
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
  avatarUrl?: string | null;
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
                  <div className="size-9 rounded-full bg-white/10 grid place-items-center text-xs font-bold shrink-0 overflow-hidden">
                    {a.avatarUrl
                      ? <img src={a.avatarUrl} alt={a.nombre} className="size-full object-cover" />
                      : initials}
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

/* ─── Edit Session Modal ─────────────────────────────────────────────── */
function EditSessionModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const [horaInicio, setHoraInicio] = useState(session.horaInicio.slice(0, 5));
  const [capacidadMax, setCapacidadMax] = useState(String(session.capacidadMax || ''));
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.patch(`/classes/sessions/${session.id}`, {
      horaInicio: horaInicio.slice(0, 5),
      capacidadMax: capacidadMax ? Number(capacidadMax) : null,
    }),
    onSuccess: () => {
      toast.success('Sesión actualizada.');
      qc.invalidateQueries({ queryKey: ['sessions-week'] });
      onClose();
    },
    onError: () => toast.error('No se pudo actualizar la sesión.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold">Editar horario</p>
              <p className="text-xs text-muted-foreground mt-0.5">{session.nombre} · afecta todas las sesiones futuras de este horario</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Hora inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Capacidad máx <span className="normal-case text-muted-foreground/50">(opcional)</span></label>
              <input
                type="number"
                value={capacidadMax}
                min={1}
                max={500}
                onChange={(e) => setCapacidadMax(e.target.value)}
                placeholder="Sin límite"
                className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()} className="flex-1">Guardar</Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/* ─── Delete Session confirm ─────────────────────────────────────────── */
function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/classes/sessions/${id}`),
    onSuccess: () => {
      toast.success('Sesión eliminada.');
      qc.invalidateQueries({ queryKey: ['sessions-week'] });
    },
    onError: () => toast.error('No se pudo eliminar la sesión.'),
  });
}

/* ─── Session Cell ───────────────────────────────────────────────────── */
function SessionCell({ session, onViewAttendees, onEdit, onDelete }: {
  session: Session;
  onViewAttendees: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = session.capacidadMax > 0 ? (session.ocupados / session.capacidadMax) : 0;
  const isFull = session.ocupados >= session.capacidadMax && session.capacidadMax > 0;

  return (
    <div
      className={`group relative w-full text-left rounded-lg p-1.5 border transition-all ${
        session.estado === 'cancelada'
          ? 'border-red-500/30 bg-red-500/10 opacity-60'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
      style={{ borderLeftColor: session.trainingColor || '#3DC4DB', borderLeftWidth: 3 }}
    >
      {/* Contenido clickeable para ver reservados */}
      <button className="w-full text-left" onClick={onViewAttendees}>
        <p className="text-[10px] font-semibold truncate leading-tight pr-8">{session.nombre}</p>
        <p className="text-[9px] text-muted-foreground">{session.horaInicio.slice(0, 5)}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: isFull ? '#ef4444' : (session.trainingColor || '#3DC4DB') }} />
          </div>
          <span className="text-[8px] text-muted-foreground">{session.ocupados}</span>
        </div>
      </button>

      {/* Botones de acción — siempre visibles */}
      <div className="absolute top-0.5 right-0.5 flex gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="size-5 rounded flex items-center justify-center bg-background/80 text-blue-400 active:bg-blue-500/20 transition-colors"
        >
          <Pencil size={9} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="size-5 rounded flex items-center justify-center bg-background/80 text-red-400 active:bg-red-500/20 transition-colors"
        >
          <Trash2 size={9} />
        </button>
      </div>
    </div>
  );
}

/* ─── Weekly Calendar View ───────────────────────────────────────────── */
function WeeklyCalendar() {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null);
  const [attendeesTarget, setAttendeesTarget] = useState<Session | null>(null);
  const [editTarget, setEditTarget] = useState<Session | null>(null);
  const deleteSession = useDeleteSession();

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

  async function handleDelete(session: Session) {
    const fecha = format(new Date(session.fecha + 'T12:00:00'), "d 'de' MMMM", { locale: es });
    const result = await Swal.fire({
      title: 'Eliminar sesión',
      html: `<span style="color:#a1a1aa">¿Eliminar <b style="color:#f8f8f8">${session.nombre}</b> del ${fecha}?</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10' },
      reverseButtons: true,
    });
    if (result.isConfirmed) deleteSession.mutate(session.id);
  }

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
      </div>

      {/* Grilla semanal */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-card animate-pulse" />
      ) : (
        <div className="overflow-x-auto -mx-4 px-0 rounded-2xl border border-border bg-card">
          {/* min-w: 48px hora + 7 cols × 130px = 958px */}
          <div className="p-3" style={{ minWidth: '960px' }}>
            {/* Cabecera días */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '48px repeat(7, minmax(128px, 1fr))' }}>
              <div className="flex items-center justify-center">
                <Clock size={12} className="text-muted-foreground" />
              </div>
              {DIAS_ORDER.map((dia, i) => {
                const date = addDays(weekStart, i);
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div key={dia} className={`text-center py-2.5 rounded-xl border ${isToday ? 'bg-primary/15 border-primary/30' : 'border-white/5 bg-white/2'}`}>
                    <p className={`text-[11px] font-semibold tracking-wide uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {DIAS_SHORT[dia]}
                    </p>
                    <p className={`text-base font-bold mt-0.5 ${isToday ? 'text-primary' : ''}`}>
                      {format(date, 'd')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Separador */}
            <div className="h-px bg-border mb-2" />

            {/* Filas de horas */}
            {allHours.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No hay sesiones esta semana.
                <br />
                <button onClick={() => generate.mutate()} className="text-primary hover:underline mt-1">Generar sesiones</button>
              </div>
            ) : (
              allHours.map((hour) => (
                <div key={hour} className="grid gap-1 mb-1 min-h-[68px]" style={{ gridTemplateColumns: '48px repeat(7, minmax(128px, 1fr))' }}>
                  <div className="flex items-start justify-end pr-2 pt-2">
                    <span className="text-[10px] text-muted-foreground font-mono">{hour}:00</span>
                  </div>
                  {DIAS_ORDER.map((dia) => {
                    const sessions = byDay[dia].filter((s) => s.horaInicio.startsWith(hour));
                    return (
                      <div key={dia} className="space-y-1 min-h-[64px] bg-white/2 rounded-lg p-1">
                        {sessions.map((s) => (
                          <SessionCell
                            key={s.id}
                            session={s}
                            onViewAttendees={() => { if (s.estado === 'programada') setAttendeesTarget(s); }}
                            onEdit={() => setEditTarget(s)}
                            onDelete={() => handleDelete(s)}
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

      <AnimatePresence>
        {cancelTarget && <CancelModal session={cancelTarget} onClose={() => setCancelTarget(null)} />}
        {attendeesTarget && <AttendeesSheet session={attendeesTarget} onClose={() => setAttendeesTarget(null)} />}
        {editTarget && <EditSessionModal session={editTarget} onClose={() => setEditTarget(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function ClassesAdmin() {
  useEffect(() => {
    const handler = () => { window.location.href = '/admin/programacion'; };
    window.addEventListener('fitvang:ir-programacion', handler);
    return () => window.removeEventListener('fitvang:ir-programacion', handler);
  }, []);

  return (
    <div className="space-y-6">
      <WeeklyCalendar />
    </div>
  );
}
