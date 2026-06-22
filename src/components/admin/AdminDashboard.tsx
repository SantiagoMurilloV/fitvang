import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users2, Activity, DollarSign, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCop } from '@/lib/utils';

interface Overview {
  usuariosActivos: number;
  planesActivos: number;
  ingresosMesCop: number;
  clasesHoy: number;
}

interface KpiCardProps {
  icon: React.ElementType;
  iconColor: string;
  value: string | number;
  label: string;
}

function KpiCard({ icon: Icon, iconColor, value, label }: KpiCardProps) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
      <div className={`size-10 rounded-xl flex items-center justify-center ${iconColor}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [generating, setGenerating] = useState(false);
  const { data } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<Overview>('/stats/admin/overview'),
  });

  async function generateSessions() {
    setGenerating(true);
    try {
      await api.post('/classes/generate?days=30');
      toast.success('Sesiones generadas para los próximos 30 días ✅');
    } catch {
      toast.error('No se pudieron generar las sesiones');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fitvang</h1>

      </div>

      {/* KPI 2×2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={Users2}
          iconColor="bg-blue-500/10 text-blue-400"
          value={data?.usuariosActivos ?? '—'}
          label="Usuarios activos"
        />
        <KpiCard
          icon={Activity}
          iconColor="bg-green-500/10 text-green-400"
          value={data?.clasesHoy ?? '—'}
          label="Clases hoy"
        />
        <KpiCard
          icon={DollarSign}
          iconColor="bg-emerald-500/10 text-emerald-400"
          value={data ? formatCop(data.ingresosMesCop) : '—'}
          label="Ingresos del mes"
        />
        <KpiCard
          icon={BookOpen}
          iconColor="bg-purple-500/10 text-purple-400"
          value={data?.planesActivos ?? '—'}
          label="Planes activos"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Acciones rápidas
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateSessions}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {generating ? (
              <span className="inline-block size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <BookOpen className="size-4" />
            )}
            Generar sesiones
          </button>
          <a
            href="/admin/pagos"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium hover:border-primary hover:text-primary transition-colors"
          >
            <DollarSign className="size-4" />
            Ver todos los pagos
          </a>
        </div>
      </div>
    </div>
  );
}
