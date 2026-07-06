import { Fragment, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X, Clock, Users, Pencil, Trash2, CalendarClock, Wallet } from 'lucide-react';
import Swal from 'sweetalert2';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useAuth } from '@/lib/auth-store';
import { useUiAction } from '@/lib/ui-actions';
import { cn, formatCop } from '@/lib/utils';

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

interface BookingRow {
  bookingId: string;
  estado: string;
  sessionId: string;
  fecha: string;
  sessionEstado: string;
  horaInicio: string;
  horaFin: string;
  nombre: string;
  trainingSlug: string;
  trainingColor: string;
}

interface Minor {
  menorId: string;
  nombre: string;
  avatarUrl?: string | null;
  relacion: string;
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

// `acudiente`: el acudiente no es un cliente — ve los horarios del plan de su
// hijo y las reservas que haga son para el hijo. El miembro solo ve las clases
// que su plan activo cubre (el backend ya filtra /classes/sessions) y sin plan
// activo no ve horarios.
export function SchedulePicker({ acudiente = false }: { acudiente?: boolean }) {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'clases' | 'reservas'>('clases');
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [menorSelId, setMenorSelId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);

  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const from = format(monday, 'yyyy-MM-dd');
  const to = format(addDays(monday, 6), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  // Menores a cargo (solo acudiente). Todo el calendario gira alrededor del
  // menor activo: sus horarios, su plan y sus reservas.
  const menoresQ = useQuery({
    queryKey: ['menores-me'],
    queryFn: () => api.get<{ menores: Minor[] }>(`/users/${user?.id}/menores`),
    enabled: acudiente && !!user?.id,
  });
  const menores = menoresQ.data?.menores ?? [];
  const menorActivo = menores.find((m) => m.menorId === menorSelId) ?? menores[0] ?? null;
  const menorId = menorActivo?.menorId ?? null;

  const sessions = useQuery({
    queryKey: ['sessions', from, to, acudiente ? menorId : 'me'],
    queryFn: () =>
      api.get<{ sessions: SessionRow[] }>(
        `/classes/sessions?from=${from}&to=${to}${acudiente && menorId ? `&paraUsuario=${menorId}` : ''}`,
      ),
    enabled: !acudiente || !!menorId,
  });

  const myBookings = useQuery({
    queryKey: acudiente ? ['bookings-menor', menorId] : ['bookings-me'],
    queryFn: () =>
      api.get<{ bookings: BookingRow[] }>(acudiente ? `/bookings/user/${menorId}` : '/bookings/me'),
    enabled: !acudiente || !!menorId,
  });

  // Plan activo del titular (miembro → el propio; acudiente → el del menor)
  const myPlans = useQuery({
    queryKey: ['plan-me'],
    queryFn: () => api.get<{ plans: { id: string }[] }>('/plans/me'),
    enabled: !acudiente,
  });
  const menorPlans = useQuery({
    queryKey: ['plans-user', menorId],
    queryFn: () => api.get<{ plans: { id: string }[] }>(`/plans/user/${menorId}`),
    enabled: acudiente && !!menorId,
  });

  // Saldo pendiente del titular (miembro → el propio; acudiente → el del menor).
  // Con deuda no se muestran los horarios: primero ponerse al día.
  const titularId = acudiente ? menorId : user?.id ?? null;
  const pendiente = useQuery({
    queryKey: ['saldo-pendiente', titularId],
    queryFn: () => api.get<{ saldoPendienteCop: number; pendientes: number }>(`/payments/pendiente/${titularId}`),
    enabled: !!titularId,
  });
  const saldoPendiente = pendiente.data?.saldoPendienteCop ?? 0;

  const reservedSet = new Set(
    (myBookings.data?.bookings ?? [])
      .filter((b) => b.estado === 'activa' || b.estado === 'asistio')
      .map((b) => b.sessionId),
  );

  function invalidateBookings() {
    qc.invalidateQueries({ queryKey: ['bookings-me'] });
    qc.invalidateQueries({ queryKey: ['bookings-menor'] });
    qc.invalidateQueries({ queryKey: ['sessions'] });
  }

  const reserve = useMutation({
    mutationFn: (sessionId: string) =>
      api.post('/bookings', { sessionId, ...(acudiente && menorId ? { userId: menorId } : {}) }),
    onSuccess: () => {
      toast.success('Reservado');
      invalidateBookings();
      setSelectedId(null);
    },
    onError: (err) => {
      const map: Record<string, string> = {
        sin_plan_activo: acudiente ? 'El menor no tiene plan activo.' : 'No tienes plan activo.',
        plan_no_cubre_training: acudiente ? 'El plan del menor no cubre este tipo de clase.' : 'Tu plan no cubre este tipo de clase.',
        kids_solo_por_admin: 'Las clases Kids se inscriben con el admin.',
        ya_reservada: acudiente ? 'El menor ya tiene esta clase reservada.' : 'Ya tienes esta clase reservada.',
        sesion_no_disponible: 'Esta sesión ya no está disponible.',
        sesion_no_encontrada: 'Esta sesión ya no existe.',
        muy_tarde_para_reservar: 'Ya es muy tarde: reserva con al menos 30 min de anticipación.',
        horario_restringido: 'No puedes reservar entre las 10 PM y las 6 AM.',
        plan_sin_sesiones: acudiente ? 'El plan del menor no tiene sesiones disponibles.' : 'Tu plan no tiene sesiones disponibles.',
        saldo_pendiente: 'Hay un saldo pendiente. Ponte al día con los pagos para seguir entrenando.',
      };
      if (err instanceof ApiError) {
        toast.error(map[err.data?.error] ?? err.data?.message ?? 'No se pudo reservar.');
      } else {
        toast.error('No se pudo reservar.');
      }
    },
  });

  const cancelBooking = useMutation({
    mutationFn: (bookingId: string) => api.delete(`/bookings/${bookingId}`),
    onSuccess: () => {
      toast.success('Reserva cancelada');
      invalidateBookings();
    },
    onError: () => toast.error('No se pudo cancelar la reserva.'),
  });

  const reschedule = useMutation({
    mutationFn: (vars: { bookingId: string; newSessionId: string }) =>
      api.put(`/bookings/${vars.bookingId}`, { newSessionId: vars.newSessionId }),
    onSuccess: () => {
      toast.success('Reserva reagendada');
      invalidateBookings();
      setReschedulingId(null);
      setSelectedId(null);
      setMode('reservas');
    },
    onError: (err) => {
      const map: Record<string, string> = {
        sin_plan_activo: acudiente ? 'El menor no tiene plan activo.' : 'No tienes plan activo.',
        plan_no_cubre_training: acudiente ? 'El plan del menor no cubre este tipo de clase.' : 'Tu plan no cubre este tipo de clase.',
        ya_reservada: acudiente ? 'El menor ya tiene esa clase reservada.' : 'Ya tienes esa clase reservada.',
        sesion_llena: 'La clase elegida está llena.',
        misma_sesion: 'Es la misma clase de tu reserva.',
        muy_tarde_para_editar: 'Solo puedes reagendar con al menos 1 hora de anticipación.',
        muy_tarde_para_reservar: 'La nueva clase debe ser con al menos 30 min de anticipación.',
        sesion_no_disponible: 'Esa clase ya no está disponible.',
        saldo_pendiente: 'Hay un saldo pendiente. Ponte al día con los pagos para seguir entrenando.',
      };
      if (err instanceof ApiError) toast.error(map[err.data?.error] ?? err.data?.message ?? 'No se pudo reagendar.');
      else toast.error('No se pudo reagendar.');
    },
  });

  // Botón del header "Mis reservas" → alterna entre la cuadrícula y mis reservas
  useUiAction('editar-reservas', () => {
    setReschedulingId(null);
    setSelectedId(null);
    setMode((m) => (m === 'clases' ? 'reservas' : 'clases'));
  });

  async function confirmCancel(b: BookingRow) {
    const res = await Swal.fire({
      title: '¿Cancelar reserva?',
      text: `${b.nombre.split('·')[0].trim()} · ${dateLong(b.fecha)} ${b.horaInicio.slice(0, 5)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2f',
      reverseButtons: true,
    });
    if (res.isConfirmed) cancelBooking.mutate(b.bookingId);
  }

  const allSessions = sessions.data?.sessions ?? [];

  // Días de la semana (lun → dom) como columnas
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { iso: format(date, 'yyyy-MM-dd'), date };
  });

  // Horas presentes esta semana → filas
  const times = Array.from(new Set(allSessions.map((s) => s.horaInicio.slice(0, 5)))).sort();

  // Mapa celda → sesiones (puede haber varias clases a la misma hora/día)
  const cellMap = new Map<string, SessionRow[]>();
  for (const s of allSessions) {
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

  // Miembro sin plan activo o con saldo pendiente → no ve horarios (los hooks
  // ya corrieron; es seguro retornar aquí).
  if (!acudiente) {
    if (myPlans.isLoading || pendiente.isLoading) {
      return <div className="rounded-2xl bg-card border border-border p-4 animate-pulse h-72" />;
    }
    if (saldoPendiente > 0) {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
          <div className="size-14 rounded-full bg-amber-500/10 border border-amber-500/30 grid place-items-center">
            <Wallet className="size-6 text-amber-400" />
          </div>
          <p className="font-semibold">Ponte al día</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Tienes un saldo pendiente de <span className="font-semibold text-amber-400">{formatCop(saldoPendiente)}</span>.
            Ponte al día con tus pagos para que puedas seguir entrenando.
          </p>
          <a
            href="/app/pagos"
            className="mt-2 px-5 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center hover:bg-primary/90 transition-colors"
          >
            Ir a pagos
          </a>
        </div>
      );
    }
    if ((myPlans.data?.plans ?? []).length === 0) {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
          <div className="size-14 rounded-full bg-card border border-border grid place-items-center">
            <CalendarClock className="size-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">No puedes ver los horarios</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            No tienes ningún plan activo. Comunícate con el club para activar tu plan y reservar clases.
          </p>
        </div>
      );
    }
  }

  // Acudiente: sin menores vinculados no hay nada que mostrar.
  if (acudiente) {
    if (menoresQ.isLoading || (!!menorId && (menorPlans.isLoading || pendiente.isLoading))) {
      return <div className="rounded-2xl bg-card border border-border p-4 animate-pulse h-72" />;
    }
    if (menores.length === 0) {
      return (
        <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
          <div className="size-14 rounded-full bg-card border border-border grid place-items-center">
            <CalendarClock className="size-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">No tienes menores vinculados</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Habla con el admin del club para vincular a tu menor y ver sus horarios.
          </p>
        </div>
      );
    }
  }

  // El menor seleccionado no tiene plan activo → mensaje (el selector de hijo,
  // si hay varios, sigue visible para poder cambiar).
  const menorSinPlan = acudiente && !!menorId && !menorPlans.isLoading && (menorPlans.data?.plans ?? []).length === 0;

  const menorChips = acudiente && menores.length > 1 && (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
      {menores.map((m) => (
        <button
          key={m.menorId}
          onClick={() => { setMenorSelId(m.menorId); setSelectedId(null); setReschedulingId(null); }}
          className={cn(
            'shrink-0 flex items-center gap-1.5 pl-1.5 pr-3.5 h-8 rounded-full text-xs font-medium transition-all',
            m.menorId === menorId
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
              : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground',
          )}
        >
          <span className="size-5 rounded-full bg-black/20 grid place-items-center text-[9px] font-bold overflow-hidden">
            {m.avatarUrl
              ? <img src={m.avatarUrl} alt={m.nombre} className="size-full object-cover" />
              : m.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')}
          </span>
          {m.nombre.split(' ')[0]}
        </button>
      ))}
    </div>
  );

  // El menor seleccionado tiene saldo pendiente → primero ponerse al día.
  if (acudiente && !!menorId && saldoPendiente > 0) {
    return (
      <div className="space-y-4">
        {menorChips}
        <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
          <div className="size-14 rounded-full bg-amber-500/10 border border-amber-500/30 grid place-items-center">
            <Wallet className="size-6 text-amber-400" />
          </div>
          <p className="font-semibold">Ponte al día</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {menorActivo?.nombre.split(' ')[0]} tiene un saldo pendiente de{' '}
            <span className="font-semibold text-amber-400">{formatCop(saldoPendiente)}</span>.
            Ponte al día con los pagos para que pueda seguir entrenando.
          </p>
        </div>
      </div>
    );
  }

  if (menorSinPlan) {
    return (
      <div className="space-y-4">
        {menorChips}
        <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
          <div className="size-14 rounded-full bg-card border border-border grid place-items-center">
            <CalendarClock className="size-6 text-muted-foreground" />
          </div>
          <p className="font-semibold">Sin plan activo</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {menorActivo?.nombre.split(' ')[0]} no tiene ningún plan activo. Comunícate con el club para activar su plan y reservar clases.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {menorChips}
      {mode === 'reservas' && !reschedulingId ? (
        <ReservasList
          loading={myBookings.isLoading}
          bookings={(myBookings.data?.bookings ?? []).filter((b) => b.estado === 'activa')}
          titular={acudiente ? menorActivo?.nombre.split(' ')[0] : undefined}
          onEdit={(b) => setReschedulingId(b.bookingId)}
          onDelete={confirmCancel}
          deleting={cancelBooking.isPending}
        />
      ) : (
      <>
      {reschedulingId && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2">
          <CalendarClock className="size-4 text-primary shrink-0" />
          <p className="text-xs text-primary flex-1">Elige la nueva clase para reagendar tu reserva.</p>
          <button onClick={() => setReschedulingId(null)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            Cancelar
          </button>
        </div>
      )}
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

      {/* Cuadrícula semanal */}
      {sessions.isLoading ? (
        <div className="rounded-2xl bg-card border border-border p-4 animate-pulse h-72" />
      ) : times.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Sin clases en esta semana.</p>
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
          {reschedulingId
            ? 'Toca la clase a la que quieres mover tu reserva.'
            : 'Toca una clase para ver el detalle y reservar.'}
        </p>
      )}
      </>
      )}

      {/* Hoja de detalle / reserva */}
      <DetailSheet
        session={selected}
        reserved={selected ? reservedSet.has(selected.id) : false}
        rescheduling={!!reschedulingId}
        reserveLabel={acudiente && menorActivo ? `Reservar para ${menorActivo.nombre.split(' ')[0]}` : 'Reservar'}
        reserving={reserve.isPending || reschedule.isPending}
        onReserve={(id) => reserve.mutate(id)}
        onReschedule={(newSessionId) => {
          if (reschedulingId) reschedule.mutate({ bookingId: reschedulingId, newSessionId });
        }}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function ReservasList({
  loading,
  bookings,
  titular,
  onEdit,
  onDelete,
  deleting,
}: {
  loading: boolean;
  bookings: BookingRow[];
  titular?: string; // nombre del menor cuando el acudiente gestiona sus reservas
  onEdit: (b: BookingRow) => void;
  onDelete: (b: BookingRow) => void;
  deleting: boolean;
}) {
  if (loading) {
    return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}</div>;
  }
  if (bookings.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 text-sm">
        {titular ? `${titular} no tiene reservas próximas.` : 'No tienes reservas próximas.'}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {titular
          ? `Reagenda o cancela las reservas de ${titular} — solo hasta 1 hora antes de la clase.`
          : 'Reagenda o cancela tus reservas — solo hasta 1 hora antes de la clase.'}
      </p>
      {bookings.map((b) => {
        const startMs = new Date(`${b.fecha}T${b.horaInicio}`).getTime();
        const editable = startMs - Date.now() >= 3600_000;
        return (
          <div key={b.bookingId} className="rounded-2xl bg-card border border-border overflow-hidden flex">
            <div className="w-1 shrink-0" style={{ background: b.trainingColor }} />
            <div className="flex-1 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{b.nombre.split('·')[0].trim()}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{dateLong(b.fecha)}</p>
                <p className="text-xs text-muted-foreground">{b.horaInicio.slice(0, 5)} – {b.horaFin.slice(0, 5)}</p>
              </div>
              {editable ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onEdit(b)}
                    title="Reagendar"
                    className="size-9 rounded-full bg-primary/10 text-primary border border-primary/20 grid place-items-center hover:bg-primary/20 transition-colors"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => onDelete(b)}
                    disabled={deleting}
                    title="Cancelar reserva"
                    className="size-9 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 grid place-items-center hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground shrink-0 text-right leading-tight max-w-[72px]">
                  Empieza pronto
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailSheet({
  session,
  reserved,
  reserving,
  rescheduling,
  reserveLabel = 'Reservar',
  onReserve,
  onReschedule,
  onClose,
}: {
  session: SessionRow | null;
  reserved: boolean;
  reserving: boolean;
  rescheduling: boolean;
  reserveLabel?: string;
  onReserve: (id: string) => void;
  onReschedule: (newSessionId: string) => void;
  onClose: () => void;
}) {
  if (typeof document === 'undefined') return null;

  const libres = session ? session.capacidadMax - session.ocupados : 0;
  const full = libres <= 0;
  const pct = session ? Math.min(100, (session.ocupados / session.capacidadMax) * 100) : 0;
  // Mismas reglas que el backend: no se reserva una clase pasada ni a <30 min.
  const startMs = session ? new Date(`${session.fecha}T${session.horaInicio}`).getTime() : 0;
  const started = startMs <= Date.now();
  const cerrada = startMs - Date.now() < 30 * 60 * 1000;

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
              ) : cerrada ? (
                <div className="flex items-center justify-center w-full h-12 rounded-full bg-white/5 text-muted-foreground border border-border font-semibold">
                  {started ? 'Clase finalizada' : 'Reservas cerradas'}
                </div>
              ) : rescheduling ? (
                full ? (
                  <div className="flex items-center justify-center w-full h-12 rounded-full bg-white/5 text-muted-foreground border border-border font-semibold">
                    Clase llena
                  </div>
                ) : (
                  <Button size="lg" className="w-full" loading={reserving} onClick={() => onReschedule(session.id)}>
                    Reagendar aquí
                  </Button>
                )
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
                  {reserveLabel}
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
