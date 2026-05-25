import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { format, parseISO, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '@/lib/api';
import { Card, StatCard } from '@/components/shared/Card';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Payment {
  id: string;
  userId: string;
  nombre: string;
  monto: number;
  metodo: string;
  estado: 'exitoso' | 'pendiente' | 'fallido' | 'reembolsado';
  createdAt: string;
  notas?: string;
}

type FilterTab = 'todos' | 'exitoso' | 'pendiente' | 'fallido';

/* ─── Helpers ────────────────────────────────────────────────────────── */
function formatCop(n: number) {
  return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

const ESTADO_STYLES: Record<Payment['estado'], string> = {
  exitoso: 'bg-green-500/15 text-green-400 border-green-500/30',
  pendiente: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  fallido: 'bg-red-500/15 text-red-400 border-red-500/30',
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

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api.get<{ payments: Payment[] }>('/payments/'),
  });

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
      <div>
        <h1 className="text-3xl font-bold">Gestión de Pagos</h1>
        <p className="text-sm text-muted-foreground mt-1">Historial global de transacciones.</p>
      </div>

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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{payment.nombre}</p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${METODO_STYLES[payment.metodo] ?? 'bg-white/10 text-muted-foreground border-border'}`}
                      >
                        {payment.metodo}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(payment.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    {payment.notas && (
                      <p className="text-xs text-muted-foreground italic mt-1 truncate">{payment.notas}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="font-bold text-sm">{formatCop(payment.monto)}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${ESTADO_STYLES[payment.estado]}`}
                    >
                      {payment.estado}
                    </span>
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
