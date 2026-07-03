import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'motion/react';
import { Search, BookOpen, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/shared/Card';
import { UserDetail } from './UserDetail';

interface ActivePlanRow {
  userPlanId: string;
  userId: string;
  nombre: string;
  email: string;
  avatarUrl?: string | null;
  esMenor: boolean;
  planTypeId: string;
  planNombre: string;
  modalidad: string;
  trainingNombre: string;
  trainingColor: string;
  fechaInicio: string;
  fechaFin: string;
  renovacionAutomatica: boolean;
}

function fechaCorta(iso: string): string {
  const d = new Date(iso + 'T12:00');
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function diasRestantes(fechaFin: string): number {
  const fin = new Date(fechaFin + 'T23:59:59').getTime();
  return Math.ceil((fin - Date.now()) / 86_400_000);
}

function PlanRow({ row, onSelect }: { row: ActivePlanRow; onSelect: () => void }) {
  const initials = row.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');
  const dias = diasRestantes(row.fechaFin);
  return (
    <Card>
      <button onClick={onSelect} className="flex items-center gap-3 w-full text-left">
        <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0 overflow-hidden">
          {row.avatarUrl
            ? <img src={row.avatarUrl} alt={row.nombre} className="size-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{row.nombre}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border truncate"
              style={{
                color: row.trainingColor,
                borderColor: `${row.trainingColor}55`,
                background: `${row.trainingColor}1a`,
              }}
            >
              {row.planNombre}
            </span>
            {row.renovacionAutomatica && (
              <RefreshCw className="size-3 text-muted-foreground shrink-0" aria-label="Renovación automática" />
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">
            {fechaCorta(row.fechaInicio)} – {fechaCorta(row.fechaFin)}
          </p>
          <p className={cn('text-[10px] font-medium mt-0.5', dias <= 5 ? 'text-amber-400' : 'text-muted-foreground')}>
            {dias < 0 ? 'Vencido' : dias === 0 ? 'Vence hoy' : `Vence en ${dias} día${dias !== 1 ? 's' : ''}`}
          </p>
        </div>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </button>
    </Card>
  );
}

export function ActivePlansAdmin() {
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('todos');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-active-plans'],
    queryFn: () => api.get<{ activePlans: ActivePlanRow[] }>('/plans/active'),
  });
  const rows = data?.activePlans ?? [];

  // Chips de filtro: solo los planes que realmente tienen usuarios activos
  const planOptions = [...new Map(rows.map((r) => [r.planTypeId, r])).values()]
    .sort((a, b) => a.planNombre.localeCompare(b.planNombre));

  const filtered = rows.filter((r) => {
    if (planFilter !== 'todos' && r.planTypeId !== planFilter) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return r.nombre.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle);
  });

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
        <div className="size-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
          <BookOpen className="size-4.5" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">{rows.length}</p>
          <p className="text-[11px] text-muted-foreground">
            Plan{rows.length !== 1 ? 'es' : ''} activo{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o email"
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none"
        />
      </div>

      {/* Filtro por plan */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => setPlanFilter('todos')}
          className={cn(
            'shrink-0 px-4 h-8 rounded-full text-xs font-medium transition-all',
            planFilter === 'todos'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
              : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-foreground',
          )}
        >
          Todos
        </button>
        {planOptions.map((p) => (
          <button
            key={p.planTypeId}
            onClick={() => setPlanFilter(p.planTypeId)}
            className={cn(
              'shrink-0 px-4 h-8 rounded-full text-xs font-medium transition-all border',
              planFilter === p.planTypeId
                ? 'text-foreground'
                : 'bg-card border-border text-muted-foreground hover:text-foreground',
            )}
            style={planFilter === p.planTypeId
              ? { background: `${p.trainingColor}26`, borderColor: p.trainingColor, color: p.trainingColor }
              : undefined}
          >
            {p.planNombre}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            {rows.length === 0
              ? 'No hay planes activos en este momento.'
              : 'Sin resultados para tu búsqueda.'}
          </p>
        ) : (
          filtered.map((r) => (
            <PlanRow key={r.userPlanId} row={r} onSelect={() => setSelectedUserId(r.userId)} />
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedUserId && (
          <UserDetail userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
