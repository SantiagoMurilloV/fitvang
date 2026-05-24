import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatCop } from '@/lib/utils';

interface PayRow {
  id: string;
  monto: number;
  metodo: string;
  estado: 'pendiente' | 'exitoso' | 'fallido' | 'reembolsado';
  createdAt: string;
  notas?: string | null;
  userPlanId?: string | null;
}

interface PlanResp {
  plan: null | { id: string; planNombre: string; precioCopAplicado: number; fechaFin: string };
}

const ESTADO_STYLE: Record<string, string> = {
  exitoso: 'bg-success/15 text-success border-success/30',
  pendiente: 'bg-warning/15 text-warning border-warning/30',
  fallido: 'bg-destructive/15 text-destructive border-destructive/30',
  reembolsado: 'bg-muted text-muted-foreground border-border',
};

export function PaymentsView() {
  const pagos = useQuery({ queryKey: ['payments-me'], queryFn: () => api.get<{ payments: PayRow[] }>('/payments/me') });
  const plan = useQuery({ queryKey: ['plan-me'], queryFn: () => api.get<PlanResp>('/plans/me') });

  const intent = useMutation({
    mutationFn: () =>
      api.post<{ checkoutUrl: string }>('/payments/wompi/intent', {
        userPlanId: plan.data?.plan?.id,
        metodo: 'wompi_card',
      }),
    onSuccess: (d) => {
      window.location.href = d.checkoutUrl;
    },
    onError: () => toast.error('No pudimos abrir el pago. Intenta de nuevo.'),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Mis pagos</h1>

      {plan.data?.plan && (
        <Card className="border-primary/30">
          <p className="text-xs uppercase tracking-wider text-primary">Plan actual</p>
          <h2 className="text-xl font-bold mt-1">{plan.data.plan.planNombre}</h2>
          <p className="text-sm text-muted-foreground">Vence {new Date(plan.data.plan.fechaFin).toLocaleDateString('es-CO')}</p>
          <Button className="mt-4 w-full" loading={intent.isPending} onClick={() => intent.mutate()}>
            Renovar — {formatCop(plan.data.plan!.precioCopAplicado)}
          </Button>
          <p className="text-[10px] mt-2 text-center text-muted-foreground">
            Pago seguro vía Wompi · Card · Nequi · PSE
          </p>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Historial</h2>
        {(pagos.data?.payments ?? []).length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados aún.</p>
          </Card>
        )}
        {pagos.data?.payments.map((p) => (
          <Card key={p.id} className="flex items-center gap-3 py-3">
            <div className="flex-1">
              <p className="font-semibold text-sm">{formatCop(p.monto)}</p>
              <p className="text-xs text-muted-foreground">
                {p.metodo.replace('wompi_', '').toUpperCase()} · {new Date(p.createdAt).toLocaleDateString('es-CO')}
              </p>
            </div>
            <span className={`text-[10px] uppercase tracking-wider border rounded-full px-2 py-1 ${ESTADO_STYLE[p.estado]}`}>
              {p.estado}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
