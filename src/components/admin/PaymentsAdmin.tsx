import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { format, parseISO, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { RotateCcw, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { useUiAction } from '@/lib/ui-actions';
import { Card, StatCard } from '@/components/shared/Card';
import { formatCop } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Payment {
  id: string;
  userId: string;
  nombre: string;
  avatarUrl?: string | null;
  monto: number;
  metodo: string;
  estado: 'exitoso' | 'pendiente' | 'fallido' | 'reembolsado';
  createdAt: string;
  notas?: string;
  planNombre?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

type FilterTab = 'todos' | 'exitoso' | 'pendiente' | 'fallido';

/* ─── Helpers ────────────────────────────────────────────────────────── */
// formatCop ahora vive en @/lib/utils (antes redefinido localmente)

const ESTADO_STYLES: Record<Payment['estado'], string> = {
  exitoso: 'bg-green-500/15 text-green-400 border-green-500/30',
  pendiente: 'bg-red-500/15 text-red-400 border-red-500/30',
  fallido: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  reembolsado: 'bg-white/10 text-muted-foreground border-border',
};

const METODO_STYLES: Record<string, string> = {
  EFECTIVO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CARD: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  NEQUI: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PSE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'exitoso', label: 'Exitosos' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'fallido', label: 'Fallidos' },
];

/* ─── Component ──────────────────────────────────────────────────────── */
export function PaymentsAdmin() {
  const [filter, setFilter] = useState<FilterTab>('todos');
  const qc = useQueryClient();
  useUiAction('ir-finanzas', () => { window.location.href = '/admin/finanzas'; });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api.get<{ payments: Payment[] }>('/payments'),
  });

  const setEstado = useMutation({
    mutationFn: (vars: { id: string; estado: 'exitoso' | 'pendiente'; metodo?: string }) =>
      api.patch(`/payments/${vars.id}`, vars.estado === 'exitoso' ? { estado: 'exitoso', metodo: vars.metodo ?? 'efectivo' } : { estado: 'pendiente' }),
    onSuccess: (_, vars) => {
      toast.success(vars.estado === 'exitoso' ? 'Pago marcado como pagado' : 'Pago devuelto a pendiente');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
    },
    onError: () => toast.error('No se pudo actualizar el pago.'),
  });

  const deletePago = useMutation({
    mutationFn: (id: string) => api.delete(`/payments/${id}`),
    onSuccess: () => {
      toast.success('Pago pendiente eliminado');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
    },
    onError: () => toast.error('No se pudo eliminar el pago.'),
  });

  async function handleDelete(payment: Payment) {
    const result = await Swal.fire({
      title: '¿Eliminar pago pendiente?',
      text: `Se borra el cargo de ${formatCop(payment.monto)} de ${payment.nombre}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11', color: '#f8f8f8',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10', confirmButton: 'rounded-xl font-semibold', cancelButton: 'rounded-xl font-semibold' },
      reverseButtons: true,
    });
    if (result.isConfirmed) deletePago.mutate(payment.id);
  }

  const sorted = useMemo(() => {
    if (!data?.payments) return [];
    return [...data.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [data]);

  const filtered = useMemo(() => {
    if (filter === 'todos') return sorted;
    return sorted.filter((p) => p.estado === filter);
  }, [sorted, filter]);

  const ingresosMes = useMemo(() => {
    return sorted
      .filter((p) => p.estado === 'exitoso' && isThisMonth(parseISO(p.createdAt)))
      .reduce((acc, p) => acc + p.monto, 0);
  }, [sorted]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-card animate-pulse" />
          <div className="h-24 rounded-2xl bg-card animate-pulse" />
        </div>
      ) : !isError ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Ingresos del mes" value={formatCop(ingresosMes)} accent />
          <StatCard label="Total registros" value={sorted.length} />
        </div>
      ) : null}

      <div className="flex gap-1 bg-card rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-shrink-0 py-2 px-3 rounded-lg text-xs font-medium transition ${
              filter === t.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-4">No se pudo cargar los pagos.</p>
        </Card>
      ) : !filtered.length ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-8">No hay pagos en esta categoría.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment, i) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
            >
              <Card>
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-full bg-primary/20 grid place-items-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                    {payment.avatarUrl
                      ? <img src={payment.avatarUrl} alt={payment.nombre} className="size-full object-cover" />
                      : payment.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{payment.nombre}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${METODO_STYLES[payment.metodo] ?? 'bg-white/10 text-muted-foreground border-border'}`}
                      >
                        {payment.metodo}
                      </span>
                    </div>
                    {payment.planNombre && (
                      <p className="text-xs text-foreground/80 mt-0.5">{payment.planNombre}</p>
                    )}
                    {payment.fechaInicio && payment.fechaFin && (
                      <p className="text-[11px] text-muted-foreground">
                        {format(parseISO(payment.fechaInicio), 'd MMM', { locale: es })} – {format(parseISO(payment.fechaFin), 'd MMM yyyy', { locale: es })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(payment.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    {payment.notas && (
                      <p className="text-xs text-muted-foreground italic mt-1 truncate">{payment.notas}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="font-bold text-sm">{formatCop(payment.monto)}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${ESTADO_STYLES[payment.estado]}`}
                    >
                      {payment.estado}
                    </span>
                    {payment.estado === 'pendiente' && (
                      <select
                        defaultValue=""
                        disabled={setEstado.isPending}
                        onChange={(e) => {
                          if (e.target.value) setEstado.mutate({ id: payment.id, estado: 'exitoso', metodo: e.target.value });
                        }}
                        className="mt-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition disabled:opacity-50 outline-none cursor-pointer"
                      >
                        <option value="" disabled>Marcar pagado…</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="wompi_pse">Wompi PSE</option>
                      </select>
                    )}
                    {payment.estado === 'pendiente' && (
                      <button
                        onClick={() => handleDelete(payment)}
                        disabled={deletePago.isPending}
                        className="mt-1 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition disabled:opacity-50"
                      >
                        <Trash2 className="size-3" /> Eliminar
                      </button>
                    )}
                    {payment.estado === 'exitoso' && (
                      <button
                        onClick={() => setEstado.mutate({ id: payment.id, estado: 'pendiente' })}
                        disabled={setEstado.isPending}
                        className="mt-1 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition disabled:opacity-50"
                      >
                        <RotateCcw className="size-3" /> Volver a pendiente
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
