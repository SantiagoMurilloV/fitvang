import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Users2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AddBookingSection, type Session, type Attendee } from './ClassesAdmin';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* Hoja de reserva: info de la clase + inscritos + buscador de usuario */
function ReservaSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['session-attendees', session.id],
    queryFn: () => api.get<{ attendees: Attendee[] }>(`/classes/sessions/${session.id}/attendees`),
  });
  const attendees = data?.attendees ?? [];
  const activos = attendees.filter((a) => a.estado !== 'no_asistio');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="w-full max-w-md bg-card border-t md:border border-border md:rounded-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="h-1.5 w-full shrink-0" style={{ background: session.trainingColor }} />
        <div className="flex items-center justify-between gap-2 p-5 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="font-bold truncate">{session.nombre.split('·')[0].trim()}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {cap(new Date(session.fecha + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }))}
              {' · '}{session.horaInicio.slice(0, 5)} – {session.horaFin.slice(0, 5)}
            </p>
          </div>
          <button onClick={onClose} className="size-9 rounded-full bg-white/5 text-muted-foreground grid place-items-center hover:text-foreground transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Inscritos actuales (compacto) */}
        <div className="px-5 py-3 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Users2 size={13} /> Reservados ({activos.length}/{session.capacidadMax})
          </p>
          {isLoading ? (
            <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
          ) : activos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nadie ha reservado aún.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {activos.map((a) => (
                <span key={a.bookingId} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-border">
                  {a.nombre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Buscar usuario y reservar a su nombre */}
        <AddBookingSection session={session} attendeeIds={new Set(activos.map((a) => a.userId))} />
      </motion.div>
    </div>
  );
}

export function ReservarAdmin() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Session | null>(null);

  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const from = format(monday, 'yyyy-MM-dd');
  const to = format(addDays(monday, 6), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const sessions = useQuery({
    queryKey: ['sessions-week', from, to],
    queryFn: () => api.get<{ sessions: Session[] }>(`/classes/sessions?from=${from}&to=${to}`),
  });
  const list = (sessions.data?.sessions ?? []).filter((s) => s.estado === 'programada');

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const iso = format(date, 'yyyy-MM-dd');
    return { iso, date, sessions: list.filter((s) => s.fecha === iso) };
  }).filter((d) => d.sessions.length > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Elige una clase y luego busca al usuario para reservar a su nombre.
      </p>

      {/* Navegación de semana */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {format(monday, 'd MMM', { locale: es })} – {format(addDays(monday, 6), 'd MMM', { locale: es })}
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

      {/* Clases por día */}
      {sessions.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : days.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Sin clases programadas esta semana.</p>
      ) : (
        days.map((d) => (
          <div key={d.iso} className="space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-wider ${d.iso === today ? 'text-primary' : 'text-muted-foreground'}`}>
              {cap(d.date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' }))}
              {d.iso === today && ' · Hoy'}
            </p>
            {d.sessions.map((s) => {
              const libres = s.capacidadMax - s.ocupados;
              const full = libres <= 0;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="w-full rounded-2xl bg-card border border-border overflow-hidden flex text-left hover:border-primary/50 active:scale-[0.99] transition"
                >
                  <div className="w-1.5 shrink-0" style={{ background: s.trainingColor }} />
                  <div className="flex-1 p-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.nombre.split('·')[0].trim()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${full ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {s.ocupados}/{s.capacidadMax}
                      {full ? ' · Llena' : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ))
      )}

      <AnimatePresence>
        {selected && <ReservaSheet session={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
