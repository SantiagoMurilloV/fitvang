import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, ChevronRight, Shield, Users2, Baby, UserCheck, X, ToggleLeft, ToggleRight, HeartHandshake } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import Swal from 'sweetalert2';

type Role = 'super_admin' | 'coach' | 'user';

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  rol: Role;
  esMenor: boolean;
  activo: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

interface PlanType {
  id: string;
  nombre: string;
  precioBaseCop: number;
  trainingNombre: string;
}

interface ScoringData {
  asistenciasMes: number;
  rachaActual: number;
  puntajeMes: number;
}

interface ProfileUser {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: Role;
  activo: boolean;
  esMenor: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  bio?: string;
}

// ── Tabs de tipo de usuario ───────────────────────────────────────────────
const USER_TABS = [
  { key: 'user', label: 'Clientes', icon: Users2, color: 'text-blue-400' },
  { key: 'coach', label: 'Entrenadores', icon: UserCheck, color: 'text-green-400' },
  { key: 'menor', label: 'Menores', icon: Baby, color: 'text-amber-400' },
  { key: 'acudiente', label: 'Acudientes', icon: HeartHandshake, color: 'text-pink-400' },
  { key: 'super_admin', label: 'Admin', icon: Shield, color: 'text-purple-400' },
] as const;

type TabKey = typeof USER_TABS[number]['key'];

// ── Perfil de usuario (modal) ─────────────────────────────────────────────
function UserProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-ficha', userId],
    queryFn: () => api.get<{ user: ProfileUser }>(`/users/${userId}/ficha`),
  });

  const { data: scoringData } = useQuery({
    queryKey: ['user-scoring', userId],
    queryFn: () => api.get<ScoringData>(`/stats/${userId}/scoring`),
  });

  const toggleActivo = useMutation({
    mutationFn: (activo: boolean) => api.patch(`/users/${userId}`, { activo }),
    onSuccess: (_, activo) => {
      toast.success(activo ? 'Usuario activado' : 'Usuario desactivado');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['user-ficha', userId] });
    },
    onError: () => toast.error('No se pudo actualizar el usuario'),
  });

  const u = userData?.user;
  const initials = u?.nombre.split(' ').map((s: string) => s[0]).slice(0, 2).join('') ?? '?';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border-t md:border border-border md:rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Perfil de usuario</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="h-32 rounded-2xl bg-white/5 animate-pulse" />
        ) : u ? (
          <>
            {/* Avatar + info */}
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-primary/20 grid place-items-center text-lg font-bold text-primary shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg">{u.nombre}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                {u.telefono && <p className="text-xs text-muted-foreground">{u.telefono}</p>}
              </div>
              <button
                onClick={() => toggleActivo.mutate(!u.activo)}
                disabled={toggleActivo.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
                style={{ borderColor: u.activo ? '#22c55e' : '#6b7280', color: u.activo ? '#22c55e' : '#6b7280' }}
              >
                {u.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {u.activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            {/* Stats de progreso */}
            {scoringData && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-blue-400">{scoringData.asistenciasMes}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Asist. mes</p>
                </div>
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="text-xl font-bold text-amber-400">{scoringData.rachaActual}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Racha días</p>
                </div>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                  <p className="text-xl font-bold text-primary">{scoringData.puntajeMes}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Puntaje</p>
                </div>
              </div>
            )}

            {/* Bio */}
            {u.bio && (
              <div className="rounded-xl bg-white/5 border border-border p-3">
                <p className="text-xs text-muted-foreground">{u.bio}</p>
              </div>
            )}

            {/* Miembro desde */}
            <p className="text-xs text-muted-foreground">
              Miembro desde {new Date(u.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Usuario no encontrado</p>
        )}
      </div>
    </div>
  );
}

// ── Fila de usuario ───────────────────────────────────────────────────────
function UserRow({ u, onSelect, plans, onRefetch }: { u: UserRow; onSelect: () => void; plans: PlanType[]; onRefetch: () => void }) {
  const [showPlan, setShowPlan] = useState(false);
  const qc = useQueryClient();

  const assign = useMutation({
    mutationFn: (planTypeId: string) => api.post('/plans/assign', { userId: u.id, planTypeId }),
    onSuccess: () => {
      toast.success('Plan asignado ✓');
      setShowPlan(false);
      onRefetch();
    },
  });

  const initials = u.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');

  const ROL_BADGE: Record<Role, string> = {
    super_admin: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    coach: 'bg-green-500/15 text-green-300 border-green-500/30',
    user: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  };

  const ROL_LABEL: Record<Role, string> = {
    super_admin: 'Admin',
    coach: 'Coach',
    user: u.esMenor ? 'Menor' : 'Cliente',
  };

  return (
    <div className="relative">
      <Card className={`flex items-center gap-3 py-3 ${!u.activo ? 'opacity-50' : ''}`}>
        <button onClick={onSelect} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{u.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">{u.email} · {u.documento}</p>
          </div>
          <span className={`text-[10px] uppercase tracking-wider border rounded-full px-2 py-0.5 shrink-0 ${ROL_BADGE[u.rol]}`}>
            {ROL_LABEL[u.rol]}
          </span>
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        </button>
        {u.rol === 'user' && (
          <Button variant="ghost" size="sm" onClick={() => setShowPlan((v) => !v)} className="shrink-0">
            Plan
          </Button>
        )}
      </Card>

      {showPlan && (
        <div className="absolute right-4 mt-1 bg-card border border-border rounded-xl shadow-xl p-2 z-10 w-64 max-h-72 overflow-auto" onClick={(e) => e.stopPropagation()}>
          {plans.map((p) => (
            <button key={p.id} onClick={() => assign.mutate(p.id)} className="w-full text-left p-2 hover:bg-white/5 rounded-lg">
              <p className="text-sm font-semibold">{p.nombre}</p>
              <p className="text-xs text-muted-foreground">${p.precioBaseCop.toLocaleString('es-CO')} · {p.trainingNombre}</p>
            </button>
          ))}
          <button onClick={() => setShowPlan(false)} className="w-full text-xs text-muted-foreground mt-1 py-1 hover:text-foreground">Cerrar</button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('user');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ['admin-users', q],
    queryFn: () => api.get<{ users: UserRow[] }>(`/users?q=${encodeURIComponent(q)}`),
  });

  const plans = useQuery({
    queryKey: ['plan-types'],
    queryFn: () => api.get<{ planTypes: PlanType[] }>('/plans/types'),
  });

  const allUsers = users.data?.users ?? [];

  const filtered = allUsers.filter((u) => {
    if (activeTab === 'menor') return u.rol === 'user' && u.esMenor;
    if (activeTab === 'acudiente') return false; // se carga desde endpoint separado (próximamente)
    if (activeTab === 'user') return u.rol === 'user' && !u.esMenor;
    return u.rol === activeTab;
  });

  const counts = {
    user: allUsers.filter((u) => u.rol === 'user' && !u.esMenor).length,
    coach: allUsers.filter((u) => u.rol === 'coach').length,
    menor: allUsers.filter((u) => u.esMenor).length,
    acudiente: 0,
    super_admin: allUsers.filter((u) => u.rol === 'super_admin').length,
  };

  useEffect(() => {
    const handler = () => setShowCreate(true);
    window.addEventListener('fitvang:crear-usuario', handler);
    return () => window.removeEventListener('fitvang:crear-usuario', handler);
  }, []);

  return (
    <div className="space-y-5">
      {/* Tabs por tipo */}
      <div className="grid grid-cols-5 gap-1.5">
        {USER_TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all w-full ${
              activeTab === key
                ? 'bg-card border-primary/50 text-foreground'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <Icon size={15} className={activeTab === key ? color : ''} />
            <span className="text-[9px] font-medium leading-tight">{label}</span>
            <span className="text-[9px] font-bold">{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o documento"
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none"
        />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {users.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            No hay {USER_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} registrados aún.
          </div>
        ) : (
          filtered.map((u) => (
            <UserRow
              key={u.id}
              u={u}
              onSelect={() => setSelectedUserId(u.id)}
              plans={plans.data?.planTypes ?? []}
              onRefetch={() => qc.invalidateQueries({ queryKey: ['admin-users'] })}
            />
          ))
        )}
      </div>

      {selectedUserId && (
        <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={(pwd) => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            if (pwd) toast.success(`Usuario creado. Contraseña temporal: ${pwd}`, { duration: 15000 });
            else toast.success('Usuario creado');
          }}
        />
      )}
    </div>
  );
}

// ── Create user modal ─────────────────────────────────────────────────────
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (pwd?: string) => void }) {
  const [form, setForm] = useState({
    nombreCompleto: '',
    documento: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    tipo: 'user' as 'user' | 'coach' | 'acudiente',
    esMenor: false,
    acudienteId: '',
  });

  const create = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        nombreCompleto: form.nombreCompleto,
        documento: form.documento,
        email: form.email,
        rol: form.tipo === 'acudiente' ? 'user' : form.tipo,
        esMenor: form.esMenor,
      };
      if (form.telefono) payload.telefono = form.telefono;
      if (form.fechaNacimiento) payload.fechaNacimiento = form.fechaNacimiento;
      if (form.esMenor && form.acudienteId) payload.acudienteId = form.acudienteId;
      return api.post<{ user: { id: string }; passwordTemporal?: string }>('/users', payload);
    },
    onSuccess: (d) => onSuccess(d.passwordTemporal),
    onError: () => toast.error('No se pudo crear el usuario'),
  });

  const FIELD_LABELS: Record<string, string> = {
    nombreCompleto: 'Nombre completo',
    documento: 'Documento de identidad',
    email: 'Correo electrónico',
    telefono: 'Teléfono (opcional)',
    fechaNacimiento: 'Fecha de nacimiento (opcional)',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-end md:place-items-center" onClick={onClose}>
      <div className="w-full md:max-w-md bg-card border-t md:border md:rounded-2xl border-border p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nuevo usuario</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        {(['nombreCompleto', 'documento', 'email', 'telefono', 'fechaNacimiento'] as const).map((k) => (
          <div key={k}>
            <label className="text-xs text-muted-foreground">{FIELD_LABELS[k]}</label>
            <input
              value={form[k] as string}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              type={k === 'fechaNacimiento' ? 'date' : k === 'email' ? 'email' : 'text'}
              className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
            />
          </div>
        ))}
        <div>
          <label className="text-xs text-muted-foreground">Tipo de usuario</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as 'user' | 'coach' | 'acudiente', esMenor: false })}
            className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
          >
            <option value="user">Cliente</option>
            <option value="coach">Entrenador</option>
            <option value="acudiente">Acudiente</option>
          </select>
        </div>
        {form.tipo === 'user' && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.esMenor} onChange={(e) => setForm({ ...form, esMenor: e.target.checked })} />
            Es menor de edad
          </label>
        )}
        {form.esMenor && (
          <div>
            <label className="text-xs text-muted-foreground">ID del acudiente (UUID)</label>
            <input
              value={form.acudienteId}
              onChange={(e) => setForm({ ...form, acudienteId: e.target.value })}
              className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
            />
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={create.isPending} onClick={() => create.mutate()}>Crear</Button>
        </div>
      </div>
    </div>
  );
}
