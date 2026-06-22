import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, StatCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface PlanType {
  id: string;
  nombre: string;
  modalidad: 'individual' | 'pareja' | 'amigos';
  precioBaseCop: number;
  trainingSlug: string;
  trainingNombre: string;
  trainingColor: string;
  activo: boolean;
  duracionDias?: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function formatCop(n: number) {
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

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

/* ─── Plan Card ─────────────────────────────────────────────────────── */
function PlanCard({ plan }: { plan: PlanType }) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => api.patch(`/plans/types/${plan.id}`, { activo: !plan.activo }),
    onSuccess: () => {
      toast.success(plan.activo ? `Plan "${plan.nombre}" desactivado.` : `Plan "${plan.nombre}" activado.`);
      qc.invalidateQueries({ queryKey: ['plan-types'] });
    },
    onError: () => toast.error('No se pudo actualizar el plan.'),
  });

  return (
    <Card className={plan.activo ? '' : 'opacity-60'}>
      <div className="flex items-start gap-3">
        <div
          className="size-3 rounded-full flex-shrink-0 mt-1.5"
          style={{ backgroundColor: plan.trainingColor || '#3DC4DB' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm">{plan.nombre}</p>
              <p className="text-xs text-muted-foreground">{plan.trainingNombre}</p>
            </div>
            <Button
              variant={plan.activo ? 'outline' : 'primary'}
              size="sm"
              loading={toggle.isPending}
              onClick={() => toggle.mutate()}
              className="flex-shrink-0 text-xs"
            >
              {plan.activo ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${MODALIDAD_STYLES[plan.modalidad]}`}
            >
              {MODALIDAD_LABEL[plan.modalidad] ?? plan.modalidad}
            </span>
            <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
              {formatCop(plan.precioBaseCop)}
            </span>
            {plan.duracionDias && (
              <span className="text-[10px] text-muted-foreground">
                {plan.duracionDias} días
              </span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                plan.activo
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-white/5 text-muted-foreground border-border'
              }`}
            >
              {plan.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export function PlansAdmin() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['plan-types'],
    queryFn: () => api.get<{ planTypes: PlanType[] }>('/plans/types'),
  });

  const grouped = useMemo(() => {
    if (!data?.planTypes) return {};
    return data.planTypes.reduce<Record<string, PlanType[]>>((acc, plan) => {
      const key = plan.trainingNombre || plan.trainingSlug;
      if (!acc[key]) acc[key] = [];
      acc[key].push(plan);
      return acc;
    }, {});
  }, [data]);

  const activeCount = useMemo(
    () => data?.planTypes.filter((p) => p.activo).length ?? 0,
    [data],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Planes</h1>
        <p className="text-sm text-muted-foreground mt-1">Tipos de planes y precios.</p>
      </div>

      {isLoading ? (
        <div className="h-24 rounded-2xl bg-card animate-pulse" />
      ) : !isError ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Planes activos" value={activeCount} accent />
          <StatCard label="Total planes" value={data?.planTypes.length ?? 0} />
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-32 rounded bg-card animate-pulse" />
              {Array.from({ length: 2 }).map((__, j) => (
                <div key={j} className="h-24 rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-4">No se pudo cargar los planes.</p>
        </Card>
      ) : !Object.keys(grouped).length ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-8">No hay planes registrados.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([training, plans], gi) => (
            <motion.div
              key={training}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: gi * 0.08 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: plans[0].trainingColor || '#3DC4DB' }}
                />
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  {training}
                </h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {plans.filter((p) => p.activo).length}/{plans.length} activos
                </span>
              </div>
              <div className="space-y-3">
                {plans.map((plan, pi) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: gi * 0.08 + pi * 0.05 }}
                  >
                    <PlanCard plan={plan} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
