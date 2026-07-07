import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronLeft, DollarSign, Search, ChevronRight, Camera, Trash2, Flame, Clock, Mail, Phone, LogOut, Shield } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { api } from '@/lib/api';
import { useAvatarUpload } from '@/lib/useAvatarUpload';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatCop } from '@/lib/utils';
import { AddBookingSection } from '@/components/admin/ClassesAdmin';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string; fecha: string; nombre: string; horaInicio: string; horaFin: string;
  capacidadMax: number; ocupados: number; estado: string; trainingColor: string;
}
interface Attendee {
  bookingId: string; userId: string; estado: string; nombre: string; avatarUrl?: string | null;
}
interface UserRow {
  id: string; nombre: string; email: string; documento: string;
  rol: string; esMenor: boolean; activo: boolean; avatarUrl?: string | null;
}
interface UserProfile {
  id: string; nombre: string; email: string; telefono?: string | null;
  avatarUrl?: string | null; fechaNacimiento?: string | null; genero?: string | null;
  esMenor: boolean; pesoKg?: string | null; alturaCm?: number | null; bio?: string | null;
  activo: boolean; createdAt: string;
}
interface Scoring {
  mes: string; totalSesiones: number; asistencias: number; porcentaje: number;
  rachaActual: number; rachaMaxima: number; nivel: string;
}
interface PaymentRow {
  id: string; monto: number; metodo: string; estado: string; createdAt: string; notas?: string | null;
  planNombre?: string | null; trainingNombre?: string | null; modalidad?: string | null;
  fechaInicio?: string | null; fechaFin?: string | null;
}
interface PlanInfo {
  id: string; planNombre: string; trainingNombre: string; trainingColor: string;
  modalidad: string; precioCopAplicado: number; fechaInicio: string; fechaFin: string;
  sesionesTotales: number | null; sesionesUsadas: number; estado: string;
  renovacionAutomatica: boolean;
  ultimoPago: { fecha: string; metodo: string; monto: number } | null;
}

const PAGO_ESTADO: Record<string, { label: string; cls: string }> = {
  exitoso: { label: 'Pagado', cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
  pendiente: { label: 'Pendiente', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  fallido: { label: 'Fallido', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  reembolsado: { label: 'Reembolsado', cls: 'text-muted-foreground bg-white/5 border-border' },
};
const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo', wompi_card: 'Tarjeta', wompi_nequi: 'Nequi', wompi_pse: 'PSE',
  transferencia: 'Transferencia', nequi: 'Nequi',
};
const MODALIDAD_LABEL: Record<string, string> = {
  individual: 'Individual', pareja: 'Pareja', amigos: 'Amigos',
};

// Fechas tipo 'yyyy-MM-dd' se parsean por partes para no correrse un día por timezone
function fmtFecha(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Cash Payment Modal ───────────────────────────────────────────────────────

function CashPaymentModal({ userId, userName, open, onClose, onSuccess }: {
  userId: string; userName: string; open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const pay = useMutation({
    mutationFn: () => api.post('/payments/efectivo', {
      userId, montoCop: Number(amount.replace(/\D/g, '')), notas: notes || 'Cobrado en clase',
    }),
    onSuccess: () => { toast.success('Pago en efectivo registrado'); setAmount(''); setNotes(''); onSuccess(); onClose(); },
    onError: () => toast.error('No se pudo registrar el pago'),
  });
  if (!open) return null;
  const formatted = amount ? Number(amount).toLocaleString('es-CO') : '';
  return createPortal(
    <div className="fixed inset-0 z-300 bg-black/60 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-[#1A1A1A] border-t border-border p-6 space-y-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <div>
          <h2 className="text-lg font-bold">Registrar pago en efectivo</h2>
          <p className="text-sm text-muted-foreground">{userName}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-background border border-border px-4 h-14">
          <span className="text-primary font-bold text-lg">$</span>
          <input
            type="tel" inputMode="numeric" placeholder="0" value={formatted}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            className="flex-1 bg-transparent text-2xl font-bold outline-none text-center"
          />
          <span className="text-muted-foreground text-sm">COP</span>
        </div>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones (opcional)" rows={2}
          className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm outline-none focus:border-primary transition resize-none"
        />
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1 border border-border" onClick={onClose} disabled={pay.isPending}>Cancelar</Button>
          <Button className="flex-1" loading={pay.isPending} disabled={!amount || Number(amount) <= 0} onClick={() => pay.mutate()}>Registrar</Button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ─── Plan Modal ───────────────────────────────────────────────────────────────

function PlanModal({ userId, userName, onClose }: { userId: string; userName: string; onClose: () => void }) {
  const ficha = useQuery({
    queryKey: ['user-planes', userId],
    queryFn: () => api.get<{ planesActivos: PlanInfo[] }>(`/users/${userId}/ficha`),
  });
  const planes = ficha.data?.planesActivos ?? [];
  return createPortal(
    <div className="fixed inset-0 z-300 bg-black/60 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-[#1A1A1A] border-t border-border p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <div>
          <h2 className="text-lg font-bold">Plan</h2>
          <p className="text-sm text-muted-foreground">{userName}</p>
        </div>
        {ficha.isLoading ? (
          <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : planes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin plan activo.</p>
        ) : (
          planes.map((p) => {
            const [y, m, d] = p.fechaFin.split('-').map(Number);
            const diasRestantes = Math.ceil((new Date(y, m - 1, d).getTime() - Date.now()) / 86400000);
            return (
              <div key={p.id} className="rounded-xl bg-background border border-border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: p.trainingColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{p.planNombre}</p>
                    <p className="text-xs text-muted-foreground">{p.trainingNombre} · {MODALIDAD_LABEL[p.modalidad] ?? p.modalidad}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 text-green-400 bg-green-500/10 border-green-500/20">Activo</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Vigencia</span>
                    <span className="font-medium text-right">{fmtFecha(p.fechaInicio)} – {fmtFecha(p.fechaFin)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Vence</span>
                    <span className={`font-medium ${diasRestantes <= 5 ? 'text-amber-400' : ''}`}>
                      {diasRestantes < 0 ? 'Vencido' : diasRestantes === 0 ? 'Hoy' : `En ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Sesiones</span>
                    <span className="font-medium">
                      {p.sesionesTotales == null ? 'Ilimitadas' : `${p.sesionesUsadas} de ${p.sesionesTotales} usadas`}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Precio</span>
                    <span className="font-medium">{formatCop(p.precioCopAplicado)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Pagado</span>
                    {p.ultimoPago ? (
                      <span className="font-medium text-right">
                        {new Date(p.ultimoPago.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} · {METODO_LABEL[p.ultimoPago.metodo] ?? p.ultimoPago.metodo}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin pago registrado</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>
    </div>,
    document.body,
  );
}

// ─── Session Detail ───────────────────────────────────────────────────────────

function SessionDetail({ session, onBack }: { session: SessionRow; onBack: () => void }) {
  const qc = useQueryClient();
  const [planModal, setPlanModal] = useState<{ userId: string; userName: string } | null>(null);
  const att = useQuery({
    queryKey: ['attendees', session.id],
    queryFn: () => api.get<{ attendees: Attendee[] }>(`/classes/sessions/${session.id}/attendees`),
  });
  const mark = useMutation({
    mutationFn: ({ bookingId, presente }: { bookingId: string; presente: boolean }) =>
      api.post('/attendance/mark', { bookingId, presente }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendees', session.id] }),
  });
  const bulk = useMutation({
    mutationFn: () => api.post('/attendance/bulk', { sessionId: session.id, presente: true }),
    onSuccess: () => { toast.success('Todos marcados presentes'); qc.invalidateQueries({ queryKey: ['attendees', session.id] }); },
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
                <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0">
                  {a.avatarUrl
                    ? <img src={a.avatarUrl} alt={a.nombre} className="size-10 rounded-full object-cover" />
                    : a.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">{a.estado}</p>
                </div>
                <button
                  onClick={() => setPlanModal({ userId: a.userId, userName: a.nombre })}
                  className="h-10 px-3 rounded-full border border-border flex items-center justify-center text-xs font-semibold hover:border-primary hover:text-primary transition-colors shrink-0"
                >
                  Ver plan
                </button>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => mark.mutate({ bookingId: a.bookingId, presente: true })}
                    className={`size-10 rounded-full grid place-items-center transition ${a.estado === 'asistio' ? 'bg-green-500 text-white' : 'border border-border hover:bg-green-500/20 hover:border-green-500'}`}
                  ><Check className="size-5" /></button>
                  <button
                    onClick={() => mark.mutate({ bookingId: a.bookingId, presente: false })}
                    className={`size-10 rounded-full grid place-items-center transition ${a.estado === 'no_asistio' ? 'bg-red-500 text-white' : 'border border-border hover:bg-red-500/20 hover:border-red-500'}`}
                  ><X className="size-5" /></button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {att.data?.attendees.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">Sin reservas en esta sesión.</p>
        )}
      </div>

      {/* Reservar a nombre de un alumno (mismo buscador que usa el admin) */}
      <Card className="p-0 overflow-hidden">
        <AddBookingSection
          session={session}
          attendeeIds={new Set((att.data?.attendees ?? []).filter((a) => a.estado !== 'no_asistio').map((a) => a.userId))}
          onAdded={() => {
            qc.invalidateQueries({ queryKey: ['attendees', session.id] });
            qc.invalidateQueries({ queryKey: ['coach-sessions'] });
            qc.invalidateQueries({ queryKey: ['coach-week'] });
          }}
        />
      </Card>
      <AnimatePresence>
        {planModal && (
          <PlanModal
            userId={planModal.userId} userName={planModal.userName}
            onClose={() => setPlanModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ficha de alumno ──────────────────────────────────────────────────────────

function UserFicha({ userId, onBack }: { userId: string; onBack: () => void }) {
  const profile = useQuery({
    queryKey: ['user-ficha', userId],
    queryFn: () => api.get<{ user: UserProfile }>(`/users/${userId}/ficha`),
  });
  const scoring = useQuery({
    queryKey: ['user-scoring', userId],
    queryFn: () => api.get<Scoring>(`/stats/${userId}/scoring`),
  });
  const qc = useQueryClient();
  const [cashOpen, setCashOpen] = useState(false);
  const paymentsQ = useQuery({
    queryKey: ['user-payments', userId],
    queryFn: () => api.get<{ payments: PaymentRow[] }>(`/payments?userId=${userId}&limit=20`),
  });
  const pagos = paymentsQ.data?.payments ?? [];

  const u = profile.data?.user;
  const sc = scoring.data;

  const initials = u ? u.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('') : '??';

  const pct = sc?.porcentaje ?? 0;
  const circumference = 2 * Math.PI * 30;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Alumnos
      </button>
      {profile.isLoading ? (
        <div className="space-y-3">
          <div className="h-32 rounded-2xl bg-card animate-pulse" />
          <div className="h-24 rounded-2xl bg-card animate-pulse" />
        </div>
      ) : u ? (
        <>
          <Card className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center overflow-hidden shrink-0">
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.nombre} className="size-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">{u.nombre}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              {u.telefono && <p className="text-xs text-muted-foreground">{u.telefono}</p>}
              {u.esMenor && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Menor de edad</span>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="flex flex-col items-center text-center py-3">
              <svg viewBox="0 0 68 68" className="-rotate-90 size-16">
                <circle cx="34" cy="34" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <motion.circle
                  cx="34" cy="34" r="30" stroke="#3DC4DB" strokeWidth="6" strokeLinecap="round" fill="none"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <p className="text-xs text-muted-foreground -mt-1">{pct}% asistencia</p>
            </Card>
            <Card className="flex flex-col items-center text-center">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">{sc?.rachaActual ?? 0}{(sc?.rachaActual ?? 0) > 3 && <Flame className="size-5 text-orange-400" />}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Racha</p>
            </Card>
            <Card className="flex flex-col items-center text-center">
              <p className="text-2xl font-bold">{sc?.asistencias ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Asist. mes</p>
            </Card>
          </div>

          {(u.pesoKg || u.alturaCm) && (
            <Card className="grid grid-cols-2 gap-3">
              {u.pesoKg && (
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Peso</p><p className="font-bold mt-0.5">{u.pesoKg} kg</p></div>
              )}
              {u.alturaCm && (
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Altura</p><p className="font-bold mt-0.5">{u.alturaCm} cm</p></div>
              )}
              {u.pesoKg && u.alturaCm && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">IMC</p>
                  <p className="font-bold mt-0.5">{(Number(u.pesoKg) / Math.pow(u.alturaCm / 100, 2)).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kg/m²</span></p>
                </div>
              )}
            </Card>
          )}

          {u.bio && (
            <Card>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sobre mí</p>
              <p className="text-sm text-muted-foreground">{u.bio}</p>
            </Card>
          )}

          {/* Historial de pagos */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pagos</p>
              <button
                onClick={() => setCashOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <DollarSign className="size-3.5" /> Registrar efectivo
              </button>
            </div>
            {paymentsQ.isLoading ? (
              <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : pagos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados.</p>
            ) : (
              <div className="space-y-2">
                {pagos.map((p) => {
                  const est = PAGO_ESTADO[p.estado] ?? PAGO_ESTADO.pendiente;
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{formatCop(p.monto)}</p>
                        {p.planNombre && (
                          <p className="text-xs text-foreground/80 truncate">
                            {p.planNombre}
                            {p.trainingNombre ? ` · ${p.trainingNombre}` : ''}
                            {p.modalidad ? ` · ${MODALIDAD_LABEL[p.modalidad] ?? p.modalidad}` : ''}
                          </p>
                        )}
                        {p.fechaInicio && p.fechaFin && (
                          <p className="text-[11px] text-muted-foreground">
                            Cubre {fmtFecha(p.fechaInicio)} – {fmtFecha(p.fechaFin)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {METODO_LABEL[p.metodo] ?? p.metodo} · {new Date(p.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${est.cls}`}>{est.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card><p className="text-sm text-muted-foreground text-center py-4">No se encontró el usuario.</p></Card>
      )}

      <AnimatePresence>
        {cashOpen && u && (
          <CashPaymentModal
            userId={userId}
            userName={u.nombre}
            open={cashOpen}
            onClose={() => setCashOpen(false)}
            onSuccess={() => qc.invalidateQueries({ queryKey: ['user-payments', userId] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Hoy ─────────────────────────────────────────────────────────────────

function TodayTab() {
  const [openSession, setOpenSession] = useState<SessionRow | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const sessions = useQuery({
    queryKey: ['coach-sessions', today],
    queryFn: () => api.get<{ sessions: SessionRow[] }>(`/classes/sessions?from=${today}&to=${today}`),
  });

  if (openSession) return <SessionDetail session={openSession} onBack={() => setOpenSession(null)} />;

  return (
    <div className="space-y-3">
      {sessions.isLoading && [0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse flex gap-3">
          <div className="w-1 h-10 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2"><div className="h-4 w-32 bg-white/10 rounded" /><div className="h-3 w-20 bg-white/10 rounded" /></div>
        </div>
      ))}
      {sessions.data?.sessions.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">No hay clases hoy.</p>
      )}
      {sessions.data?.sessions.map((s) => (
        <button key={s.id} onClick={() => setOpenSession(s)} className="w-full text-left">
          <Card className="flex items-center gap-3 hover:border-primary transition cursor-pointer">
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: s.trainingColor }} />
            <div className="flex-1">
              <p className="font-semibold">{s.nombre.split('·')[0].trim()}</p>
              <p className="text-xs text-muted-foreground">{s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)}</p>
            </div>
            <span className={`text-sm font-bold ${s.ocupados >= s.capacidadMax ? 'text-red-400' : 'text-primary'}`}>
              {s.ocupados}/{s.capacidadMax}
            </span>
          </Card>
        </button>
      ))}
    </div>
  );
}

// ─── Tab: Semana ─────────────────────────────────────────────────────────────

function WeekTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [openSession, setOpenSession] = useState<SessionRow | null>(null);
  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const from = format(monday, 'yyyy-MM-dd');
  const to = format(addDays(monday, 6), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const sessions = useQuery({
    queryKey: ['coach-week', from, to],
    queryFn: () => api.get<{ sessions: SessionRow[] }>(`/classes/sessions?from=${from}&to=${to}`),
  });

  if (openSession) return <SessionDetail session={openSession} onBack={() => setOpenSession(null)} />;

  const allSessions = sessions.data?.sessions ?? [];
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { iso: format(date, 'yyyy-MM-dd'), date };
  });
  const times = Array.from(new Set(allSessions.map((s) => s.horaInicio.slice(0, 5)))).sort();
  const cellMap = new Map<string, SessionRow[]>();
  for (const s of allSessions) {
    const key = `${s.fecha}|${s.horaInicio.slice(0, 5)}`;
    const arr = cellMap.get(key) ?? [];
    arr.push(s);
    cellMap.set(key, arr);
  }

  const cap = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{format(monday, 'd MMM')} – {format(addDays(monday, 6), 'd MMM')}</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="size-8 rounded-full border border-border flex items-center justify-center hover:border-primary transition"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setWeekOffset(0)} className="px-2 h-8 text-xs rounded-full border border-border hover:border-primary transition">Hoy</button>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="size-8 rounded-full border border-border flex items-center justify-center hover:border-primary transition"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {sessions.isLoading ? (
        <div className="h-64 rounded-lg bg-card animate-pulse" />
      ) : times.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Sin clases en esta semana.</p>
      ) : (
        <div className="overflow-x-auto -mx-4 px-0 rounded-lg border border-border bg-card">
          <div className="p-3" style={{ minWidth: '680px' }}>
            {/* Cabecera días */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '40px repeat(7, minmax(84px, 1fr))' }}>
              <div className="flex items-center justify-center">
                <Clock size={12} className="text-muted-foreground" />
              </div>
              {days.map((d) => {
                const isToday = d.iso === today;
                const wd = d.date.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '');
                return (
                  <div key={d.iso} className={`text-center py-2 border-b-2 ${isToday ? 'border-primary' : 'border-transparent'}`}>
                    <p className={`text-[11px] font-semibold tracking-wide uppercase ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{cap(wd)}</p>
                    <p className={`text-base font-bold mt-0.5 ${isToday ? 'text-primary' : ''}`}>{format(d.date, 'd')}</p>
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-border mb-2" />

            {/* Filas por hora */}
            {times.map((hour) => (
              <div key={hour} className="grid gap-1 mb-1 min-h-[60px]" style={{ gridTemplateColumns: '40px repeat(7, minmax(84px, 1fr))' }}>
                <div className="flex items-start justify-end pr-2 pt-2">
                  <span className="text-[10px] text-muted-foreground font-mono">{hour}</span>
                </div>
                {days.map((d) => {
                  const list = cellMap.get(`${d.iso}|${hour}`) ?? [];
                  return (
                    <div key={d.iso} className="space-y-1 min-h-[56px] bg-white/1.5 border border-white/5 rounded-md p-1">
                      {list.map((s) => {
                        const full = s.ocupados >= s.capacidadMax;
                        const color = s.trainingColor || '#3DC4DB';
                        return (
                          <button
                            key={s.id}
                            onClick={() => setOpenSession(s)}
                            className="w-full text-left rounded-md p-1.5 border transition active:scale-[0.98]"
                            style={{ borderLeftColor: color, borderLeftWidth: 3, backgroundColor: `${color}18`, borderColor: `${color}30` }}
                          >
                            <p className="text-[10px] font-semibold truncate leading-tight">{s.nombre.split('·')[0].trim()}</p>
                            <p className="text-[9px] text-muted-foreground">{s.horaInicio.slice(0, 5)}</p>
                            <p className={`text-[9px] font-bold ${full ? 'text-red-400' : 'text-primary'}`}>{s.ocupados}/{s.capacidadMax}</p>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Alumnos ─────────────────────────────────────────────────────────────

function AlumnosTab() {
  const [q, setQ] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ['coach-users', q],
    queryFn: () => api.get<{ users: UserRow[] }>(`/users?q=${encodeURIComponent(q)}&rol=user`),
  });

  if (selectedUser) return <UserFicha userId={selectedUser} onBack={() => setSelectedUser(null)} />;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar alumno..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm"
        />
      </div>
      <div className="space-y-2">
        {users.isLoading && [0,1,2,3].map(i=><div key={i} className="h-16 rounded-2xl bg-card animate-pulse"/>)}
        {users.data?.users.map((u) => (
          <button key={u.id} onClick={() => setSelectedUser(u.id)} className="w-full text-left">
            <Card className="flex items-center gap-3 hover:border-primary transition cursor-pointer">
              <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0">
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt={u.nombre} className="size-10 rounded-full object-cover" />
                  : u.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{u.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              {u.esMenor && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">Menor</span>
              )}
              <ChevronLeft className="size-4 text-muted-foreground rotate-180 shrink-0" />
            </Card>
          </button>
        ))}
        {users.data?.users.length === 0 && !users.isLoading && (
          <p className="text-center text-muted-foreground py-8 text-sm">No se encontraron alumnos.</p>
        )}
      </div>
    </div>
  );
}

// ─── Coach Profile Tab ────────────────────────────────────────────────────────

function CoachProfileTab() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ['coach-me-profile'],
    queryFn: () => api.get<{ user: { id: string; nombre: string; email: string; telefono?: string | null; avatarUrl?: string | null } }>('/users/me/profile'),
  });

  const u = data?.user;
  const initials = u?.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  const { uploading, upload, remove } = useAvatarUpload({
    patchPath: '/users/me',
    onDone: () => { refetch(); qc.invalidateQueries({ queryKey: ['coach-me-profile'] }); },
  });

  function logout() {
    api.post('/auth/logout').catch(() => {}).finally(() => { window.location.href = '/'; });
  }

  if (!u) return <div className="h-32 rounded-2xl bg-card animate-pulse" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          <div className="size-24 rounded-full overflow-hidden bg-card border-2 border-primary/30 flex items-center justify-center">
            {u.avatarUrl
              ? <img src={u.avatarUrl} alt={u.nombre} className="size-full object-cover" />
              : <span className="text-3xl font-bold text-primary">{initials}</span>
            }
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary text-background flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {uploading
              ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <Camera size={14} />
            }
          </button>
          {u.avatarUrl && (
            <button onClick={remove} className="absolute -bottom-1 -left-1 size-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <Trash2 size={10} className="text-white" />
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </div>
        <div className="text-center">
          <p className="font-bold text-xl">{u.nombre}</p>
          <p className="text-sm text-muted-foreground">{u.email}</p>
        </div>
      </div>

      {/* Detalles */}
      <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Shield className="size-4 text-primary shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">Rol</span>
          <span className="text-sm font-medium">Entrenador</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Mail className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">Email</span>
          <span className="text-sm font-medium truncate max-w-[60%] text-right">{u.email}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Phone className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">Teléfono</span>
          <span className="text-sm font-medium">{u.telefono || '—'}</span>
        </div>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={logout}
        className="w-full h-12 rounded-xl border border-red-500/30 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="size-4" /> Cerrar sesión
      </button>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export type CoachTab = 'hoy' | 'semana' | 'alumnos' | 'perfil';

export function CoachDashboard({ tab = 'hoy' }: { tab?: CoachTab }) {
  return (
    <div className="space-y-5">
      {tab === 'hoy' && (
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      )}

      {tab === 'hoy' && <TodayTab />}
      {tab === 'semana' && <WeekTab />}
      {tab === 'alumnos' && <AlumnosTab />}
      {tab === 'perfil' && <CoachProfileTab />}
    </div>
  );
}
