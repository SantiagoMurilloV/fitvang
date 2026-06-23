import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronLeft, DollarSign, Search, Users, Calendar, ChevronRight, Camera, Trash2 } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { api } from '@/lib/api';
import { uploadAvatar } from '@/lib/cloudinary';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatCop } from '@/lib/utils';
import Swal from 'sweetalert2';

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
    onSuccess: () => { toast.success('Pago en efectivo registrado ✅'); setAmount(''); setNotes(''); onSuccess(); onClose(); },
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendees', session.id] }),
  });
  const bulk = useMutation({
    mutationFn: () => api.post('/attendance/bulk', { sessionId: session.id, presente: true }),
    onSuccess: () => { toast.success('Todos marcados presentes 🔥'); qc.invalidateQueries({ queryKey: ['attendees', session.id] }); },
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
                  {a.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">{a.estado}</p>
                </div>
                <button
                  onClick={() => setCashModal({ userId: a.userId, userName: a.nombre })}
                  className="size-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors shrink-0"
                >
                  <DollarSign className="size-4" />
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
      <AnimatePresence>
        {cashModal && (
          <CashPaymentModal
            userId={cashModal.userId} userName={cashModal.userName} open={true}
            onClose={() => setCashModal(null)}
            onSuccess={() => qc.invalidateQueries({ queryKey: ['attendees', session.id] })}
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
              <p className="text-2xl font-bold">{sc?.rachaActual ?? 0}{(sc?.rachaActual ?? 0) > 3 ? '🔥' : ''}</p>
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
        </>
      ) : (
        <Card><p className="text-sm text-muted-foreground text-center py-4">No se encontró el usuario.</p></Card>
      )}
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

  const groups: Record<string, SessionRow[]> = {};
  for (const s of sessions.data?.sessions ?? []) {
    (groups[s.fecha] ??= []).push(s);
  }

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
      {sessions.isLoading && <div className="space-y-2">{[0,1,2,3].map(i=><div key={i} className="h-16 rounded-2xl bg-card animate-pulse"/>)}</div>}
      {Object.entries(groups).map(([fecha, list]) => (
        <div key={fecha}>
          <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${fecha === today ? 'text-primary' : 'text-muted-foreground'}`}>
            {fecha === today ? 'HOY · ' : ''}{new Date(fecha + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          <div className="space-y-2">
            {list.map((s) => (
              <button key={s.id} onClick={() => setOpenSession(s)} className="w-full text-left">
                <Card className="flex items-center gap-3 hover:border-primary transition">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: s.trainingColor }} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{s.nombre.split('·')[0].trim()}</p>
                    <p className="text-xs text-muted-foreground">{s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${s.ocupados >= s.capacidadMax ? 'text-red-400' : 'text-primary'}`}>
                    {s.ocupados}/{s.capacidadMax}
                  </span>
                </Card>
              </button>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(groups).length === 0 && !sessions.isLoading && (
        <p className="text-center text-muted-foreground py-8 text-sm">Sin clases en esta semana.</p>
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
  const [uploading, setUploading] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['coach-me-profile'],
    queryFn: () => api.get<{ user: { id: string; nombre: string; email: string; telefono?: string | null; avatarUrl?: string | null } }>('/users/me/profile'),
  });

  const u = data?.user;
  const initials = u?.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes.'); return; }
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await api.patch('/users/me', { avatarUrl: url });
      refetch();
      qc.invalidateQueries({ queryKey: ['coach-me-profile'] });
      toast.success('Foto actualizada ✓');
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    const result = await Swal.fire({
      title: 'Eliminar foto', text: '¿Quitar tu foto de perfil?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar',
      background: '#0f0f11', color: '#f8f8f8', confirmButtonColor: '#ef4444', cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10', confirmButton: 'rounded-xl font-semibold', cancelButton: 'rounded-xl font-semibold' },
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch('/users/me', { avatarUrl: '' });
      refetch();
      toast.success('Foto eliminada');
    } catch {
      toast.error('No se pudo eliminar la foto.');
    }
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
            <button onClick={handleRemove} className="absolute -bottom-1 -left-1 size-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <Trash2 size={10} className="text-white" />
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        <div className="text-center">
          <p className="font-bold text-xl">{u.nombre}</p>
          <p className="text-sm text-muted-foreground">{u.email}</p>
          {u.telefono && <p className="text-xs text-muted-foreground mt-0.5">{u.telefono}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type CoachTab = 'hoy' | 'semana' | 'alumnos' | 'perfil';

import { User } from 'lucide-react';

const TABS: { key: CoachTab; label: string; icon: typeof Calendar }[] = [
  { key: 'hoy', label: 'Hoy', icon: Calendar },
  { key: 'semana', label: 'Semana', icon: Calendar },
  { key: 'alumnos', label: 'Alumnos', icon: Users },
  { key: 'perfil', label: 'Perfil', icon: User },
];

export function CoachDashboard() {
  const [tab, setTab] = useState<CoachTab>('hoy');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Coach</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-card rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'hoy' && <TodayTab />}
          {tab === 'semana' && <WeekTab />}
          {tab === 'alumnos' && <AlumnosTab />}
          {tab === 'perfil' && <CoachProfileTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
