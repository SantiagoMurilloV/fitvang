import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Users2, Activity, DollarSign, BookOpen, Trophy, Radio, X, Send, Search, Check, Bell, Trash2, History, Flame, ChevronLeft, Sprout, Medal, Zap, Crown, CalendarPlus, Wallet, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatCop } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function nowInColombia() {
  // Colombia = UTC-5, sin cambio de horario
  const now = new Date();
  const col = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  return col;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

interface Overview {
  usuariosActivos: number;
  planesActivos: number;
  ingresosMesCop: number;
  clasesHoy: number;
}

interface Session {
  id: string;
  nombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  trainingColor: string;
  ocupados: number;
  capacidadMax: number;
  estado: string;
}

interface KpiCardProps {
  icon: React.ElementType;
  iconColor: string;
  value: string | number;
  label: string;
  onClick?: () => void;
}

function KpiCard({ icon: Icon, iconColor, value, label, onClick }: KpiCardProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl bg-card border border-border p-3 flex items-center gap-3 text-left w-full transition-all ${onClick ? 'hover:border-primary/50 hover:bg-card/80 active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight truncate">{value}</p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      </div>
    </button>
  );
}

function LiveClassCard({ session }: { session: Session }) {
  const pct = session.capacidadMax > 0 ? Math.round((session.ocupados / session.capacidadMax) * 100) : 0;
  return (
    <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4">
      <div
        className="w-1.5 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: session.trainingColor || '#3DC4DB' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-green-400 animate-pulse" />
          <p className="font-semibold text-sm truncate">{session.nombre}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{session.horaInicio} – {session.horaFin}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{session.ocupados}/{session.capacidadMax}</span>
        </div>
      </div>
    </div>
  );
}

interface Student {
  id: string;
  nombre: string;
  avatarUrl?: string | null;
  esMenor?: boolean;
  rachaActual: number;
  rachaMaxima: number;
  asistencias: number;
  totalSesiones: number;
  porcentaje: number;
  nivel: string;
}

const NIVEL_INFO: Record<string, { Icon: LucideIcon; color: string; label: string }> = {
  rookie: { Icon: Sprout, color: '#4ade80', label: 'Rookie' },
  regular: { Icon: Medal, color: '#3DC4DB', label: 'Regular' },
  constante: { Icon: Flame, color: '#facc15', label: 'Constante' },
  elite: { Icon: Zap, color: '#f87171', label: 'Elite' },
  leyenda: { Icon: Crown, color: '#fbbf24', label: 'Leyenda' },
};

function StudentProgressDetail({ student }: { student: Student }) {
  const nivel = NIVEL_INFO[student.nivel] ?? NIVEL_INFO.rookie;
  const NivelIcon = nivel.Icon;
  const initials = student.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Encabezado del estudiante */}
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-primary/20 grid place-items-center text-xl font-bold text-primary shrink-0 overflow-hidden">
          {student.avatarUrl ? <img src={student.avatarUrl} alt={student.nombre} className="size-full object-cover" /> : initials}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold truncate">{student.nombre}</p>
          <span
            className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full border"
            style={{ color: nivel.color, borderColor: `${nivel.color}55`, background: `${nivel.color}1a` }}
          >
            <NivelIcon className="size-3.5" /> {nivel.label}
          </span>
        </div>
      </div>

      {/* Asistencia del mes */}
      <div className="rounded-2xl bg-card border border-border p-5 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Asistencia este mes</p>
        <p className="text-4xl font-bold mt-2">{student.porcentaje}%</p>
        <p className="text-sm text-muted-foreground mt-1">{student.asistencias} de {student.totalSesiones} reservas</p>
      </div>

      {/* Rachas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Flame className="size-5 text-orange-400" />
            <p className="text-2xl font-bold">{student.rachaActual}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Racha actual</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Trophy className="size-5 text-amber-400" />
            <p className="text-2xl font-bold">{student.rachaMaxima}</p>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Récord</p>
        </div>
      </div>
    </div>
  );
}

function StudentsProgressModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => api.get<{ students: Student[] }>('/stats/students'),
  });
  const students = data?.students ?? [];
  const filtered = q.trim()
    ? students.filter((s) => s.nombre.toLowerCase().includes(q.toLowerCase()))
    : students;
  const selected = selectedId ? students.find((s) => s.id === selectedId) ?? null : null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
        {selected ? (
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1 text-base font-bold hover:text-primary transition-colors"
          >
            <ChevronLeft size={20} className="text-muted-foreground" />
            Volver
          </button>
        ) : (
          <h2 className="text-base font-bold">Progreso de estudiantes</h2>
        )}
        <button
          onClick={onClose}
          className="ml-auto size-9 rounded-full bg-card border border-border grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {selected ? (
          <StudentProgressDetail student={selected} />
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {/* Buscador */}
            <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-card border border-border">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar estudiante…"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {q ? 'Sin resultados.' : 'No hay estudiantes registrados.'}
              </p>
            ) : (
              filtered.map((s) => {
                const initials = s.nombre.split(' ').map((x) => x[0]).slice(0, 2).join('');
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
                  >
                    <div className="size-11 rounded-full bg-primary/20 grid place-items-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                      {s.avatarUrl ? <img src={s.avatarUrl} alt={s.nombre} className="size-full object-cover" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.nombre}</p>
                      {s.esMenor && <span className="text-[10px] text-muted-foreground">Niño</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Flame className="size-4 text-orange-400" />
                      <span className="text-sm font-bold tabular-nums">{s.rachaActual}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PickUser {
  id: string;
  nombre: string;
  email?: string;
  avatarUrl?: string | null;
  rol: 'super_admin' | 'coach' | 'user';
  esAcudiente?: boolean;
  menoresACargo?: number;
  activo?: boolean;
}

interface NotifTemplate {
  id: string;
  titulo: string;
  mensaje: string;
  updatedAt: string;
}

type AudienceKey = 'miembros' | 'acudientes' | 'coaches';
type UserType = 'miembro' | 'acudiente' | 'coach' | 'admin';

const AUDIENCES: { key: AudienceKey; label: string }[] = [
  { key: 'miembros', label: 'Miembros' },
  { key: 'acudientes', label: 'Acudientes' },
  { key: 'coaches', label: 'Coaches' },
];

const TYPE_LABEL: Record<UserType, string> = {
  miembro: 'Miembro',
  acudiente: 'Acudiente',
  coach: 'Coach',
  admin: 'Admin',
};

function userType(u: PickUser): UserType {
  if (u.rol === 'coach') return 'coach';
  if (u.rol === 'super_admin') return 'admin';
  return u.esAcudiente ? 'acudiente' : 'miembro';
}

function inAudience(u: PickUser, key: AudienceKey): boolean {
  if (key === 'coaches') return u.rol === 'coach';
  // Acudiente = flag esAcudiente O cliente con menores vinculados (igual que el backend)
  if (key === 'acudientes') return u.rol === 'user' && (!!u.esAcudiente || (u.menoresACargo ?? 0) > 0);
  return u.rol === 'user' && !u.esAcudiente; // miembros
}

// Pantallas a las que puede apuntar la notificación al tocarla.
const LINKS: { label: string; value: string }[] = [
  { label: 'Sin enlace', value: '' },
  { label: 'Inicio', value: '/app' },
  { label: 'Horarios', value: '/app/horarios' },
  { label: 'Pagos', value: '/app/pagos' },
  { label: 'Scoring', value: '/app/asistencias' },
  { label: 'Mi recorrido', value: '/app/recorrido' },
];

function SendNotificationModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [audiences, setAudiences] = useState<Set<AudienceKey>>(
    new Set<AudienceKey>(['miembros', 'acudientes', 'coaches']),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enlace, setEnlace] = useState('');
  const [q, setQ] = useState('');

  const usersQ = useQuery({
    queryKey: ['admin-users-notify'],
    queryFn: () => api.get<{ users: PickUser[] }>('/users'),
  });
  // Solo usuarios activos (los inactivos no reciben notificaciones).
  const users = (usersQ.data?.users ?? []).filter((u) => u.activo !== false);

  const audienceCount = (key: AudienceKey) => users.filter((u) => inAudience(u, key)).length;
  // Usuarios únicos: un cliente-acudiente matchea dos audiencias pero recibe una sola notificación
  const allCount = users.filter((u) => [...audiences].some((k) => inAudience(u, k))).length;

  const toggleAudience = (key: AudienceKey) =>
    setAudiences((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const templatesQ = useQuery({
    queryKey: ['admin-notify-templates'],
    queryFn: () => api.get<{ templates: NotifTemplate[] }>('/notifications/templates'),
  });
  const templates = templatesQ.data?.templates ?? [];

  const delTemplate = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notify-templates'] }),
  });

  const filtered = q.trim()
    ? users.filter(
        (u) =>
          u.nombre.toLowerCase().includes(q.toLowerCase()) ||
          (u.email ?? '').toLowerCase().includes(q.toLowerCase()),
      )
    : users;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allFilteredSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((u) => next.delete(u.id));
      else filtered.forEach((u) => next.add(u.id));
      return next;
    });

  const send = useMutation({
    mutationFn: () =>
      api.post<{ ok: boolean; sent: number }>('/notifications/broadcast', {
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
        target,
        audiences: target === 'all' ? [...audiences] : undefined,
        userIds: target === 'specific' ? [...selected] : undefined,
        deepLinkUrl: enlace || undefined,
      }),
    onSuccess: (res) => {
      toast.success(`Notificación enviada a ${res.sent} usuario${res.sent !== 1 ? 's' : ''}`);
      qc.invalidateQueries({ queryKey: ['admin-notify-templates'] });
      onClose();
    },
    onError: () => toast.error('No se pudo enviar la notificación.'),
  });

  const destinatarios = target === 'all' ? allCount : selected.size;
  const canSend =
    titulo.trim().length > 0 &&
    mensaje.trim().length > 0 &&
    (target === 'all' ? audiences.size > 0 : selected.size > 0) &&
    !send.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-xl bg-primary/15 grid place-items-center">
              <Bell className="size-4.5 text-primary" />
            </span>
            <h2 className="text-xl font-bold">Envío de notificaciones</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 overflow-y-auto flex-1 space-y-4">
          {/* Historial reutilizable */}
          {templates.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <History className="size-3.5" />
                Historial
              </label>
              <div className="mt-1 space-y-1.5 max-h-32 overflow-y-auto">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-xl bg-background border border-border pl-3 pr-1.5 py-1.5"
                  >
                    <button
                      onClick={() => { setTitulo(t.titulo); setMensaje(t.mensaje); }}
                      className="flex-1 min-w-0 text-left"
                      title="Reutilizar este mensaje"
                    >
                      <p className="text-sm font-medium truncate">{t.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.mensaje}</p>
                    </button>
                    <button
                      onClick={() => delTemplate.mutate(t.id)}
                      disabled={delTemplate.isPending}
                      className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                      title="Eliminar del historial"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              placeholder="Ej. Clase cancelada hoy"
              className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Mensaje */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Mensaje</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Escribe el mensaje que recibirán…"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right mt-0.5">{mensaje.length}/500</p>
          </div>

          {/* Enlace (opcional) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Al tocar, abrir (opcional)</label>
            <select
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary transition-colors"
            >
              {LINKS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Destinatarios */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Destinatarios</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                onClick={() => setTarget('all')}
                className={`h-10 rounded-xl text-sm font-medium border transition-colors ${
                  target === 'all'
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Por tipo
              </button>
              <button
                onClick={() => setTarget('specific')}
                className={`h-10 rounded-xl text-sm font-medium border transition-colors ${
                  target === 'specific'
                    ? 'bg-primary/15 border-primary text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Específicos
              </button>
            </div>
          </div>

          {target === 'all' ? (
            <div className="space-y-1.5">
              {AUDIENCES.map((a) => {
                const checked = audiences.has(a.key);
                return (
                  <button
                    key={a.key}
                    onClick={() => toggleAudience(a.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background border border-border hover:bg-white/5 transition-colors text-left"
                  >
                    <span
                      className={`size-5 rounded-md border grid place-items-center shrink-0 transition-colors ${
                        checked ? 'bg-primary border-primary' : 'border-border'
                      }`}
                    >
                      {checked && <Check className="size-3.5 text-primary-foreground" />}
                    </span>
                    <span className="flex-1 text-sm font-medium">{a.label}</span>
                    <span className="text-xs text-muted-foreground">{audienceCount(a.key)}</span>
                  </button>
                );
              })}
              <p className="text-xs text-muted-foreground pt-0.5">
                Se enviará a <span className="font-semibold text-foreground">{allCount}</span> usuario
                {allCount !== 1 ? 's' : ''}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Buscador */}
              <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-background border border-border">
                <Search className="size-4 text-muted-foreground shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar usuario…"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
                {filtered.length > 0 && (
                  <button onClick={toggleAllFiltered} className="text-xs text-primary hover:underline">
                    {allFilteredSelected ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                )}
              </div>

              {/* Lista — todos los tipos de usuario */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border/60">
                {usersQ.isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Cargando usuarios…</p>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin resultados.</p>
                ) : (
                  filtered.map((u) => {
                    const checked = selected.has(u.id);
                    const initials = u.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggle(u.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="size-8 rounded-full bg-primary/20 grid place-items-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt={u.nombre} className="size-full object-cover" /> : initials}
                        </div>
                        <span className="flex-1 min-w-0 text-sm truncate">{u.nombre}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-border text-muted-foreground shrink-0">
                          {TYPE_LABEL[userType(u)]}
                        </span>
                        <span
                          className={`size-5 rounded-md border grid place-items-center shrink-0 transition-colors ${
                            checked ? 'bg-primary border-primary' : 'border-border'
                          }`}
                        >
                          {checked && <Check className="size-3.5 text-primary-foreground" />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex-shrink-0">
          <button
            onClick={() => send.mutate()}
            disabled={!canSend}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {send.isPending ? (
              <span className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {send.isPending
              ? 'Enviando…'
              : `Enviar${destinatarios > 0 ? ` a ${destinatarios}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [now, setNow] = useState(nowInColombia);
  const today = format(now, 'yyyy-MM-dd');
  const [showProgress, setShowProgress] = useState(false);
  const [showSend, setShowSend] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(nowInColombia()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<Overview>('/stats/admin/overview'),
    refetchInterval: 60_000,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-today', today],
    queryFn: () => api.get<{ sessions: Session[] }>(`/classes/sessions?from=${today}&to=${today}`),
    refetchInterval: 30_000,
  });

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const liveSessions = (sessionsData?.sessions ?? []).filter((s) =>
    s.estado === 'programada' &&
    s.fecha === today &&
    toMinutes(s.horaInicio) <= nowMin &&
    nowMin < toMinutes(s.horaFin)
  );

  return (
    <>
      <div className="space-y-6">
        <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>

        {/* KPI — 2 columnas en móvil, 4 en pantallas anchas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <KpiCard
            icon={Users2}
            iconColor="bg-blue-500/10 text-blue-400"
            value={overview?.usuariosActivos ?? '—'}
            label="Usuarios activos"
          />
          <KpiCard
            icon={Activity}
            iconColor="bg-green-500/10 text-green-400"
            value={overview?.clasesHoy ?? '—'}
            label="Clases hoy"
          />
          <KpiCard
            icon={DollarSign}
            iconColor="bg-emerald-500/10 text-emerald-400"
            value={overview ? formatCop(overview.ingresosMesCop) : '—'}
            label="Ingresos del mes"
            onClick={() => { window.location.href = '/admin/finanzas'; }}
          />
          <KpiCard
            icon={BookOpen}
            iconColor="bg-purple-500/10 text-purple-400"
            value={overview?.planesActivos ?? '—'}
            label="Planes activos"
            onClick={() => { window.location.href = '/admin/planes-activos'; }}
          />
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { window.location.href = '/admin/reservar'; }}
            className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex flex-col gap-2 text-left hover:bg-emerald-500/15 transition-colors"
          >
            <CalendarPlus className="size-5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-300 leading-tight">Hacer reserva</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">A nombre de un usuario</p>
            </div>
          </button>

          <button
            onClick={() => { window.location.href = '/admin/deudores'; }}
            className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex flex-col gap-2 text-left hover:bg-red-500/15 transition-colors"
          >
            <Wallet className="size-5 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-300 leading-tight">Deudores</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Usuarios con saldo pendiente</p>
            </div>
          </button>

          <button
            onClick={() => setShowProgress(true)}
            className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex flex-col gap-2 text-left hover:bg-amber-500/15 transition-colors"
          >
            <Trophy className="size-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-300 leading-tight">Progreso de estudiantes</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Rachas y asistencias</p>
            </div>
          </button>

          <button
            onClick={() => setShowSend(true)}
            className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex flex-col gap-2 text-left hover:bg-primary/15 transition-colors"
          >
            <Bell className="size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary leading-tight">Envío de notificaciones</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Avisa a tus usuarios</p>
            </div>
          </button>
        </div>

        {/* Clases en vivo */}
        {liveSessions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Radio size={13} className="text-red-400 animate-pulse" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">En vivo</h2>
              <span className="text-xs text-muted-foreground ml-auto">{format(now, 'HH:mm')}</span>
            </div>
            <div className="space-y-2">
              {liveSessions.map((s) => <LiveClassCard key={s.id} session={s} />)}
            </div>
          </div>
        )}
      </div>

      {showProgress && <StudentsProgressModal onClose={() => setShowProgress(false)} />}
      {showSend && <SendNotificationModal onClose={() => setShowSend(false)} />}
    </>
  );
}

