import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronLeft, DollarSign } from 'lucide-react';
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

// ─── Cash Payment Modal ───────────────────────────────────────────────────────

interface CashPaymentModalProps {
  userId: string;
  userName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CashPaymentModal({ userId, userName, open, onClose, onSuccess }: CashPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pay = useMutation({
    mutationFn: () =>
      api.post('/payments/efectivo', {
        userId,
        montoCop: Number(amount.replace(/\D/g, '')),
        notas: notes || 'Cobrado en clase',
      }),
    onSuccess: () => {
      toast.success('Pago en efectivo registrado ✅');
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('No se pudo registrar el pago'),
  });

  if (!open) return null;

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setAmount(digits);
  };

  const formatted = amount ? Number(amount).toLocaleString('es-CO') : '';

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black/60 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-[#1A1A1A] border-t border-border p-6 space-y-5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <div>
          <h2 className="text-lg font-bold">Registrar pago en efectivo</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{userName}</p>
        </div>

        {/* Amount input */}
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Monto</label>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-background border border-border px-4 h-14">
            <span className="text-primary font-bold text-lg">$</span>
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              placeholder="0"
              value={formatted}
              onChange={(e) => handleAmountChange(e.target.value.replace(/\./g, '').replace(/,/g, ''))}
              className="flex-1 bg-transparent text-2xl font-bold outline-none text-center"
            />
            <span className="text-muted-foreground text-sm">COP</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Observaciones <span className="normal-case">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones..."
            rows={2}
            className="mt-1.5 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm outline-none focus:border-primary transition resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 border border-border"
            onClick={onClose}
            disabled={pay.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            loading={pay.isPending}
            disabled={!amount || Number(amount) <= 0}
            onClick={() => pay.mutate()}
          >
            Registrar
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

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
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <div className="space-y-2">
        {sessions.isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse flex gap-3">
                <div className="w-1 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded" />
                  <div className="h-3 w-20 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
        {sessions.data?.sessions.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">No hay clases hoy.</p>
        )}
        {sessions.data?.sessions.map((s) => (
          <button key={s.id} onClick={() => setOpenSession(s)} className="w-full text-left">
            <Card className="flex items-center gap-3 hover:border-primary transition cursor-pointer">
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: s.trainingColor }}
              />
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

// ─── Session Detail ───────────────────────────────────────────────────────────

function SessionDetail({ session, onBack }: { session: SessionRow; onBack: () => void }) {
  const qc = useQueryClient();
  const [cashModal, setCashModal] = useState<{ userId: string; userName: string } | null>(null);

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

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Volver
      </button>
      <div>
        <h1 className="text-2xl font-bold">{session.nombre.split('·')[0].trim()}</h1>
        <p className="text-sm text-muted-foreground">
          {session.horaInicio.slice(0, 5)} – {session.horaFin.slice(0, 5)} ·{' '}
          {session.ocupados}/{session.capacidadMax}
        </p>
      </div>

      <Button
        onClick={() => bulk.mutate()}
        loading={bulk.isPending}
        className="w-full"
        variant="outline"
      >
        Marcar todos presentes
      </Button>

      <div className="space-y-2">
        <AnimatePresence>
          {(att.data?.attendees ?? []).map((a) => (
            <motion.div key={a.bookingId} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0">
                  {a.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">{a.estado}</p>
                </div>

                {/* Cash payment button */}
                <button
                  onClick={() => setCashModal({ userId: a.userId, userName: a.nombre })}
                  className="size-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors shrink-0"
                  title="Registrar pago en efectivo"
                >
                  <DollarSign className="size-4" />
                </button>

                {/* Attendance buttons */}
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => mark.mutate({ bookingId: a.bookingId, presente: true })}
                    className={`size-10 rounded-full grid place-items-center transition ${
                      a.estado === 'asistio'
                        ? 'bg-green-500 text-white'
                        : 'border border-border hover:bg-green-500/20 hover:border-green-500'
                    }`}
                  >
                    <Check className="size-5" />
                  </button>
                  <button
                    onClick={() => mark.mutate({ bookingId: a.bookingId, presente: false })}
                    className={`size-10 rounded-full grid place-items-center transition ${
                      a.estado === 'no_asistio'
                        ? 'bg-red-500 text-white'
                        : 'border border-border hover:bg-red-500/20 hover:border-red-500'
                    }`}
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {cashModal && (
          <CashPaymentModal
            userId={cashModal.userId}
            userName={cashModal.userName}
            open={true}
            onClose={() => setCashModal(null)}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['attendees', session.id] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
