import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
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
  referenciaExterna?: string | null;
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

const METODO_LABEL: Record<string, string> = {
  wompi_card: 'Tarjeta',
  wompi_nequi: 'Nequi',
  wompi_pse: 'PSE',
  efectivo: 'Efectivo',
};

function wompiReceiptUrl(referencia: string): string {
  return `https://checkout.wompi.co/p/?reference=${referencia}`;
}

export function PaymentsView() {
  const qc = useQueryClient();

  // Leer resultado de retorno Wompi desde URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get('resultado');
    if (resultado === 'ok') {
      toast.success('¡Pago procesado! Tu plan se activará en segundos. 💪');
      qc.invalidateQueries({ queryKey: ['payments-me'] });
      qc.invalidateQueries({ queryKey: ['plan-me'] });
      // Limpiar query params sin recargar
      const url = new URL(window.location.href);
      url.searchParams.delete('resultado');
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    } else if (resultado === 'error' || resultado === 'declined') {
      toast.error('El pago no se completó. Intenta de nuevo.');
      const url = new URL(window.location.href);
      url.searchParams.delete('resultado');
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }, [qc]);

  const pagos = useQuery({
    queryKey: ['payments-me'],
    queryFn: () => api.get<{ payments: PayRow[] }>('/payments/me'),
  });
  const plan = useQuery({
    queryKey: ['plan-me'],
    queryFn: () => api.get<PlanResp>('/plans/me'),
  });

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
          <p className="text-sm text-muted-foreground">
            Vence {new Date(plan.data.plan.fechaFin).toLocaleDateString('es-CO')}
          </p>
          <Button className="mt-4 w-full" loading={intent.isPending} onClick={() => intent.mutate()}>
            Renovar — {formatCop(plan.data.plan!.precioCopAplicado)}
          </Button>
          <p className="text-[10px] mt-2 text-center text-muted-foreground">
            Pago seguro vía Wompi · Tarjeta · Nequi · PSE
          </p>
        </Card>
      )}

      {!plan.data?.plan && !plan.isLoading && (
        <Card className="text-center py-6">
          <p className="text-sm text-muted-foreground">No tienes un plan activo.</p>
          <p className="text-xs text-muted-foreground mt-1">Contacta al club para adquirir uno.</p>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Historial</h2>
        {pagos.isLoading && [0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />
        ))}
        {(pagos.data?.payments ?? []).length === 0 && !pagos.isLoading && (
          <Card>
            <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados aún.</p>
          </Card>
        )}
        {pagos.data?.payments.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="flex items-center gap-3 py-3">
              <div className="shrink-0">
                {p.estado === 'exitoso'
                  ? <CheckCircle2 className="size-5 text-success" />
                  : p.estado === 'fallido'
                  ? <XCircle className="size-5 text-destructive" />
                  : <div className="size-5 rounded-full border-2 border-warning animate-pulse" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{formatCop(p.monto)}</p>
                <p className="text-xs text-muted-foreground">
                  {METODO_LABEL[p.metodo] ?? p.metodo} · {new Date(p.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {p.notas && <p className="text-xs text-muted-foreground truncate">{p.notas}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] uppercase tracking-wider border rounded-full px-2 py-1 ${ESTADO_STYLE[p.estado]}`}>
                  {p.estado}
                </span>
                {p.referenciaExterna && p.metodo !== 'efectivo' && (
                  <a
                    href={wompiReceiptUrl(p.referenciaExterna)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                    title="Ver comprobante"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
