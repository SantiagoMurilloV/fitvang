import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, StatCard } from '@/components/shared/Card';
import { formatCop } from '@/lib/utils';

interface MesFin {
  mes: string;
  ingresos: number;
  pagos: number;
  pendiente: number;
  pendientes: number;
}
interface FinanzasResp {
  meses: MesFin[];
  totales: { ingresos: number; pendiente: number; pendientes: number };
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function mesLabel(m: string) {
  const [y, mm] = m.split('-');
  return `${MESES[Number(mm) - 1]} ${y.slice(2)}`;
}

// Markdown ligero (negrita + viñetas)
function renderInline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}
function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {text.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (/^[-*•]\s+/.test(t)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{renderInline(t.replace(/^[-*•]\s+/, ''))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(t)}</p>;
      })}
    </div>
  );
}

export function FinanzasAdmin() {
  const fin = useQuery({
    queryKey: ['finanzas'],
    queryFn: () => api.get<FinanzasResp>('/stats/finanzas'),
  });
  const analisis = useQuery({
    queryKey: ['finanzas-analisis'],
    queryFn: () => api.get<{ analisis: string }>('/stats/finanzas/analisis'),
  });

  const meses = fin.data?.meses ?? [];
  const maxIngreso = Math.max(1, ...meses.map((m) => m.ingresos));
  const [idx, setIdx] = useState(0); // 0 = mes más reciente
  const safeIdx = meses.length ? Math.min(idx, meses.length - 1) : 0;
  const sel = meses[safeIdx];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">Resumen de finanzas del club, mes a mes.</p>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ingresos confirmados" value={fin.data ? formatCop(fin.data.totales.ingresos) : '—'} accent />
        <StatCard
          label={`Por cobrar (${fin.data?.totales.pendientes ?? 0})`}
          value={fin.data ? formatCop(fin.data.totales.pendiente) : '—'}
        />
      </div>

      {/* Conclusiones del agente */}
      <Card className="border-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="size-7 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center">
            <Brain className="size-4 text-primary" />
          </span>
          <p className="text-sm font-semibold">Conclusiones de Vang</p>
        </div>
        {analisis.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <span className="size-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Analizando las finanzas…
          </div>
        ) : analisis.isError ? (
          <p className="text-sm text-muted-foreground">No se pudo generar el análisis.</p>
        ) : (
          <Rich text={analisis.data?.analisis ?? ''} />
        )}
      </Card>

      {/* Navegador por mes */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Por mes</p>
        {fin.isLoading ? (
          <div className="h-36 rounded-2xl bg-card animate-pulse" />
        ) : meses.length === 0 ? (
          <Card><p className="text-sm text-muted-foreground text-center py-4">Aún no hay pagos registrados.</p></Card>
        ) : (
          <Card className="space-y-4">
            {/* Navegación: ‹ (mes más antiguo)  mes  (mes más reciente) › */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIdx((i) => Math.min(meses.length - 1, i + 1))}
                disabled={safeIdx >= meses.length - 1}
                className="size-9 rounded-full border border-border grid place-items-center hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-base font-bold capitalize">{mesLabel(sel.mes)}</p>
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={safeIdx <= 0}
                className="size-9 rounded-full border border-border grid place-items-center hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Detalle del mes */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-emerald-400">{formatCop(sel.ingresos)}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Ingresos</p>
              </div>
              <div>
                <p className="text-lg font-bold">{sel.pagos}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Pagos</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${sel.pendiente > 0 ? 'text-amber-400' : ''}`}>{formatCop(sel.pendiente)}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Por cobrar</p>
              </div>
            </div>

            {/* Barra relativa al mejor mes */}
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(sel.ingresos / maxIngreso) * 100}%` }} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
