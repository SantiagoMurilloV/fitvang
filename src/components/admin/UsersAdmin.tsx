import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Search, Shield, Users2, Baby, UserCheck, HeartHandshake, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
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
  activo: boolean;
  avatarUrl?: string | null;
  createdAt: string;
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


// ── Fila de usuario ───────────────────────────────────────────────────────
function UserRow({ u, onSelect }: { u: UserRow; onSelect: () => void }) {
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
    <Card className={`${!u.activo ? 'opacity-50' : ''}`}>
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
        <span className={`text-[10px] uppercase tracking-wider border rounded-full px-2 py-0.5 shrink-0 ${ROL_BADGE[u.rol]}`}>
          {ROL_LABEL[u.rol]}
        </span>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </button>
    </Card>
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
              if (pwd) toast.success(`Usuario creado. Contraseña: ${pwd}`, { duration: 15000 });
              else toast.success('Usuario creado');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

