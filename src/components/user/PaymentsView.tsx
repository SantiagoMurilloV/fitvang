import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { differenceInCalendarDays } from 'date-fns';
import { CheckCircle2, XCircle, ExternalLink, Copy, Landmark, ImageUp, Clock3, X, CalendarClock } from 'lucide-react';
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
  comprobanteUrl?: string | null;
}

interface PlanResp {
  plan: null | { id: string; planNombre: string; precioCopAplicado: number; fechaFin: string };
}

interface Cuenta {
  banco: string;
  numero: string;
  titular?: string;
}

const ESTADO_STYLE: Record<string, string> = {
  exitoso: 'bg-success/15 text-success border-success/30',
  pendiente: 'bg-destructive/15 text-destructive border-destructive/30',
  fallido: 'bg-warning/15 text-warning border-warning/30',
  reembolsado: 'bg-muted text-muted-foreground border-border',
};

const METODO_LABEL: Record<string, string> = {
  wompi_card: 'Tarjeta',
  wompi_nequi: 'Nequi',
  wompi_pse: 'PSE',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
};

const MAX_COMPROBANTE_BYTES = 5 * 1024 * 1024;

// Entradas sin número (ej. "Pago en efectivo · En la sede") son solo
// informativas: no se copian ni aplican para transferir en el modal.
const esTransferible = (cta: Cuenta) => /\d/.test(cta.numero);

/* ─── Cuentas para transferir ────────────────────────────────────────── */
function CuentasCard({ cuentas }: { cuentas: Cuenta[] }) {
  function copiar(numero: string) {
    navigator.clipboard?.writeText(numero).then(
      () => toast.success('Número copiado'),
      () => toast.error('No se pudo copiar'),
    );
  }
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Landmark className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Cuentas para pagar</h2>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Transfiere a cualquiera de estas cuentas y reporta tu pago con el comprobante.
      </p>
      <div className="mt-3 space-y-2">
        {cuentas.map((cta, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-border px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{cta.banco}</p>
              <p className="text-xs text-muted-foreground">
                {cta.numero}
                {cta.titular ? ` · ${cta.titular}` : ''}
              </p>
            </div>
            {esTransferible(cta) && (
              <button
                onClick={() => copiar(cta.numero)}
                className="size-8 shrink-0 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                title="Copiar número"
              >
                <Copy className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Modal para reportar un pago (cargo pendiente o renovación) ─────── */
interface PagoTarget {
  monto: number;
  descripcion?: string | null;
  // Sube el comprobante y llama esto con el medio y la URL; el caller decide
  // el endpoint (reportar cargo pendiente vs renovar plan) e invalida queries.
  enviar: (metodo: 'transferencia' | 'nequi', comprobanteUrl: string) => Promise<unknown>;
}

function PagarModal({ target, cuentas, onClose }: { target: PagoTarget; cuentas: Cuenta[]; onClose: () => void }) {
  const [metodo, setMetodo] = useState<'transferencia' | 'nequi'>('transferencia');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPickFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_COMPROBANTE_BYTES) {
      toast.error('La imagen supera el límite de 5 MB.');
      return;
    }
    setFile(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  }

  const enviar = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('file', file!);
      const { url } = await api.postForm<{ url: string }>('/upload/comprobante', fd);
      await target.enviar(metodo, url);
    },
    onSuccess: () => {
      toast.success('Pago enviado. Te avisamos cuando el club lo apruebe.');
      onClose();
    },
    onError: () => toast.error('No se pudo enviar el pago. Intenta de nuevo.'),
  });

  const transferibles = cuentas.filter(esTransferible);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-[#111] shadow-2xl max-h-[90dvh] overflow-y-auto"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="h-1 w-full bg-primary" />
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Reportar pago</h2>
              <p className="text-2xl font-bold text-primary mt-1">{formatCop(target.monto)}</p>
              {target.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{target.descripcion}</p>}
            </div>
            <button onClick={onClose} className="size-8 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-4" />
            </button>
          </div>

          {transferibles.length > 0 && (
            <div className="rounded-xl bg-white/5 border border-border p-3 space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Transfiere a</p>
              {transferibles.map((cta, i) => (
                <p key={i} className="text-xs">
                  <span className="font-semibold">{cta.banco}</span>{' '}
                  <span className="text-muted-foreground">{cta.numero}{cta.titular ? ` · ${cta.titular}` : ''}</span>
                </p>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold mb-2">¿Por dónde pagaste?</p>
            <div className="flex gap-2">
              {([['transferencia', 'Transferencia'], ['nequi', 'Nequi']] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMetodo(value)}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition ${
                    metodo === value
                      ? 'bg-primary/15 border-primary/50 text-primary'
                      : 'bg-white/5 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">Comprobante de pago</p>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {preview ? (
                <img src={preview} alt="Comprobante" className="w-full max-h-64 object-contain rounded-xl border border-border bg-black/40" />
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <ImageUp className="size-6" />
                  <span className="text-xs font-medium">Toca para subir el desprendible</span>
                  <span className="text-[10px]">JPG, PNG o WebP · máx 5 MB</span>
                </div>
              )}
            </label>
            {preview && (
              <p className="text-[11px] text-muted-foreground mt-1 text-center">Toca la imagen para cambiarla</p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!file}
            loading={enviar.isPending}
            onClick={() => enviar.mutate()}
          >
            Enviar pago
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            El club revisará tu comprobante y aprobará el pago.
          </p>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/* ─── Vista principal ────────────────────────────────────────────────── */
export function PaymentsView() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<PagoTarget | null>(null);

  const pagos = useQuery({
    queryKey: ['payments-me'],
    queryFn: () => api.get<{ payments: PayRow[] }>('/payments/me'),
  });
  const plan = useQuery({
    queryKey: ['plan-me'],
    queryFn: () => api.get<PlanResp>('/plans/me'),
  });
  const cuentas = useQuery({
    queryKey: ['cuentas-pago'],
    queryFn: () => api.get<{ cuentas: Cuenta[] }>('/config/cuentas-pago'),
  });

  const pendientes = (pagos.data?.payments ?? []).filter((p) => p.estado === 'pendiente');
  const historial = (pagos.data?.payments ?? []).filter((p) => p.estado !== 'pendiente');

  const planActual = plan.data?.plan ?? null;
  const alDia = pagos.isSuccess && pendientes.length === 0;
  // Renovación self-service: solo desde 2 días antes del vencimiento y sin deudas
  const diasRestantes = planActual
    ? differenceInCalendarDays(new Date(planActual.fechaFin + 'T12:00:00'), new Date())
    : null;
  const puedeRenovar = !!planActual && alDia && diasRestantes !== null && diasRestantes <= 2;

  function pagarCargo(p: PayRow) {
    setModal({
      monto: p.monto,
      descripcion: p.notas,
      enviar: async (metodo, comprobanteUrl) => {
        await api.post(`/payments/${p.id}/reportar`, { metodo, comprobanteUrl });
        qc.invalidateQueries({ queryKey: ['payments-me'] });
      },
    });
  }

  function pagarRenovacion() {
    if (!planActual) return;
    setModal({
      monto: planActual.precioCopAplicado,
      descripcion: `Renovación · ${planActual.planNombre}`,
      enviar: async (metodo, comprobanteUrl) => {
        await api.post('/plans/me/renovar', { metodo, comprobanteUrl, userPlanId: planActual.id });
        qc.invalidateQueries({ queryKey: ['payments-me'] });
        qc.invalidateQueries({ queryKey: ['plan-me'] });
      },
    });
  }

  return (
    <div className="space-y-5">
      {planActual && (
        <Card className="border-primary/30">
          <p className="text-xs uppercase tracking-wider text-primary">Plan actual</p>
          <h2 className="text-xl font-bold mt-1">{planActual.planNombre}</h2>
          <p className="text-sm text-muted-foreground">
            Vence {new Date(planActual.fechaFin + 'T12:00:00').toLocaleDateString('es-CO')}
          </p>
        </Card>
      )}

      {!planActual && !plan.isLoading && (
        <Card className="text-center py-6">
          <p className="text-sm text-muted-foreground">No tienes un plan activo.</p>
          <p className="text-xs text-muted-foreground mt-1">Contacta al club para adquirir uno.</p>
        </Card>
      )}

      {puedeRenovar && (
        <Card className="border-warning/40">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-warning" />
            <h2 className="text-sm font-semibold">Tu plan vence pronto</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paga el siguiente mes para no perder tu cupo.
          </p>
          <Button className="mt-3 w-full" onClick={pagarRenovacion}>
            Pagar siguiente mes — {formatCop(planActual!.precioCopAplicado)}
          </Button>
        </Card>
      )}

      {alDia && !!planActual && !puedeRenovar && (
        <Card className="border-success/30 flex items-center gap-3 py-4">
          <CheckCircle2 className="size-6 text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold">Estás al día</p>
            <p className="text-xs text-muted-foreground">No tienes pagos pendientes. ¡A entrenar!</p>
          </div>
        </Card>
      )}

      {(pendientes.length > 0 || puedeRenovar) && (cuentas.data?.cuentas.length ?? 0) > 0 && (
        <CuentasCard cuentas={cuentas.data!.cuentas} />
      )}

      {pendientes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Saldo pendiente</h2>
          {pendientes.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 py-3 border-destructive/30">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{formatCop(p.monto)}</p>
                {p.notas && <p className="text-xs text-muted-foreground truncate">{p.notas}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {p.comprobanteUrl ? (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 shrink-0">
                  <Clock3 className="size-3" /> En revisión
                </span>
              ) : (
                <Button size="sm" className="shrink-0" onClick={() => pagarCargo(p)}>
                  Pagar
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Historial</h2>
        {pagos.isLoading && [0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />
        ))}
        {historial.length === 0 && !pagos.isLoading && (
          <Card>
            <p className="text-sm text-muted-foreground text-center py-4">Sin pagos registrados aún.</p>
          </Card>
        )}
        {historial.map((p, i) => (
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
                {p.comprobanteUrl && (
                  <a
                    href={p.comprobanteUrl}
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

      <AnimatePresence>
        {modal && (
          <PagarModal
            target={modal}
            cuentas={cuentas.data?.cuentas ?? []}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
