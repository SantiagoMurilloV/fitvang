import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Pencil, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useUiAction } from '@/lib/ui-actions';
import { Card, StatCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatCop } from '@/lib/utils';
import Swal from 'sweetalert2';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface TrainingType {
  id: string;
  nombre: string;
  slug: string;
  colorHex: string;
}

interface PlanType {
  id: string;
  nombre: string;
  modalidad: 'individual' | 'pareja' | 'amigos';
  precioBaseCop: number;
  trainingSlug: string;
  trainingNombre: string;
  trainingColor: string;
  trainingTypeId: string;
  activo: boolean;
  duracionDias?: number;
  descripcion?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
// formatCop ahora vive en @/lib/utils (antes redefinido localmente)

const MODALIDAD_STYLES: Record<PlanType['modalidad'], string> = {
  individual: 'bg-primary/10 text-primary border-primary/30',
  pareja: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  amigos: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const MODALIDAD_LABEL: Record<PlanType['modalidad'], string> = {
  individual: 'Individual',
  pareja: 'Pareja',
  amigos: 'Amigos',
};

/* ─── Plan Form Modal ────────────────────────────────────────────────── */
function PlanFormModal({
  plan,
  trainingTypes,
  onClose,
  onSuccess,
}: {
  plan?: PlanType;
  trainingTypes: TrainingType[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!plan;
  const [form, setForm] = useState({
    nombre: plan?.nombre ?? '',
    modalidad: plan?.modalidad ?? 'individual' as PlanType['modalidad'],
    precioBaseCop: plan?.precioBaseCop ?? 0,
    trainingTypeId: plan?.trainingTypeId ?? (trainingTypes[0]?.id ?? ''),
    duracionDias: plan?.duracionDias ?? 30,
    descripcion: plan?.descripcion ?? '',
    activo: plan?.activo ?? true,
  });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        nombre: form.nombre,
        modalidad: form.modalidad,
        precioBaseCop: Number(form.precioBaseCop),
        trainingTypeId: form.trainingTypeId,
        duracionDias: Number(form.duracionDias),
        descripcion: form.descripcion || undefined,
        activo: form.activo,
      };
      return isEdit
        ? api.patch(`/plans/types/${plan!.id}`, body)
        : api.post('/plans/types', body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Plan actualizado' : 'Plan creado');
      onSuccess();
    },
    onError: () => toast.error('No se pudo guardar el plan'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-md bg-card border-t md:border border-border md:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{isEdit ? 'Editar plan' : 'Nuevo plan'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Nombre del plan</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Modalidad</label>
            <select value={form.modalidad} onChange={(e) => setForm({ ...form, modalidad: e.target.value as PlanType['modalidad'] })}
              className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm">
              <option value="individual">Individual</option>
              <option value="pareja">Pareja</option>
              <option value="amigos">Amigos</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Duración (días)</label>
            <input type="number" value={form.duracionDias} onChange={(e) => setForm({ ...form, duracionDias: Number(e.target.value) })}
              className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Precio (COP)</label>
          <input type="number" value={form.precioBaseCop} onChange={(e) => setForm({ ...form, precioBaseCop: Number(e.target.value) })}
            className="mt-1 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Categoría (tipo de entrenamiento)</label>
          <select value={form.trainingTypeId} onChange={(e) => setForm({ ...form, trainingTypeId: e.target.value })}
            className="mt-1 w-full h-11 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm">
            {trainingTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Descripción (opcional)</label>
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={2} className="mt-1 w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm resize-none" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          Plan activo (visible para asignación)
        </label>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={save.isPending} onClick={() => save.mutate()}>
            {isEdit ? 'Guardar cambios' : 'Crear plan'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Plan Card ─────────────────────────────────────────────────────── */
function PlanCard({ plan, trainingTypes, onEdit, onRefetch }: { plan: PlanType; trainingTypes: TrainingType[]; onEdit: () => void; onRefetch: () => void }) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => api.patch(`/plans/types/${plan.id}`, { activo: !plan.activo }),
    onSuccess: () => {
      toast.success(plan.activo ? `"${plan.nombre}" desactivado` : `"${plan.nombre}" activado`);
      onRefetch();
    },
    onError: () => toast.error('No se pudo actualizar el plan.'),
  });

  async function handleDelete() {
    const result = await Swal.fire({
      title: `¿Eliminar "${plan.nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
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
      await api.delete(`/plans/types/${plan.id}`);
      toast.success('Plan eliminado');
      onRefetch();
    } catch {
      toast.error('No se pudo eliminar el plan');
    }
  }

  return (
    <Card className={plan.activo ? '' : 'opacity-60'}>
      <div className="flex items-start gap-3">
        <div className="size-3 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: plan.trainingColor || '#3DC4DB' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{plan.nombre}</p>
              <p className="text-xs text-muted-foreground">{plan.trainingNombre}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onEdit} className="size-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Pencil size={12} />
              </button>
              <button onClick={handleDelete} className="size-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${MODALIDAD_STYLES[plan.modalidad]}`}>
              {MODALIDAD_LABEL[plan.modalidad]}
            </span>
            <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
              {formatCop(plan.precioBaseCop)}
            </span>
            {plan.duracionDias && (
              <span className="text-[10px] text-muted-foreground">{plan.duracionDias} días</span>
            )}
            <button
              onClick={() => toggle.mutate()}
              disabled={toggle.isPending}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                plan.activo
                  ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                  : 'bg-white/5 text-muted-foreground border-border hover:bg-white/10'
              }`}
            >
              {plan.activo ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function PlansAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<PlanType | null>(null);

  useUiAction('crear-plan', () => { setEditPlan(null); setShowForm(true); });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['plan-types'],
    queryFn: () => api.get<{ planTypes: PlanType[] }>('/plans/types'),
  });

  const { data: trainingData } = useQuery({
    queryKey: ['training-types'],
    queryFn: () => api.get<{ trainingTypes: TrainingType[] }>('/classes/training-types'),
  });

  const trainingTypes = trainingData?.trainingTypes ?? [];
  const plans = data?.planTypes ?? [];
  const activeCount = plans.filter((p) => p.activo).length;

  const grouped = plans.reduce<Record<string, PlanType[]>>((acc, plan) => {
    const key = plan.trainingNombre || plan.trainingSlug;
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {});

  function refetch() {
    qc.invalidateQueries({ queryKey: ['plan-types'] });
  }

  return (
    <div className="space-y-6">

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Planes activos" value={activeCount} accent />
          <StatCard label="Total planes" value={plans.length} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : isError ? (
        <Card><p className="text-sm text-muted-foreground text-center py-4">No se pudo cargar los planes.</p></Card>
      ) : !plans.length ? (
        <Card><p className="text-sm text-muted-foreground text-center py-8">No hay planes. Crea el primero.</p></Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([training, groupPlans], gi) => (
            <motion.div key={training} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: gi * 0.07 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: groupPlans[0].trainingColor || '#3DC4DB' }} />
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{training}</h2>
                <span className="text-xs text-muted-foreground ml-auto">{groupPlans.filter((p) => p.activo).length}/{groupPlans.length} activos</span>
              </div>
              <div className="space-y-3">
                {groupPlans.map((plan, pi) => (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: gi * 0.07 + pi * 0.05 }}>
                    <PlanCard
                      plan={plan}
                      trainingTypes={trainingTypes}
                      onEdit={() => { setEditPlan(plan); setShowForm(true); }}
                      onRefetch={refetch}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <PlanFormModal
          plan={editPlan ?? undefined}
          trainingTypes={trainingTypes}
          onClose={() => { setShowForm(false); setEditPlan(null); }}
          onSuccess={() => { setShowForm(false); setEditPlan(null); refetch(); }}
        />
      )}
    </div>
  );
}
