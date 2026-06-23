import { useQuery } from '@tanstack/react-query';
import { Users2, Activity, DollarSign, BookOpen, TrendingUp, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCop } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Overview {
  usuariosActivos: number;
  planesActivos: number;
  ingresosMesCop: number;
  clasesHoy: number;
}

interface Session {
  id: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  trainingColor: string;
  ocupados: number;
  capacidadMax: number;
}

interface KpiCardProps {
  icon: React.ElementType;
  iconColor: string;
  value: string | number;
  label: string;
  onClick?: () => void;
}

function KpiCard({ icon: Icon, iconColor, value, label, onClick }: KpiCardProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl bg-card border border-border p-5 space-y-3 text-left w-full transition-all ${onClick ? 'hover:border-primary/50 hover:bg-card/80 active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`size-10 rounded-xl flex items-center justify-center ${iconColor}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </button>
  );
}

function LiveClassCard({ session }: { session: Session }) {
  const pct = session.capacidadMax > 0 ? Math.round((session.ocupados / session.capacidadMax) * 100) : 0;
  return (
    <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4">
      <div
        className="w-1.5 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: session.trainingColor || '#3DC4DB' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-green-400 animate-pulse" />
          <p className="font-semibold text-sm truncate">{session.nombre}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{session.horaInicio} – {session.horaFin}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{session.ocupados}/{session.capacidadMax}</span>
        </div>
      </div>
    </div>
  );
}

function FinancialModal({ onClose }: { onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<Overview>('/stats/admin/overview'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Dashboard Financiero</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ingresos mes</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {data ? formatCop(data.ingresosMesCop) : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Planes activos</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{data?.planesActivos ?? '—'}</p>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-border p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tendencia</p>
          <div className="flex items-end gap-1 h-16">
            {[40, 65, 55, 80, 70, 90, 100].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: `rgba(61, 196, 219, ${0.3 + i * 0.1})` }} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>

        <a href="/admin/pagos" className="block w-full text-center py-3 rounded-xl bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition-colors">
          Ver todos los pagos
        </a>
      </div>
    </div>
  );
}

function StudentsProgressModal({ onClose }: { onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['admin-users-progress'],
    queryFn: () => api.get<{ users: Array<{ id: string; nombre: string; avatarUrl?: string | null }> }>('/users?rol=user'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 space-y-5 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold">Progreso de estudiantes</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">✕</button>
        </div>
        <div className="overflow-y-auto space-y-3 flex-1">
          {data?.users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No hay estudiantes registrados.</p>
          )}
          {data?.users.map((u) => {
            const initials = u.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('');
            return (
              <a key={u.id} href={`/admin/usuarios?perfil=${u.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="size-10 rounded-full bg-primary/20 grid place-items-center text-sm font-bold text-primary flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{u.nombre}</p>
                </div>
                <Trophy size={14} className="text-amber-400 flex-shrink-0" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showFinancial, setShowFinancial] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<Overview>('/stats/admin/overview'),
    refetchInterval: 60_000,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-today', today],
    queryFn: () => api.get<{ sessions: Session[] }>(`/classes/sessions?from=${today}&to=${today}`),
    refetchInterval: 30_000,
  });

  const liveSessions = sessionsData?.sessions.filter((s: any) => s.estado === 'programada') ?? [];

  return (
    <>
      <div className="space-y-6">
        <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</p>

        {/* KPI 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            icon={Users2}
            iconColor="bg-blue-500/10 text-blue-400"
            value={overview?.usuariosActivos ?? '—'}
            label="Usuarios activos"
          />
          <KpiCard
            icon={Activity}
            iconColor="bg-green-500/10 text-green-400"
            value={overview?.clasesHoy ?? '—'}
            label="Clases hoy"
          />
          <KpiCard
            icon={DollarSign}
            iconColor="bg-emerald-500/10 text-emerald-400"
            value={overview ? formatCop(overview.ingresosMesCop) : '—'}
            label="Ingresos del mes"
            onClick={() => setShowFinancial(true)}
          />
          <KpiCard
            icon={BookOpen}
            iconColor="bg-purple-500/10 text-purple-400"
            value={overview?.planesActivos ?? '—'}
            label="Planes activos"
          />
        </div>

        {/* Botón progreso estudiantes */}
        <button
          onClick={() => setShowProgress(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
        >
          <Trophy className="size-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-amber-300">Progreso de mis estudiantes</p>
            <p className="text-xs text-muted-foreground">Ver rachas, asistencias y premios</p>
          </div>
          <TrendingUp className="size-4 text-amber-400" />
        </button>

        {/* Clases en curso ahora */}
        {liveSessions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">En curso ahora</h2>
            <div className="space-y-2">
              {liveSessions.map((s) => <LiveClassCard key={s.id} session={s} />)}
            </div>
          </div>
        )}
      </div>

      {showFinancial && <FinancialModal onClose={() => setShowFinancial(false)} />}
      {showProgress && <StudentsProgressModal onClose={() => setShowProgress(false)} />}
    </>
  );
}

// Needed for useState
import { useState } from 'react';
