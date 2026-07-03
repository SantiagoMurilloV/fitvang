import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'motion/react';
import { Search, Wallet, ChevronRight, PartyPopper } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatCop } from '@/lib/utils';
import { Card } from '@/components/shared/Card';
import { UserDetail } from './UserDetail';

interface Deudor {
  userId: string;
  nombre: string;
  email: string;
  documento: string;
  avatarUrl?: string | null;
  esMenor: boolean;
  saldoPendienteCop: number;
  pendientes: number;
  desde: string; // fecha del pendiente más antiguo
}

function diasMora(desde: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 86_400_000));
}

function DeudorRow({ d, onSelect }: { d: Deudor; onSelect: () => void }) {
  const initials = d.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');
  const dias = diasMora(d.desde);
  return (
    <Card>
      <button onClick={onSelect} className="flex items-center gap-3 w-full text-left">
        <div className="size-10 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0 overflow-hidden">
          {d.avatarUrl
            ? <img src={d.avatarUrl} alt={d.nombre} className="size-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {d.nombre}
            {d.esMenor && <span className="text-[10px] text-muted-foreground ml-1.5">Menor</span>}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {d.pendientes} pago{d.pendientes !== 1 ? 's' : ''} pendiente{d.pendientes !== 1 ? 's' : ''}
            {dias > 0 && ` · hace ${dias} día${dias !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-sm font-bold', dias >= 15 ? 'text-red-400' : 'text-amber-400')}>
            {formatCop(d.saldoPendienteCop)}
          </p>
        </div>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </button>
    </Card>
  );
}

export function DeudoresAdmin() {
  const [q, setQ] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deudores'],
    queryFn: () => api.get<{ deudores: Deudor[] }>('/payments/deudores'),
  });
  const deudores = data?.deudores ?? [];
  const totalDeuda = deudores.reduce((sum, d) => sum + d.saldoPendienteCop, 0);

  const filtered = q.trim()
    ? deudores.filter((d) => {
        const needle = q.toLowerCase();
        return (
          d.nombre.toLowerCase().includes(needle) ||
          d.email.toLowerCase().includes(needle) ||
          d.documento.toLowerCase().includes(needle)
        );
      })
    : deudores;

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
        <div className="size-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
          <Wallet className="size-4.5" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">{formatCop(totalDeuda)}</p>
          <p className="text-[11px] text-muted-foreground">
            {deudores.length} deudor{deudores.length !== 1 ? 'es' : ''} con saldo pendiente
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o documento"
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none"
        />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          deudores.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-3 py-12">
              <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 grid place-items-center">
                <PartyPopper className="size-6 text-emerald-400" />
              </div>
              <p className="text-sm text-muted-foreground">Nadie debe nada: todos están al día.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Sin resultados para tu búsqueda.</p>
          )
        ) : (
          filtered.map((d) => (
            <DeudorRow key={d.userId} d={d} onSelect={() => setSelectedUserId(d.userId)} />
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
