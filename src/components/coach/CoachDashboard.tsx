import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatCop } from '@/lib/utils';

interface SessionRow {
  id: string; fecha: string; nombre: string; horaInicio: string; horaFin: string;
  capacidadMax: number; ocupados: number; estado: string; trainingColor: string;
}
interface Attendee {
  bookingId: string; userId: string; estado: string; nombre: string; avatarUrl?: string | null;
}

export function CoachDashboard() {
  const [openSession, setOpenSession] = useState<SessionRow | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const sessions = useQuery({
    queryKey: ['coach-sessions', today],
    queryFn: () => api.get<{ sessions: SessionRow[] }>(`/classes/sessions?from=${today}&to=${today}`),
  });

  if (openSession) return <SessionDetail session={openSession} onBack={() => setOpenSession(null)} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Clases de hoy</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <div className="space-y-2">
        {sessions.isLoading && <p className="text-muted-foreground text-sm">Cargando…</p>}
        {sessions.data?.sessions.length === 0 && <p className="text-muted-foreground text-sm">No hay clases hoy.</p>}
        {sessions.data?.sessions.map((s) => (
          <button key={s.id} onClick={() => setOpenSession(s)} className="text-left contents">
            <Card className="flex items-center gap-3 hover:border-primary transition cursor-pointer">
              <div className="size-1.5 self-stretch rounded-full" style={{ background: s.trainingColor }} />
              <div className="flex-1">
                <p className="font-semibold">{s.nombre.split('·')[0].trim()}</p>
                <p className="text-xs text-muted-foreground">
                  {s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)}
                </p>
              </div>
              <span className="text-lg font-bold text-primary">
                {s.ocupados}/{s.capacidadMax}
              </span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

function SessionDetail({ session, onBack }: { session: SessionRow; onBack: () => void }) {
  const qc = useQueryClient();
  const att = useQuery({
    queryKey: ['attendees', session.id],
    queryFn: () => api.get<{ attendees: Attendee[] }>(`/classes/sessions/${session.id}/attendees`),
  });

  const mark = useMutation({
    mutationFn: ({ bookingId, presente }: { bookingId: string; presente: boolean }) =>
      api.post('/attendance/mark', { bookingId, presente }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendees', session.id] });
    },
  });

  const bulk = useMutation({
    mutationFn: () => api.post('/attendance/bulk', { sessionId: session.id, presente: true }),
    onSuccess: () => {
      toast.success('Todos marcados presentes 🔥');
      qc.invalidateQueries({ queryKey: ['attendees', session.id] });
    },
  });

  const efectivo = useMutation({
    mutationFn: (userId: string) => {
      const monto = Number(prompt('Monto recibido en COP') ?? '0');
      if (!monto) throw new Error('cancel');
      return api.post('/payments/efectivo', { userId, montoCop: monto, notas: 'Cobrado en clase' });
    },
    onSuccess: () => toast.success('Pago en efectivo registrado ✅'),
    onError: (e: any) => e?.message !== 'cancel' && toast.error('No pude registrar el pago'),
  });

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Volver
      </button>
      <div>
        <h1 className="text-2xl font-bold">{session.nombre.split('·')[0].trim()}</h1>
        <p className="text-sm text-muted-foreground">
          {session.horaInicio.slice(0, 5)} – {session.horaFin.slice(0, 5)} · {session.ocupados}/{session.capacidadMax}
        </p>
      </div>
      <Button onClick={() => bulk.mutate()} loading={bulk.isPending} className="w-full" variant="outline">
        Marcar todos presentes
      </Button>
      <div className="space-y-2">
        <AnimatePresence>
          {(att.data?.attendees ?? []).map((a) => (
            <motion.div key={a.bookingId} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold">
                  {a.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">{a.estado}</p>
                </div>
                <button
                  onClick={() => efectivo.mutate(a.userId)}
                  className="text-[10px] text-muted-foreground hover:text-primary"
                  title="Registrar pago en efectivo"
                >
                  {formatCop(0).replace('0', '$$$')}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => mark.mutate({ bookingId: a.bookingId, presente: true })}
                    className={`size-10 rounded-full grid place-items-center transition ${a.estado === 'asistio' ? 'bg-success text-white' : 'border border-border hover:border-success'}`}
                  >
                    <Check className="size-5" />
                  </button>
                  <button
                    onClick={() => mark.mutate({ bookingId: a.bookingId, presente: false })}
                    className={`size-10 rounded-full grid place-items-center transition ${a.estado === 'no_asistio' ? 'bg-destructive text-white' : 'border border-border hover:border-destructive'}`}
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
