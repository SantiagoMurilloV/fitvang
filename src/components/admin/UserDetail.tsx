import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  ChevronLeft, Check, ToggleLeft, ToggleRight,
  User, Mail, Phone, CreditCard, Calendar, Weight, Ruler,
  Shield, Tag, Eye, EyeOff, Camera, Loader2, Trash2,
} from 'lucide-react';
import { uploadAvatar } from '@/lib/cloudinary';
import { api } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import Swal from 'sweetalert2';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface ProfileUser {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  documento?: string;
  rol: string;
  activo: boolean;
  esMenor: boolean;
  avatarUrl?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;
  pesoKg?: number | null;
  alturaCm?: number | null;
  bio?: string | null;
  createdAt: string;
}

interface PlanActivo {
  id: string;
  planNombre: string;
  trainingNombre: string;
  trainingColor: string;
  modalidad: string;
  precioCopAplicado: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

interface PlanType {
  id: string;
  nombre: string;
  precioBaseCop: number;
  trainingNombre: string;
  trainingColor: string;
}

interface ScoringData {
  asistenciasMes: number;
  rachaActual: number;
  puntajeMes: number;
}

function formatCop(n: number) {
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

/* ─── Sección de campo editable ─────────────────────────────────────── */
function Field({ label, value, icon: Icon }: { label: string; value?: string | null; icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words">{value || <span className="text-muted-foreground/50 italic">No registrado</span>}</p>
      </div>
    </div>
  );
}

/* ─── Panel asignar plan ────────────────────────────────────────────── */
function AssignPlanPanel({ userId, onAssigned }: { userId: string; onAssigned: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [precio, setPrecio] = useState('');

  const { data } = useQuery({
    queryKey: ['plan-types'],
    queryFn: () => api.get<{ planTypes: PlanType[] }>('/plans/types'),
  });

  const plans = (data?.planTypes ?? []).filter((p: any) => p.activo !== false);
  const selected = plans.find((p) => p.id === selectedId);

  const assign = useMutation({
    mutationFn: () => api.post('/plans/assign', {
      userId,
      planTypeId: selectedId,
      precioCopAplicado: precio ? Number(precio) : undefined,
    }),
    onSuccess: () => {
      toast.success('Plan asignado');
      setOpen(false);
      setSelectedId('');
      setPrecio('');
      onAssigned();
    },
    onError: () => toast.error('No se pudo asignar el plan'),
  });

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
      >
        <span>Asignar plan</span>
        <Tag size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedId(p.id); setPrecio(String(p.precioBaseCop)); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      selectedId === p.id ? 'border-primary bg-primary/10' : 'border-border bg-white/3 hover:bg-white/5'
                    }`}
                  >
                    <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: p.trainingColor || '#3DC4DB' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.trainingNombre} · {formatCop(p.precioBaseCop)}</p>
                    </div>
                    {selectedId === p.id && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                ))}
              </div>

              {selectedId && (
                <div>
                  <label className="text-xs text-muted-foreground">Precio aplicado (COP)</label>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
                  />
                </div>
              )}

              <Button
                className="w-full"
                disabled={!selectedId}
                loading={assign.isPending}
                onClick={() => assign.mutate()}
              >
                Confirmar asignación
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Vista detalle usuario ─────────────────────────────────────────── */
export function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-ficha', userId],
    queryFn: () => api.get<{ user: ProfileUser; planActivo: PlanActivo | null }>(`/users/${userId}/ficha`),
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      await api.patch(`/users/${userId}`, { avatarUrl: url });
      refetch();
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Foto actualizada');
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo subir la foto');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    const result = await Swal.fire({
      title: 'Eliminar foto',
      text: '¿Quitar la foto de perfil de este usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10', confirmButton: 'rounded-xl font-semibold', cancelButton: 'rounded-xl font-semibold' },
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch(`/users/${userId}`, { avatarUrl: '' });
      refetch();
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Foto eliminada');
    } catch {
      toast.error('No se pudo eliminar la foto');
    }
  }

  const { data: scoringData } = useQuery({
    queryKey: ['user-scoring', userId],
    queryFn: () => api.get<ScoringData>(`/stats/${userId}/scoring`),
  });

  const toggleActivo = useMutation({
    mutationFn: (activo: boolean) => api.patch(`/users/${userId}`, { activo }),
    onSuccess: (_, activo) => {
      toast.success(activo ? 'Usuario activado' : 'Usuario desactivado');
      refetch();
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('No se pudo actualizar'),
  });

  const resetPassword = useMutation({
    mutationFn: (password: string) => api.patch(`/users/${userId}`, { password }),
    onSuccess: () => toast.success('Contraseña actualizada'),
    onError: () => toast.error('No se pudo cambiar la contraseña'),
  });

  async function handleResetPassword() {
    const result = await Swal.fire({
      title: 'Nueva contraseña',
      input: 'password',
      inputLabel: 'Escribe la nueva contraseña',
      inputAttributes: { autocomplete: 'new-password', minlength: '6' },
      showCancelButton: true,
      confirmButtonText: 'Cambiar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#3DC4DB',
      cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10', confirmButton: 'rounded-xl font-semibold', cancelButton: 'rounded-xl font-semibold' },
      inputValidator: (v) => (!v || v.length < 6) ? 'Mínimo 6 caracteres' : null,
    });
    if (result.isConfirmed && result.value) resetPassword.mutate(result.value);
  }

  const u = data?.user;
  const plan = data?.planActivo;
  const initials = u?.nombre.split(' ').map((s: string) => s[0]).slice(0, 2).join('') ?? '?';

  const ROL_LABEL: Record<string, string> = {
    super_admin: 'Admin', coach: 'Coach', user: 'Cliente',
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <button onClick={onClose} className="size-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-base font-bold flex-1 truncate">{u?.nombre ?? 'Perfil'}</h1>
        {u && (
          <button
            onClick={() => toggleActivo.mutate(!u.activo)}
            disabled={toggleActivo.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              u.activo
                ? 'border-green-500/40 text-green-400 bg-green-500/10'
                : 'border-border text-muted-foreground bg-white/5'
            }`}
          >
            {u.activo ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {u.activo ? 'Activo' : 'Inactivo'}
          </button>
        )}
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : !u ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Usuario no encontrado</div>
        ) : (
          <div className="p-4 space-y-5 pb-12">

            {/* Avatar + stats */}
            <div className="flex items-center gap-4 py-2">
              <div className="relative shrink-0">
                <label className="relative size-16 rounded-full cursor-pointer group block">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.nombre} className="size-16 rounded-full object-cover" />
                  ) : (
                    <div className="size-16 rounded-full bg-primary/20 grid place-items-center text-xl font-bold text-primary">
                      {initials}
                    </div>
                  )}
                  <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploadingAvatar
                      ? <Loader2 size={18} className="text-white animate-spin" />
                      : <Camera size={18} className="text-white" />
                    }
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </label>
                {u.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -bottom-1 -right-1 size-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    title="Eliminar foto"
                  >
                    <Trash2 size={10} className="text-white" />
                  </button>
                )}
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{u.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ROL_LABEL[u.rol] ?? u.rol}
                  {u.esMenor && ' · Menor'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Desde {new Date(u.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            {/* Scoring */}
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

            {/* Plan activo */}
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan activo</p>
              {plan ? (
                <div className="flex items-start gap-3">
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: plan.trainingColor || '#3DC4DB' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{plan.planNombre}</p>
                    <p className="text-xs text-muted-foreground">{plan.trainingNombre} · {plan.modalidad}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(plan.fechaInicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      {' – '}
                      {new Date(plan.fechaFin).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs font-semibold text-primary mt-1">{formatCop(plan.precioCopAplicado)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin plan asignado</p>
              )}

              <AssignPlanPanel userId={userId} onAssigned={refetch} />
            </div>

            {/* Datos personales */}
            <div className="rounded-2xl bg-card border border-border px-4">
              <Field label="Correo electrónico" value={u.email} icon={Mail} />
              <Field label="Documento" value={u.documento} icon={CreditCard} />
              <Field label="Teléfono" value={u.telefono} icon={Phone} />
              <Field label="Fecha de nacimiento" value={u.fechaNacimiento ? new Date(u.fechaNacimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : null} icon={Calendar} />
              <Field label="Género" value={u.genero} icon={User} />
              <Field label="Peso" value={u.pesoKg ? `${u.pesoKg} kg` : null} icon={Weight} />
              <Field label="Altura" value={u.alturaCm ? `${u.alturaCm} cm` : null} icon={Ruler} />
            </div>

            {/* Bio */}
            {u.bio && (
              <div className="rounded-2xl bg-card border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bio</p>
                <p className="text-sm text-muted-foreground">{u.bio}</p>
              </div>
            )}

            {/* Acciones admin */}
            <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Acciones</p>
              <button
                onClick={handleResetPassword}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-border hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <Shield size={15} className="text-muted-foreground" />
                Cambiar contraseña
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Pantalla crear usuario ────────────────────────────────────────── */
export function CreateUserScreen({ onClose, onSuccess }: { onClose: () => void; onSuccess: (pwd?: string) => void }) {
  const [form, setForm] = useState({
    nombreCompleto: '',
    documento: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    password: '',
    tipo: 'user' as 'user' | 'coach',
    esMenor: false,
  });
  const [showPwd, setShowPwd] = useState(false);

  const create = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        nombreCompleto: form.nombreCompleto,
        documento: form.documento,
        email: form.email,
        rol: form.tipo,
        esMenor: form.esMenor,
      };
      if (form.telefono) payload.telefono = form.telefono;
      if (form.fechaNacimiento) payload.fechaNacimiento = form.fechaNacimiento;
      if (form.password) payload.password = form.password;
      return api.post<{ user: { id: string }; passwordTemporal?: string }>('/users', payload);
    },
    onSuccess: (d) => onSuccess(d.passwordTemporal),
    onError: () => toast.error('No se pudo crear el usuario'),
  });

  const valid = form.nombreCompleto.trim().length > 2 && form.email.includes('@') && form.documento.trim().length > 3;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <button onClick={onClose} className="size-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-base font-bold flex-1">Nuevo usuario</h1>
        <Button size="sm" loading={create.isPending} disabled={!valid} onClick={() => create.mutate()}>
          Crear
        </Button>
      </div>

      {/* Formulario */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">

        {/* Tipo */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tipo de usuario</p>
          <div className="grid grid-cols-2 gap-2">
            {(['user', 'coach'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, tipo: t, esMenor: false })}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.tipo === t ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {t === 'user' ? 'Cliente' : 'Entrenador'}
              </button>
            ))}
          </div>
        </div>

        {/* Datos personales */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos personales</p>

          {[
            { key: 'nombreCompleto', label: 'Nombre completo *', type: 'text' },
            { key: 'documento', label: 'Documento de identidad *', type: 'text' },
            { key: 'email', label: 'Correo electrónico *', type: 'email' },
            { key: 'telefono', label: 'Teléfono', type: 'tel' },
            { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                type={type}
                className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
          ))}

          {form.tipo === 'user' && (
            <label className="flex items-center gap-2 text-sm py-1">
              <input type="checkbox" checked={form.esMenor} onChange={(e) => setForm({ ...form, esMenor: e.target.checked })} className="rounded" />
              Es menor de edad
            </label>
          )}
        </div>

        {/* Acceso */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acceso a la app</p>
          <div>
            <label className="text-xs text-muted-foreground">Contraseña <span className="text-muted-foreground/50">(opcional — se genera automáticamente si no la defines)</span></label>
            <div className="relative mt-1">
              <input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                type={showPwd ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className="w-full h-11 px-4 pr-11 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
