import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Camera, Edit2, Check, X, LogOut, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadAvatar } from '@/lib/cloudinary';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import Swal from 'sweetalert2';

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: string;
  avatarUrl?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;
  esMenor: boolean;
  pesoKg?: string | null;
  alturaCm?: number | null;
  bio?: string | null;
  createdAt: string;
}

interface MyPlan {
  plan: null | {
    planNombre: string;
    trainingNombre: string;
    fechaFin: string;
    sesionesTotales: number | null;
    sesionesUsadas: number;
  };
}

const GENERO_LABEL: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiero no decir',
};

function AvatarBlock({ profile, onAvatarChange, onNameSave }: {
  profile: UserProfile;
  onAvatarChange: (url: string) => void;
  onNameSave: (name: string) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.nombre);
  const [savingName, setSavingName] = useState(false);

  async function saveName() {
    if (!nameDraft.trim() || nameDraft === profile.nombre) { setEditingName(false); return; }
    setSavingName(true);
    try {
      await onNameSave(nameDraft.trim());
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }

  const initials = profile.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes.'); return; }
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await api.patch('/users/me', { avatarUrl: url });
      onAvatarChange(url);
      toast.success('Foto actualizada ✓');
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    const result = await Swal.fire({
      title: 'Eliminar foto',
      text: '¿Quitar tu foto de perfil?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11', color: '#f8f8f8',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10', confirmButton: 'rounded-xl font-semibold', cancelButton: 'rounded-xl font-semibold' },
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch('/users/me', { avatarUrl: '' });
      onAvatarChange('');
      toast.success('Foto eliminada');
    } catch {
      toast.error('No se pudo eliminar la foto.');
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="size-24 rounded-full overflow-hidden bg-card border-2 border-primary/30 flex items-center justify-center">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.nombre} className="size-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-primary">{initials}</span>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary text-background flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {uploading
            ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            : <Camera className="size-4" />
          }
        </button>
        {profile.avatarUrl && (
          <button
            onClick={handleRemove}
            className="absolute -bottom-1 -left-1 size-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            title="Eliminar foto"
          >
            <Trash2 size={10} className="text-white" />
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      <div className="text-center">
        {editingName ? (
          <div className="flex items-center gap-2 justify-center">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameDraft(profile.nombre); setEditingName(false); } }}
              maxLength={120}
              className="h-9 px-3 rounded-xl bg-background border border-primary text-sm text-center outline-none w-48"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 disabled:opacity-50 shrink-0"
            >
              {savingName ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={() => { setNameDraft(profile.nombre); setEditingName(false); }} className="size-8 rounded-xl border border-border flex items-center justify-center hover:border-destructive hover:text-destructive shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNameDraft(profile.nombre); setEditingName(true); }}
            className="flex items-center gap-1.5 justify-center"
          >
            <span className="font-bold text-lg">{profile.nombre}</span>
            <Edit2 size={13} className="text-primary/60" />
          </button>
        )}
        <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
  maxLength,
  isTextarea,
}: {
  label: string;
  value: string;
  onSave: (v: string) => Promise<void>;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  isTextarea?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() { setDraft(value); setEditing(false); }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-primary/60 hover:text-primary transition-colors">
            <Edit2 className="size-3.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2 items-start">
          {isTextarea ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              rows={3}
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-primary text-sm outline-none resize-none"
            />
          ) : (
            <input
              autoFocus
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={maxLength}
              placeholder={placeholder}
              className="flex-1 h-10 px-3 rounded-xl bg-background border border-primary text-sm outline-none"
            />
          )}
          <button
            onClick={save}
            disabled={saving}
            className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-50 shrink-0"
          >
            {saving ? <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Check className="size-4" />}
          </button>
          <button
            onClick={cancel}
            className="size-10 rounded-xl border border-border flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <p className="text-sm text-foreground min-h-[20px]">{value || <span className="text-muted-foreground italic">{placeholder ?? 'No especificado'}</span>}</p>
      )}
    </div>
  );
}

export function ProfileView() {
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get<{ user: UserProfile }>('/users/me/profile'),
  });

  const plan = useQuery({
    queryKey: ['plan-me'],
    queryFn: () => api.get<MyPlan>('/plans/me'),
  });

  const patch = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/users/me', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
    onError: () => toast.error('No se pudo guardar el cambio.'),
  });

  function field(key: string) {
    return async (value: string) => {
      const numKeys = ['pesoKg', 'alturaCm'];
      const parsed = numKeys.includes(key) ? (value ? Number(value) : null) : value || null;
      await patch.mutateAsync({ [key]: parsed });
      toast.success('Guardado ✓');
    };
  }

  function logout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).then(() => {
      window.location.href = '/';
    });
  }

  const u = profile.data?.user;
  const p = plan.data?.plan;

  const memberSince = u?.createdAt
    ? new Date(u.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : null;

  if (profile.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-2xl bg-card animate-pulse" />
        <div className="h-48 rounded-2xl bg-card animate-pulse" />
        <div className="h-32 rounded-2xl bg-card animate-pulse" />
      </div>
    );
  }

  if (!u) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      {/* Avatar + nombre */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="flex flex-col items-center py-6">
          <AvatarBlock
            profile={u}
            onAvatarChange={(url) => {
              qc.setQueryData(['my-profile'], (old: any) =>
                old ? { user: { ...old.user, avatarUrl: url } } : old
              );
            }}
            onNameSave={async (nombre) => {
              await patch.mutateAsync({ nombreCompleto: nombre });
              toast.success('Nombre actualizado ✓');
            }}
          />
          {memberSince && (
            <p className="mt-3 text-xs text-muted-foreground">Miembro desde {memberSince}</p>
          )}
        </Card>
      </motion.div>

      {/* Plan activo */}
      {p && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-l-4 border-l-primary">
            <p className="text-[10px] uppercase tracking-wider text-primary mb-1">Plan activo</p>
            <p className="font-bold">{p.planNombre}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.trainingNombre} · Vence {new Date(p.fechaFin).toLocaleDateString('es-CO')}
            </p>
            {p.sesionesTotales != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {p.sesionesUsadas} / {p.sesionesTotales} sesiones usadas
              </p>
            )}
          </Card>
        </motion.div>
      )}

      {/* Datos personales */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Datos personales</p>
          <EditableField
            label="Nombre completo"
            value={u.nombre}
            placeholder="Tu nombre"
            onSave={field('nombreCompleto')}
          />
          <EditableField
            label="Teléfono"
            value={u.telefono ?? ''}
            placeholder="300 000 0000"
            type="tel"
            onSave={field('telefono')}
          />
          <EditableField
            label="Fecha de nacimiento"
            value={u.fechaNacimiento ?? ''}
            type="date"
            onSave={field('fechaNacimiento')}
          />

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Género</span>
            <select
              value={u.genero ?? ''}
              onChange={(e) => patch.mutate({ genero: e.target.value || null })}
              className="h-10 px-3 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary transition"
            >
              <option value="">No especificado</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </select>
          </div>

          <EditableField
            label="Bio (presentación)"
            value={u.bio ?? ''}
            placeholder="Cuéntanos sobre ti..."
            maxLength={300}
            isTextarea
            onSave={field('bio')}
          />
        </Card>
      </motion.div>

      {/* Métricas físicas */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Métricas físicas</p>
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Peso (kg)"
              value={u.pesoKg ? String(u.pesoKg) : ''}
              placeholder="Ej: 70.5"
              type="number"
              onSave={field('pesoKg')}
            />
            <EditableField
              label="Altura (cm)"
              value={u.alturaCm ? String(u.alturaCm) : ''}
              placeholder="Ej: 175"
              type="number"
              onSave={field('alturaCm')}
            />
          </div>
          {u.pesoKg && u.alturaCm && (
            <div className="pt-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">IMC</span>
              <p className="text-lg font-bold mt-0.5">
                {(Number(u.pesoKg) / Math.pow(u.alturaCm / 100, 2)).toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground ml-1">kg/m²</span>
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Cuenta */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Cuenta</p>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</span>
            <p className="text-sm mt-0.5">{u.email}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Rol</span>
            <p className="text-sm mt-0.5 capitalize">{u.rol === 'super_admin' ? 'Admin' : u.rol}</p>
          </div>
          <Button
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="size-4 mr-2" />
            Cerrar sesión
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
