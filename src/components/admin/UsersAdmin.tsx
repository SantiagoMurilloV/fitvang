import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Search, Shield, Users2, Baby, UserCheck, HeartHandshake, ChevronRight, X, Bell, Layers, Zap, SlidersHorizontal, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { useUiAction } from '@/lib/ui-actions';
import { Card } from '@/components/shared/Card';
import { UserDetail, CreateUserScreen } from './UserDetail';

type Role = 'super_admin' | 'coach' | 'user';

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  rol: Role;
  esMenor: boolean;
  esAcudiente: boolean;
  // Menores vinculados en guardians: un cliente también puede ser acudiente
  menoresACargo?: number;
  activo: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

// Acudiente = flag esAcudiente O cliente con menores vinculados
const esAcudienteDe = (u: UserRow) => u.esAcudiente || (u.menoresACargo ?? 0) > 0;

// ── Tabs de tipo de usuario ───────────────────────────────────────────────
const USER_TABS = [
  { key: 'user', label: 'Clientes', icon: Users2, color: 'text-blue-400' },
  { key: 'coach', label: 'Entrenadores', icon: UserCheck, color: 'text-green-400' },
  { key: 'menor', label: 'Menores', icon: Baby, color: 'text-amber-400' },
  { key: 'acudiente', label: 'Acudientes', icon: HeartHandshake, color: 'text-pink-400' },
  { key: 'super_admin', label: 'Admin', icon: Shield, color: 'text-purple-400' },
] as const;

type TabKey = typeof USER_TABS[number]['key'];


// ── Fila de usuario ───────────────────────────────────────────────────────
function UserRow({ u, onSelect }: { u: UserRow; onSelect: () => void }) {
  const initials = u.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');

  // Colores alineados con los de las pestañas: Menor ámbar, Acudiente rosa, Cliente azul
  const ROL_BADGE: Record<Role, string> = {
    super_admin: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    coach: 'bg-green-500/15 text-green-300 border-green-500/30',
    user: u.esMenor
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : u.esAcudiente
        ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
        : 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  };

  const ROL_LABEL: Record<Role, string> = {
    super_admin: 'Admin',
    coach: 'Coach',
    user: u.esMenor ? 'Menor' : u.esAcudiente ? 'Acudiente' : 'Cliente',
  };

  return (
    <Card className={`${!u.activo ? 'border-red-500/40 bg-red-500/5' : ''}`}>
      <button onClick={onSelect} className="flex items-center gap-3 w-full text-left">
        <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0 overflow-hidden">
          {u.avatarUrl
            ? <img src={u.avatarUrl} alt={u.nombre} className="size-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{u.nombre}</p>
          <p className="text-xs text-muted-foreground truncate">{u.email} · {u.documento}</p>
        </div>
        {/* Etiquetas apiladas: rol principal arriba, Acudiente debajo si aplica */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {!u.activo && (
            <span className="text-[8px] uppercase tracking-wide font-bold rounded-full px-1.5 py-px leading-tight bg-red-500 text-white">
              Inactivo
            </span>
          )}
          <span className={`text-[8px] uppercase tracking-wide border rounded-full px-1.5 py-px leading-tight ${ROL_BADGE[u.rol]}`}>
            {ROL_LABEL[u.rol]}
          </span>
          {u.rol === 'user' && !u.esAcudiente && (u.menoresACargo ?? 0) > 0 && (
            <span className="text-[8px] uppercase tracking-wide border rounded-full px-1.5 py-px leading-tight bg-pink-500/15 text-pink-300 border-pink-500/30">
              Acudiente
            </span>
          )}
        </div>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </button>
    </Card>
  );
}

// ── Permissions types ─────────────────────────────────────────────────────
interface PermissionsForRole {
  secciones: Record<string, boolean>;
  acciones: Record<string, boolean>;
  notificaciones: Record<string, boolean>;
  limites: Record<string, number | null>;
}
interface RolePermissions {
  user: PermissionsForRole;
  coach: PermissionsForRole;
  menor: PermissionsForRole;
  acudiente: PermissionsForRole;
}

const DEFAULT_PERMISOS: RolePermissions = {
  user: {
    secciones: { dashboard: true, reservas: true, recorrido: true, perfil: true, clases: false, usuarios: false },
    acciones: { reservar: true, cancelarReserva: true, subirFoto: true, tomarAsistencia: false, verFichaUsuario: false, cobrarEfectivo: false },
    notificaciones: { recordatorioClase: true, cambioHorario: true, vencimientoPlan: true, bienvenida: true, nuevaReserva: false, cancelacionReserva: false, claseProxima: false },
    limites: { reservasPorSemana: null, reservasSimultaneas: 2 },
  },
  coach: {
    secciones: { dashboard: true, reservas: false, recorrido: false, perfil: true, clases: true, usuarios: true },
    acciones: { reservar: false, cancelarReserva: false, subirFoto: true, tomarAsistencia: true, verFichaUsuario: true, cobrarEfectivo: true },
    notificaciones: { recordatorioClase: false, cambioHorario: false, vencimientoPlan: false, bienvenida: true, nuevaReserva: true, cancelacionReserva: true, claseProxima: true },
    limites: { reservasPorSemana: null, reservasSimultaneas: null },
  },
  menor: {
    secciones: { dashboard: true, reservas: true, recorrido: true, perfil: true, clases: false, usuarios: false },
    acciones: { reservar: true, cancelarReserva: false, subirFoto: true, tomarAsistencia: false, verFichaUsuario: false, cobrarEfectivo: false },
    notificaciones: { recordatorioClase: true, cambioHorario: true, vencimientoPlan: true, bienvenida: true, nuevaReserva: false, cancelacionReserva: false, claseProxima: false },
    limites: { reservasPorSemana: 5, reservasSimultaneas: 1 },
  },
  acudiente: {
    secciones: { dashboard: true, reservas: false, recorrido: false, perfil: true, clases: false, usuarios: false, infoMenor: true, horariosMenor: true, asistenciasMenor: true },
    acciones: { reservar: false, cancelarReserva: false, subirFoto: true, tomarAsistencia: false, verFichaUsuario: false, cobrarEfectivo: false },
    notificaciones: { recordatorioClase: false, cambioHorario: true, vencimientoPlan: true, bienvenida: true, nuevaReserva: false, cancelacionReserva: false, claseProxima: false, asistenciaMenor: true, ausenciaMenor: true },
    limites: { reservasPorSemana: null, reservasSimultaneas: null },
  },
};

type PermRole = 'user' | 'coach' | 'menor' | 'acudiente';

const PERM_ROLE_LABELS: Record<PermRole, string> = {
  user: 'Cliente',
  coach: 'Entrenador',
  menor: 'Menor',
  acudiente: 'Acudiente',
};

const SECTION_LABELS: { key: string; label: string; roles?: PermRole[] }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reservas', label: 'Reservas' },
  { key: 'recorrido', label: 'Mi Recorrido' },
  { key: 'perfil', label: 'Perfil' },
  { key: 'clases', label: 'Clases', roles: ['coach'] },
  { key: 'usuarios', label: 'Usuarios', roles: ['coach'] },
  { key: 'infoMenor', label: 'Info del menor', roles: ['acudiente'] },
  { key: 'horariosMenor', label: 'Horarios del menor', roles: ['acudiente'] },
  { key: 'asistenciasMenor', label: 'Asistencias del menor', roles: ['acudiente'] },
];

const ACTION_LABELS: { key: string; label: string; roles?: PermRole[] }[] = [
  { key: 'reservar', label: 'Reservar clases' },
  { key: 'cancelarReserva', label: 'Cancelar reserva' },
  { key: 'subirFoto', label: 'Subir foto de perfil' },
  { key: 'tomarAsistencia', label: 'Tomar asistencia', roles: ['coach'] },
  { key: 'verFichaUsuario', label: 'Ver ficha de usuario', roles: ['coach'] },
  { key: 'cobrarEfectivo', label: 'Cobrar en efectivo', roles: ['coach'] },
];

const NOTIF_LABELS: { key: string; label: string; roles?: PermRole[] }[] = [
  { key: 'recordatorioClase', label: 'Recordatorio de clase' },
  { key: 'cambioHorario', label: 'Cambio de horario' },
  { key: 'vencimientoPlan', label: 'Vencimiento de plan' },
  { key: 'bienvenida', label: 'Bienvenida' },
  { key: 'nuevaReserva', label: 'Nueva reserva', roles: ['coach'] },
  { key: 'cancelacionReserva', label: 'Cancelación de reserva', roles: ['coach'] },
  { key: 'claseProxima', label: 'Clase próxima', roles: ['coach'] },
  { key: 'asistenciaMenor', label: 'Menor marcado presente en clase', roles: ['acudiente'] },
  { key: 'ausenciaMenor', label: 'Menor no asistió a su clase', roles: ['acudiente'] },
];

const LIMIT_LABELS: { key: string; label: string; unit: string }[] = [
  { key: 'reservasPorSemana', label: 'Reservas por semana', unit: 'clases' },
  { key: 'reservasSimultaneas', label: 'Reservas simultáneas', unit: 'máx' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-cyan-500' : 'bg-white/10'}`}
    >
      <span
        className={`absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
      />
    </button>
  );
}

function PermissionsScreen({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [activeRole, setActiveRole] = useState<PermRole>('user');
  const [activeSection, setActiveSection] = useState<'secciones' | 'acciones' | 'notificaciones' | 'limites'>('secciones');
  const [draft, setDraft] = useState<RolePermissions>(DEFAULT_PERMISOS);
  const [loaded, setLoaded] = useState(false);

  const { data } = useQuery({
    queryKey: ['config-permisos'],
    queryFn: () => api.get<{ permisos: RolePermissions }>('/config/permisos'),
    retry: 1,
  });

  useEffect(() => {
    if (data?.permisos && !loaded) {
      setDraft(data.permisos);
      setLoaded(true);
    }
  }, [data, loaded]);

  const save = useMutation({
    mutationFn: (p: RolePermissions) => api.patch('/config/permisos', p as unknown as Record<string, unknown>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config-permisos'] });
      toast.success('Permisos guardados');
    },
    onError: () => toast.error('Error al guardar'),
  });

  function setToggle(section: 'secciones' | 'acciones' | 'notificaciones', key: string, val: boolean) {
    setDraft((prev) => {
      return {
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          [section]: { ...prev[activeRole][section], [key]: val },
        },
      };
    });
  }

  function setLimit(key: string, raw: string) {
    const val = raw === '' ? null : parseInt(raw, 10);
    setDraft((prev) => {
      return {
        ...prev,
        [activeRole]: {
          ...prev[activeRole],
          limites: { ...prev[activeRole].limites, [key]: val },
        },
      };
    });
  }

  const role = draft[activeRole];

  const SECTION_ICONS = {
    secciones: Layers,
    acciones: Zap,
    notificaciones: Bell,
    limites: SlidersHorizontal,
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0">
        <button onClick={onClose} className="size-8 grid place-items-center rounded-full hover:bg-white/10">
          <X size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold">Permisos por perfil</h1>
          <p className="text-xs text-muted-foreground">Define qué puede ver y hacer cada tipo de usuario</p>
        </div>
        <button
          onClick={() => save.mutate(draft)}
          disabled={save.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-black text-sm font-semibold disabled:opacity-50"
        >
          <Save size={14} />
          Guardar
        </button>
      </div>

      {/* Role tabs */}
      <div className="grid grid-cols-4 gap-1.5 px-4 pt-4 shrink-0">
        {(['user', 'coach', 'menor', 'acudiente'] as PermRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeRole === r ? 'bg-white/15 text-white' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            {PERM_ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-3 shrink-0">
        {(['secciones', 'acciones', 'notificaciones', 'limites'] as const).map((s) => {
          const Icon = SECTION_ICONS[s];
          return (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === s ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              <Icon size={12} />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {activeSection === 'limites' ? (
          <div className="space-y-3 pt-2">
            {LIMIT_LABELS.map(({ key, label, unit }) => (
              <div key={key} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{unit} · vacío = sin límite</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={role.limites[key] ?? ''}
                  onChange={(e) => setLimit(key, e.target.value)}
                  placeholder="∞"
                  className="w-20 h-9 rounded-lg bg-white/10 border border-white/10 text-center text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {(activeSection === 'secciones' ? SECTION_LABELS : activeSection === 'acciones' ? ACTION_LABELS : NOTIF_LABELS)
              .filter(({ roles }) => !roles || roles.includes(activeRole))
              .map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
                <p className="text-sm font-medium">{label}</p>
                <Toggle
                  checked={role[activeSection][key] ?? false}
                  onChange={(v) => setToggle(activeSection, key, v)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
}

// ── Main ──────────────────────────────────────────────────────────────────
export function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('user');
  const [showCreate, setShowCreate] = useState(false);
  const [showPermisos, setShowPermisos] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ['admin-users', q],
    queryFn: () => api.get<{ users: UserRow[] }>(`/users?q=${encodeURIComponent(q)}`),
  });

  const allUsers = users.data?.users ?? [];

  const filtered = allUsers.filter((u) => {
    if (activeTab === 'menor') return u.rol === 'user' && u.esMenor;
    // Un cliente que es acudiente aparece en AMBAS pestañas (Clientes y Acudientes)
    if (activeTab === 'acudiente') return u.rol === 'user' && esAcudienteDe(u);
    if (activeTab === 'user') return u.rol === 'user' && !u.esMenor && !u.esAcudiente;
    return u.rol === activeTab;
  });

  const counts = {
    user: allUsers.filter((u) => u.rol === 'user' && !u.esMenor && !u.esAcudiente).length,
    coach: allUsers.filter((u) => u.rol === 'coach').length,
    menor: allUsers.filter((u) => u.esMenor).length,
    acudiente: allUsers.filter((u) => u.rol === 'user' && esAcudienteDe(u)).length,
    super_admin: allUsers.filter((u) => u.rol === 'super_admin').length,
  };

  useUiAction('crear-usuario', () => setShowCreate(true));
  useUiAction('abrir-permisos', () => setShowPermisos(true));

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
            />
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <UserDetail
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
          />
        )}
        {showCreate && (
          <CreateUserScreen
            onClose={() => setShowCreate(false)}
            onSuccess={(pwd) => {
              setShowCreate(false);
              qc.invalidateQueries({ queryKey: ['admin-users'] });
              if (pwd) {
                // Modal explícito con copiar (antes: contraseña en claro en un toast 15s)
                Swal.fire({
                  title: 'Usuario creado',
                  html: `<p style="margin-bottom:10px">Comparte esta contraseña temporal con el usuario:</p>
                         <div style="display:flex;gap:8px;align-items:center;justify-content:center">
                           <code style="font-size:20px;font-weight:700;letter-spacing:1px">${pwd}</code>
                           <button id="fv-copy-pwd" type="button" style="cursor:pointer;border:1px solid #3DC4DB;background:transparent;color:#3DC4DB;border-radius:6px;padding:4px 10px;font-size:13px">Copiar</button>
                         </div>`,
                  background: '#0f0f11',
                  color: '#f8f8f8',
                  confirmButtonText: 'Listo',
                  confirmButtonColor: '#3DC4DB',
                  didOpen: () => {
                    document.getElementById('fv-copy-pwd')?.addEventListener('click', () => {
                      navigator.clipboard?.writeText(pwd);
                      const b = document.getElementById('fv-copy-pwd');
                      if (b) b.textContent = 'Copiado';
                    });
                  },
                });
              } else {
                toast.success('Usuario creado');
              }
            }}
          />
        )}
        {showPermisos && (
          <PermissionsScreen onClose={() => setShowPermisos(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

