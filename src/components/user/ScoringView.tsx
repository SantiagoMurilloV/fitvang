import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { Card, StatCard } from '@/components/shared/Card';

const NIVELES = {
  rookie: { label: '🌱 Rookie', min: 0 },
  regular: { label: '🔵 Regular', min: 40 },
  constante: { label: '🟡 Constante', min: 60 },
  elite: { label: '🔴 Elite', min: 80 },
  leyenda: { label: '🏆 Leyenda', min: 95 },
};

export function ScoringView() {
  const { data } = useQuery({
    queryKey: ['scoring-me'],
    queryFn: () => api.get<{
      mes: string; totalSesiones: number; asistencias: number; porcentaje: number;
      rachaActual: number; rachaMaxima: number; nivel: keyof typeof NIVELES;
    }>('/stats/me/scoring'),
  });

  const pct = data?.porcentaje ?? 0;
  const nivel = data?.nivel ?? 'rookie';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Mi scoring</h1>

      <Card className="text-center py-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Asistencia este mes</p>
        <div className="relative w-40 h-40 mx-auto mt-4">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              stroke="#3DC4DB"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 44}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - pct / 100) }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div>
              <p className="text-4xl font-bold">{pct}%</p>
              <p className="text-xs text-muted-foreground">{NIVELES[nivel].label}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {data?.asistencias ?? 0} asistencias / {data?.totalSesiones ?? 0} reservas
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Racha actual" value={`${data?.rachaActual ?? 0}🔥`} hint="días seguidos" accent />
        <StatCard label="Récord histórico" value={`${data?.rachaMaxima ?? 0}🏆`} hint="días seguidos" />
      </div>

      <Card>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Niveles</p>
        <ul className="space-y-2 text-sm">
          {(Object.entries(NIVELES) as Array<[keyof typeof NIVELES, { label: string; min: number }]>).map(
            ([key, n]) => (
              <li
                key={key}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${key === nivel ? 'bg-primary/10 border border-primary/40' : ''}`}
              >
                <span>{n.label}</span>
                <span className="text-muted-foreground text-xs">{n.min}%+</span>
              </li>
            ),
          )}
        </ul>
      </Card>
    </div>
  );
}
