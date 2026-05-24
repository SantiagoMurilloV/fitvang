import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Calendar, Flame, TrendingUp, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, StatCard } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { formatCop } from '@/lib/utils';

interface MyPlan {
  plan: null | {
    id: string;
    planNombre: string;
    modalidad: string;
    trainingNombre: string;
    fechaInicio: string;
    fechaFin: string;
    sesionesTotales: number | null;
    sesionesUsadas: number;
    precioCopAplicado: number;
    accesoMulti: boolean;
  };
}

interface Scoring {
  mes: string;
  totalSesiones: number;
  asistencias: number;
  porcentaje: number;
  rachaActual: number;
  rachaMaxima: number;
  nivel: 'rookie' | 'regular' | 'constante' | 'elite' | 'leyenda';
}

const NIVEL_LABEL = { rookie: '🌱 Rookie', regular: '🔵 Regular', constante: '🟡 Constante', elite: '🔴 Elite', leyenda: '🏆 Leyenda' };

export function UserDashboard() {
  const plan = useQuery({ queryKey: ['plan-me'], queryFn: () => api.get<MyPlan>('/plans/me') });
  const scoring = useQuery({ queryKey: ['scoring-me'], queryFn: () => api.get<Scoring>('/stats/me/scoring') });

  const p = plan.data?.plan;
  const diasRestantes = p ? Math.max(0, Math.ceil((new Date(p.fechaFin).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hola 👋</h1>
        <p className="text-muted-foreground text-sm">Bienvenido a tu espacio Fitvang.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/30">
          <p className="text-xs uppercase tracking-wider text-primary">Mi plan</p>
          {plan.isLoading ? (
            <div className="h-24 animate-pulse bg-white/5 rounded-lg mt-2" />
          ) : !p ? (
            <div className="mt-2">
              <p className="font-semibold">Sin plan activo</p>
              <p className="text-sm text-muted-foreground">Habla con el admin para activar tu membresía.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mt-1">{p.planNombre}</h2>
              <p className="text-sm text-muted-foreground">{p.trainingNombre} · {p.modalidad}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hasta</span>
                <span className="font-semibold">{new Date(p.fechaFin).toLocaleDateString('es-CO')}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${Math.min(100, (diasRestantes / 30) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{diasRestantes} días restantes</p>
              {diasRestantes <= 5 && (
                <Button className="mt-4 w-full" onClick={() => (window.location.href = '/app/pagos')}>
                  Renovar plan ({formatCop(p.precioCopAplicado)})
                </Button>
              )}
            </>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Racha actual" value={`${scoring.data?.rachaActual ?? 0}🔥`} hint={`Máx ${scoring.data?.rachaMaxima ?? 0}`} accent />
        <StatCard label="Asistencia mes" value={`${scoring.data?.porcentaje ?? 0}%`} hint={NIVEL_LABEL[scoring.data?.nivel ?? 'rookie']} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a href="/app/horarios" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <Calendar className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Reservar clase</p>
            <p className="text-xs text-muted-foreground">Ver horarios de la semana</p>
          </Card>
        </a>
        <a href="/app/asistencias" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <TrendingUp className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Mi scoring</p>
            <p className="text-xs text-muted-foreground">Racha y progreso</p>
          </Card>
        </a>
        <a href="/app/pagos" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <Wallet className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Mis pagos</p>
            <p className="text-xs text-muted-foreground">Historial y renovación</p>
          </Card>
        </a>
        <a href="/app/recorrido" className="contents">
          <Card className="hover:border-primary transition cursor-pointer">
            <Flame className="size-6 text-primary" />
            <p className="mt-3 font-semibold">Mi recorrido</p>
            <p className="text-xs text-muted-foreground">Tu historia en el club</p>
          </Card>
        </a>
      </div>
    </div>
  );
}
