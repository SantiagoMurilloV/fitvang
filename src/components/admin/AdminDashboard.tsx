import { useQuery } from '@tanstack/react-query';
import { Users as UsersIcon, Calendar, DollarSign, BadgeCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, StatCard } from '@/components/shared/Card';
import { formatCop } from '@/lib/utils';

interface Overview {
  usuariosActivos: number;
  planesActivos: number;
  ingresosMesCop: number;
  clasesHoy: number;
}

export function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-overview'], queryFn: () => api.get<Overview>('/stats/admin/overview') });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel Admin</h1>
        <p className="text-sm text-muted-foreground">Fitvang · Cl. 13b #37-86, El Dorado</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Usuarios activos" value={data?.usuariosActivos ?? '—'} accent />
        <StatCard label="Planes activos" value={data?.planesActivos ?? '—'} />
        <StatCard label="Ingresos del mes" value={data ? formatCop(data.ingresosMesCop) : '—'} />
        <StatCard label="Clases hoy" value={data?.clasesHoy ?? '—'} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a href="/admin/usuarios" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <UsersIcon className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Usuarios</p>
            <p className="text-xs text-muted-foreground">Crear, asignar planes</p>
          </Card>
        </a>
        <a href="/admin/clases" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <Calendar className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Clases</p>
            <p className="text-xs text-muted-foreground">Templates y sesiones</p>
          </Card>
        </a>
        <a href="/admin/pagos" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <DollarSign className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Pagos</p>
            <p className="text-xs text-muted-foreground">Historial global</p>
          </Card>
        </a>
        <a href="/admin/planes" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <BadgeCheck className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Planes</p>
            <p className="text-xs text-muted-foreground">Precios y grupos</p>
          </Card>
        </a>
      </div>
    </div>
  );
}
