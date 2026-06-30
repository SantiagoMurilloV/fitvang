import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  ChevronLeft, Check, ToggleLeft, ToggleRight,
  User, Phone, Mail, CreditCard, Calendar, Weight, Ruler,
  Tag, Eye, EyeOff, Camera, Loader2, Trash2, Lock, Pencil,
  FileText, ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useAvatarUpload } from '@/lib/useAvatarUpload';
import { useInlineEdit } from '@/lib/useInlineEdit';
import { formatCop } from '@/lib/utils';
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
  esAcudiente?: boolean;
  avatarUrl?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;
  pesoKg?: number | null;
  alturaCm?: number | null;
  bio?: string | null;
  createdAt: string;
  passwordPlain?: string | null;
  terminosAceptadosAt?: string | null;
  terminosDocUrl?: string | null;
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
  renovacionAutomatica: boolean;
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

// formatCop ahora vive en @/lib/utils (antes redefinido localmente)

/* ─── Campo editable inline ──────────────────────────────────────────── */
function Field({
  label, value, icon: Icon, userId, fieldKey, type = 'text',
}: {
  label: string; value?: string | null; icon: React.ElementType;
  userId: string; fieldKey: string; type?: string;
}) {
  const qc = useQueryClient();
  const { editing, draft, setDraft, saving, start, cancel, save } = useInlineEdit({
    value: value ?? '',
    onSave: async (v) => {
      try {
        await api.patch(`/users/${userId}`, { [fieldKey]: v || null });
        qc.invalidateQueries({ queryKey: ['user-ficha', userId] });
        qc.invalidateQueries({ queryKey: ['admin-users'] });
        toast.success('Guardado');
      } catch (e) {
        toast.error('No se pudo guardar');
        throw e;
      }
    },
  });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        {editing ? (
          <div className="flex gap-2 mt-1">
            <input
              autoFocus
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              className="flex-1 h-8 px-2 rounded-lg bg-background border border-primary text-sm outline-none"
            />
            <button onClick={save} disabled={saving} className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors">
              {saving ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Check size={13} />}
            </button>
            <button onClick={cancel} className="size-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <EyeOff size={13} />
            </button>
          </div>
        ) : (
          <button onClick={start} className="w-full text-left group flex items-center justify-between gap-2 mt-0.5">
            <p className="text-sm font-medium break-words">{value || <span className="text-muted-foreground/50 italic">No registrado</span>}</p>
            <Pencil size={12} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Nombre editable grande (bloque avatar) ────────────────────────── */
function NameField({ nombre, userId }: { nombre: string; userId: string }) {
  const qc = useQueryClient();
  const { editing, draft, setDraft, saving, start, cancel, save } = useInlineEdit({
    value: nombre,
    normalize: (v) => v.trim(),
    isUnchanged: (d, v) => !d || d === v,
    onSave: async (v) => {
      try {
        await api.patch(`/users/${userId}`, { nombreCompleto: v });
        qc.invalidateQueries({ queryKey: ['user-ficha', userId] });
        qc.invalidateQueries({ queryKey: ['admin-users'] });
        toast.success('Nombre actualizado');
      } catch (e) {
        toast.error('No se pudo guardar');
        throw e;
      }
    },
  });

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          maxLength={120}
          className="h-8 px-2 rounded-lg bg-background border border-primary text-sm font-bold outline-none w-36"
        />
        <button onClick={save} disabled={saving} className="size-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 shrink-0">
          {saving ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Check size={12} />}
        </button>
        <button onClick={cancel} className="size-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground shrink-0">
          <ChevronLeft size={12} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={start} className="flex items-center gap-1.5 text-left">
      <span className="font-bold text-lg leading-tight">{nombre}</span>
      <Pencil size={12} className="text-primary/50 shrink-0" />
    </button>
  );
}

/* ─── Campo contraseña inline ───────────────────────────────────────── */
function TerminosRow({ userId, aceptadosAt, docUrl }: { userId: string; aceptadosAt?: string | null; docUrl?: string | null }) {
  const qc = useQueryClient();
  const aceptados = !!aceptadosAt;

  const regenerar = useMutation({
    mutationFn: () => api.post<{ url: string }>(`/users/${userId}/regenerar-terminos`),
    onSuccess: () => {
      toast.success('Documento generado');
      qc.invalidateQueries({ queryKey: ['user-ficha', userId] });
    },
    onError: () => toast.error('No se pudo generar el documento. Revisa las credenciales de Cloudinary.'),
  });

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-muted-foreground shrink-0" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Términos y condiciones</p>
      </div>

      {aceptados ? (
        <>
          <p className="text-sm text-foreground/90">
            Aceptados el{' '}
            <span className="font-semibold">
              {new Date(aceptadosAt!).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </p>
          {docUrl ? (
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/25 active:scale-[0.98] transition"
            >
              <ExternalLink className="size-4" />
              Ver documento firmado
            </a>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Aceptados, pero no se generó el documento.</p>
              <button
                type="button"
                onClick={() => regenerar.mutate()}
                disabled={regenerar.isPending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-white/5 active:scale-[0.98] transition disabled:opacity-50"
              >
                {regenerar.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                Generar documento
              </button>
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no ha aceptado los términos y condiciones.</p>
      )}
    </div>
  );
}

function PasswordField({ userId, value }: { userId: string; hasPassword?: boolean; value?: string | null }) {
  const qc = useQueryClient();
  const [current, setCurrent] = useState<string | null | undefined>(value);
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  function refresh() {
    qc.invalidateQueries({ queryKey: ['user-ficha', userId] });
    qc.invalidateQueries({ queryKey: ['admin-users'] });
  }

  async function save() {
    if (pwd.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    setSaving(true);
    try {
      await api.patch(`/users/${userId}`, { password: pwd });
      setCurrent(pwd);
      setPwd('');
      toast.success('Contraseña actualizada');
      refresh();
    } catch {
      toast.error('No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setResetting(true);
    try {
      const { password } = await api.post<{ password: string }>(`/users/${userId}/reset-password`);
      setCurrent(password);
      toast.success('Contraseña restablecida');
      refresh();
    } catch {
      toast.error('No se pudo restablecer la contraseña');
    } finally {
      setResetting(false);
    }
  }

  function copy() {
    if (!current) return;
    navigator.clipboard?.writeText(current);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contraseña</p>
        <button type="button" onClick={reset} disabled={resetting} className="text-[11px] text-amber-400 hover:underline disabled:opacity-50">
          {resetting ? 'Restableciendo…' : 'Restablecer'}
        </button>
      </div>

      {/* Contraseña actual (visible) */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border">
        <Lock size={14} className="text-muted-foreground shrink-0" />
        {current ? (
          <>
            <code className="text-sm font-mono break-all flex-1">{current}</code>
            <button type="button" onClick={copy} className="text-[11px] text-primary hover:underline shrink-0">
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground/60 italic flex-1">No disponible — usa "Restablecer" o asigna una abajo</span>
        )}
      </div>

      {/* Asignar una contraseña específica */}
      <div className="flex gap-2">
        <input
          type="text"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Asignar contraseña específica…"
          className="flex-1 h-10 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary transition"
        />
        <button
          onClick={save}
          disabled={saving || pwd.length < 1}
          className="h-10 px-4 rounded-xl bg-primary text-background text-sm font-semibold disabled:opacity-40 transition-opacity flex items-center gap-1.5"
        >
          {saving
            ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            : <Check size={14} />}
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ─── Panel asignar plan ────────────────────────────────────────────── */
function AssignPlanPanel({ userId, onAssigned }: { userId: string; onAssigned: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [precio, setPrecio] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [autoRenov, setAutoRenov] = useState(false);

  const { data } = useQuery({
    queryKey: ['plan-types'],
    queryFn: () => api.get<{ planTypes: PlanType[] }>('/plans/types'),
  });

  const plans = (data?.planTypes ?? []).filter((p: any) => p.activo !== false);

  const assign = useMutation({
    mutationFn: () => api.post('/plans/assign', {
      userId,
      planTypeId: selectedId,
      precioCopAplicado: precio ? Number(precio) : undefined,
      fechaInicio: fechaInicio || undefined,
      renovacionAutomatica: autoRenov,
    }),
    onSuccess: () => {
      toast.success('Plan asignado');
      setOpen(false);
      setSelectedId('');
      setPrecio('');
      setFechaInicio('');
      setAutoRenov(false);
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
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Precio aplicado (COP)</label>
                    <input
                      type="number"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Fecha de inicio (opcional)</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Si lo dejas vacío, empieza hoy.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenov}
                      onChange={(e) => setAutoRenov(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    Renovación automática
                  </label>
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

/* ─── Fila de plan activo (fechas editables, renovación, renovar, desactivar) ─── */
function PlanRow({ plan, onChanged }: { plan: PlanActivo; onChanged: () => void }) {
  const [ini, setIni] = useState(plan.fechaInicio.slice(0, 10));
  const [fin, setFin] = useState(plan.fechaFin.slice(0, 10));
  const dirty = ini !== plan.fechaInicio.slice(0, 10) || fin !== plan.fechaFin.slice(0, 10);

  const save = useMutation({
    mutationFn: () => api.patch(`/plans/assign/${plan.id}`, { fechaInicio: ini, fechaFin: fin }),
    onSuccess: () => { toast.success('Fechas actualizadas'); onChanged(); },
    onError: () => toast.error('No se pudieron guardar las fechas'),
  });
  const toggleRenov = useMutation({
    mutationFn: (v: boolean) => api.patch(`/plans/assign/${plan.id}`, { renovacionAutomatica: v }),
    onSuccess: () => onChanged(),
    onError: () => toast.error('No se pudo cambiar la renovación'),
  });
  const renew = useMutation({
    mutationFn: () => api.post(`/plans/assign/${plan.id}/renew`),
    onSuccess: () => { toast.success('Plan renovado — cargo pendiente creado'); onChanged(); },
    onError: () => toast.error('No se pudo renovar'),
  });
  const del = useMutation({
    mutationFn: () => api.delete(`/plans/assign/${plan.id}`),
    onSuccess: () => { toast.success('Plan desactivado'); onChanged(); },
    onError: () => toast.error('No se pudo desactivar'),
  });

  async function confirmDelete() {
    const r = await Swal.fire({
      title: '¿Desactivar plan?',
      text: 'Se cancela el plan y se quita su cargo pendiente (los pagos exitosos NO se borran).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'No',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2f',
      reverseButtons: true,
    });
    if (r.isConfirmed) del.mutate();
  }

  const busy = save.isPending || toggleRenov.isPending || renew.isPending || del.isPending;

  return (
    <div className="rounded-xl bg-background border border-border p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: plan.trainingColor || '#3DC4DB' }} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{plan.planNombre}</p>
          <p className="text-xs text-muted-foreground">{plan.trainingNombre} · {plan.modalidad}</p>
          <p className="text-xs font-semibold text-primary mt-0.5">{formatCop(plan.precioCopAplicado)}</p>
        </div>
        <button
          onClick={confirmDelete}
          disabled={busy}
          title="Desactivar plan"
          className="size-8 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Fechas editables */}
      <div className="flex items-center gap-1.5">
        <input type="date" value={ini} onChange={(e) => setIni(e.target.value)} className="flex-1 h-9 px-2 rounded-lg bg-card border border-border text-xs outline-none focus:border-primary" />
        <span className="text-muted-foreground text-xs">–</span>
        <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="flex-1 h-9 px-2 rounded-lg bg-card border border-border text-xs outline-none focus:border-primary" />
        {dirty && (
          <button onClick={() => save.mutate()} disabled={busy} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
            Guardar
          </button>
        )}
      </div>

      {/* Renovación + renovar ahora */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center rounded-lg bg-card border border-border p-0.5">
          <button
            onClick={() => toggleRenov.mutate(true)}
            disabled={busy}
            className={`px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors ${plan.renovacionAutomatica ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            Automática
          </button>
          <button
            onClick={() => toggleRenov.mutate(false)}
            disabled={busy}
            className={`px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors ${!plan.renovacionAutomatica ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          >
            Manual
          </button>
        </div>
        <button
          onClick={() => renew.mutate()}
          disabled={busy}
          className="h-8 px-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          Renovar
        </button>
      </div>
    </div>
  );
}

/* ─── Vista detalle usuario ─────────────────────────────────────────── */
export function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const me = useAuth((s) => s.user);
  const isSuperAdmin = me?.rol === 'super_admin';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-ficha', userId],
    queryFn: () => api.get<{ user: ProfileUser; planActivo: PlanActivo | null; planesActivos: PlanActivo[] }>(`/users/${userId}/ficha`),
  });

  const { uploading: uploadingAvatar, upload, remove } = useAvatarUpload({
    patchPath: `/users/${userId}`,
    onDone: () => { refetch(); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const { data: scoringData } = useQuery({
    queryKey: ['user-scoring', userId],
    queryFn: () => api.get<ScoringData>(`/stats/${userId}/scoring`),
  });

  const { data: menoresData } = useQuery({
    queryKey: ['user-menores', userId],
    queryFn: () => api.get<{ menores: { menorId: string; nombre: string; avatarUrl?: string | null; relacion: string }[] }>(`/users/${userId}/menores`),
    enabled: !!data?.user?.esAcudiente,
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

  async function handleDelete() {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción es permanente y no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11', color: '#f8f8f8',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10', confirmButton: 'rounded-xl font-semibold', cancelButton: 'rounded-xl font-semibold' },
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/users/${userId}/hard`);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario eliminado');
      onClose();
    } catch {
      toast.error('No se pudo eliminar el usuario');
    }
  }

  const u = data?.user;
  const planes = data?.planesActivos ?? [];
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
          <>
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
            {isSuperAdmin && (
              <button
                onClick={handleDelete}
                className="size-8 rounded-full border border-red-500/30 text-red-400 bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                title="Eliminar usuario"
              >
                <Trash2 size={14} />
              </button>
            )}
          </>
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
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} disabled={uploadingAvatar} />
                </label>
                {u.avatarUrl && (
                  <button
                    onClick={remove}
                    className="absolute -bottom-1 -right-1 size-5 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    title="Eliminar foto"
                  >
                    <Trash2 size={10} className="text-white" />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <NameField nombre={u.nombre} userId={userId} />
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ROL_LABEL[u.rol] ?? u.rol}
                  {u.esMenor && ' · Menor'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Desde {new Date(u.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            {/* Scoring — solo para clientes */}
            {u.rol === 'user' && scoringData && (
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

            {/* Plan activo — solo para clientes */}
            {u.rol === 'user' && (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Planes activos</p>
                {planes.length > 0 ? (
                  <div className="space-y-2">
                    {planes.map((plan) => (
                      <PlanRow key={plan.id} plan={plan} onChanged={refetch} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin plan asignado</p>
                )}
                <AssignPlanPanel userId={userId} onAssigned={refetch} />
              </div>
            )}

            {/* Menores a cargo — solo acudiente */}
            {u.esAcudiente && (
              <div className="rounded-2xl bg-pink-500/5 border border-pink-500/20 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">Menores a cargo</p>
                {menoresData?.menores.length ? (
                  menoresData.menores.map((m) => {
                    const ini = m.nombre.split(' ').map((w: string) => w[0]).slice(0, 2).join('');
                    return (
                      <div key={m.menorId} className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-white/10 grid place-items-center text-xs font-bold shrink-0 overflow-hidden">
                          {m.avatarUrl ? <img src={m.avatarUrl} className="size-full object-cover" /> : ini}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.nombre}</p>
                          <p className="text-xs text-muted-foreground capitalize">{m.relacion}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sin menores vinculados aún</p>
                )}
              </div>
            )}

            {/* Datos personales */}
            <div className="rounded-2xl bg-card border border-border px-4">
              <Field label="Teléfono (login)" value={u.telefono} icon={Phone} userId={userId} fieldKey="telefono" type="tel" />
              <Field label="Documento" value={u.documento} icon={CreditCard} userId={userId} fieldKey="documento" />
              <Field label="Correo electrónico" value={u.email} icon={Mail} userId={userId} fieldKey="email" type="email" />
              <Field label="Fecha de nacimiento" value={u.fechaNacimiento ?? null} icon={Calendar} userId={userId} fieldKey="fechaNacimiento" type="date" />
              <Field label="Género" value={u.genero} icon={User} userId={userId} fieldKey="genero" />
              <Field label="Peso (kg)" value={u.pesoKg ? String(u.pesoKg) : null} icon={Weight} userId={userId} fieldKey="pesoKg" type="number" />
              <Field label="Altura (cm)" value={u.alturaCm ? String(u.alturaCm) : null} icon={Ruler} userId={userId} fieldKey="alturaCm" type="number" />
            </div>

            {/* Bio */}
            {u.bio && (
              <div className="rounded-2xl bg-card border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bio</p>
                <p className="text-sm text-muted-foreground">{u.bio}</p>
              </div>
            )}

            {/* Contraseña — solo super_admin */}
            {isSuperAdmin && <PasswordField userId={userId} value={u.passwordPlain} />}

            {/* Términos y condiciones */}
            {isSuperAdmin && u.rol === 'user' && <TerminosRow userId={userId} aceptadosAt={u.terminosAceptadosAt} docUrl={u.terminosDocUrl} />}
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
    tipo: 'user' as 'user' | 'coach' | 'menor',
    relacionAcudiente: 'padre' as 'padre' | 'madre' | 'tutor' | 'otro',
    // datos acudiente (solo para menor)
    acudienteNombre: '',
    acudienteDocumento: '',
    acudienteTelefono: '',
    acudienteEmail: '',
    acudientePassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showAcudientePwd, setShowAcudientePwd] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      if (form.tipo === 'menor') {
        // 1. Crear acudiente primero
        const acudienteRes = await api.post<{ user: { id: string }; passwordTemporal?: string }>('/users', {
          nombreCompleto: form.acudienteNombre,
          documento: form.acudienteDocumento,
          rol: 'user',
          esMenor: false,
          esAcudiente: true,
          ...(form.acudienteTelefono && { telefono: form.acudienteTelefono }),
          ...(form.acudienteEmail && { email: form.acudienteEmail }),
          ...(form.acudientePassword && { password: form.acudientePassword }),
        });
        // 2. Crear menor vinculado
        await api.post('/users', {
          nombreCompleto: form.nombreCompleto,
          documento: form.documento,
          rol: 'user',
          esMenor: true,
          acudienteId: acudienteRes.user.id,
          relacionAcudiente: form.relacionAcudiente,
          ...(form.email && { email: form.email }),
          ...(form.telefono && { telefono: form.telefono }),
          ...(form.fechaNacimiento && { fechaNacimiento: form.fechaNacimiento }),
          ...(form.password && { password: form.password }),
        });
        return acudienteRes;
      }
      // Cliente o coach
      return api.post<{ user: { id: string }; passwordTemporal?: string }>('/users', {
        nombreCompleto: form.nombreCompleto,
        documento: form.documento,
        rol: form.tipo === 'coach' ? 'coach' : 'user',
        esMenor: false,
        ...(form.email && { email: form.email }),
        ...(form.telefono && { telefono: form.telefono }),
        ...(form.fechaNacimiento && { fechaNacimiento: form.fechaNacimiento }),
        ...(form.password && { password: form.password }),
      });
    },
    onSuccess: (d) => onSuccess(d.passwordTemporal),
    onError: () => toast.error('No se pudo crear el usuario'),
  });

  const valid = form.tipo === 'menor'
    ? form.nombreCompleto.trim().length > 2 && form.documento.trim().length > 3
      && form.acudienteNombre.trim().length > 2 && form.acudienteDocumento.trim().length > 3
    : form.nombreCompleto.trim().length > 2 && form.documento.trim().length > 3;

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
          <div className="grid grid-cols-3 gap-2">
            {(['user', 'coach', 'menor'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, tipo: t, acudienteNombre: '', acudienteDocumento: '' })}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.tipo === t ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {t === 'user' ? 'Cliente' : t === 'coach' ? 'Entrenador' : 'Menor'}
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
            { key: 'email', label: 'Correo electrónico (opcional)', type: 'email' },
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
        </div>

        {/* Acudiente — solo para menor */}
        {form.tipo === 'menor' && (
          <div className="rounded-2xl bg-card border border-amber-500/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Datos del acudiente *</p>
            {[
              { key: 'acudienteNombre', label: 'Nombre completo *', type: 'text' },
              { key: 'acudienteDocumento', label: 'Documento *', type: 'text' },
              { key: 'acudienteTelefono', label: 'Teléfono (login)', type: 'tel' },
              { key: 'acudienteEmail', label: 'Correo electrónico (opcional)', type: 'email' },
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
            <div>
              <label className="text-xs text-muted-foreground">Contraseña acudiente</label>
              <div className="relative mt-1">
                <input
                  value={form.acudientePassword}
                  onChange={(e) => setForm({ ...form, acudientePassword: e.target.value })}
                  type={showAcudientePwd ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
                />
                <button type="button" onClick={() => setShowAcudientePwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showAcudientePwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Relación con el menor</label>
              <select
                value={form.relacionAcudiente}
                onChange={(e) => setForm({ ...form, relacionAcudiente: e.target.value as typeof form.relacionAcudiente })}
                className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
              >
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="tutor">Tutor</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
        )}

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
