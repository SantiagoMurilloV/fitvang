import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  rol: 'super_admin' | 'coach' | 'user';
  esMenor: boolean;
  activo: boolean;
}

interface PlanType {
  id: string;
  nombre: string;
  precioBaseCop: number;
  trainingNombre: string;
}

export function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const users = useQuery({
    queryKey: ['admin-users', q],
    queryFn: () => api.get<{ users: UserRow[] }>(`/users?q=${encodeURIComponent(q)}`),
  });

  const plans = useQuery({ queryKey: ['plan-types'], queryFn: () => api.get<{ planTypes: PlanType[] }>('/plans/types') });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> Nuevo
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o documento"
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        {users.data?.users.map((u) => (
          <Card key={u.id} className="flex items-center gap-3 py-3">
            <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold">
              {u.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{u.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {u.email} · {u.documento}
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider border border-border rounded-full px-2 py-1">
              {u.rol === 'super_admin' ? 'admin' : u.rol}
            </span>
            <AssignPlanButton userId={u.id} plans={plans.data?.planTypes ?? []} onDone={() => qc.invalidateQueries({ queryKey: ['admin-users'] })} />
          </Card>
        ))}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={(passwordTemporal) => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            if (passwordTemporal) toast.success(`Usuario creado. Password temporal: ${passwordTemporal}`, { duration: 15000 });
            else toast.success('Usuario creado');
          }}
        />
      )}
    </div>
  );
}

function AssignPlanButton({
  userId,
  plans,
  onDone,
}: {
  userId: string;
  plans: PlanType[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const assign = useMutation({
    mutationFn: (planTypeId: string) => api.post('/plans/assign', { userId, planTypeId }),
    onSuccess: () => {
      toast.success('Plan asignado ✓');
      setOpen(false);
      onDone();
    },
  });
  if (!open) return <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Plan</Button>;
  return (
    <div className="absolute right-4 mt-12 bg-card border border-border rounded-xl shadow-xl p-2 z-10 w-64 max-h-72 overflow-auto" onClick={(e) => e.stopPropagation()}>
      {plans.map((p) => (
        <button key={p.id} onClick={() => assign.mutate(p.id)} className="w-full text-left p-2 hover:bg-white/5 rounded-lg">
          <p className="text-sm font-semibold">{p.nombre}</p>
          <p className="text-xs text-muted-foreground">${p.precioBaseCop.toLocaleString('es-CO')} · {p.trainingNombre}</p>
        </button>
      ))}
      <button onClick={() => setOpen(false)} className="w-full text-xs text-muted-foreground mt-2 py-1">Cerrar</button>
    </div>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (pwd?: string) => void }) {
  const [form, setForm] = useState({
    nombreCompleto: '',
    documento: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    rol: 'user' as 'user' | 'coach',
    esMenor: false,
    acudienteId: '',
  });
  const create = useMutation({
    mutationFn: () => api.post<{ user: { id: string }; passwordTemporal?: string }>('/users', form),
    onSuccess: (d) => onSuccess(d.passwordTemporal),
    onError: () => toast.error('No se pudo crear el usuario'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-end md:place-items-center" onClick={onClose}>
      <div className="w-full md:max-w-md bg-card border-t md:border md:rounded-2xl border-border p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">Nuevo usuario</h2>
        {(['nombreCompleto', 'documento', 'email', 'telefono', 'fechaNacimiento'] as const).map((k) => (
          <input
            key={k}
            value={form[k] as string}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k}
            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        ))}
        <select
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value as 'user' | 'coach' })}
          className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
        >
          <option value="user">Usuario</option>
          <option value="coach">Entrenador</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.esMenor} onChange={(e) => setForm({ ...form, esMenor: e.target.checked })} />
          Es menor de edad
        </label>
        {form.esMenor && (
          <input
            value={form.acudienteId}
            onChange={(e) => setForm({ ...form, acudienteId: e.target.value })}
            placeholder="ID acudiente (UUID)"
            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={create.isPending} onClick={() => create.mutate()}>Crear</Button>
        </div>
      </div>
    </div>
  );
}
