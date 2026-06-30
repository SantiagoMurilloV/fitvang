import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, parseISO } from 'date-fns';
import { Sprout, Medal, Flame, Zap, Crown, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';

const NIVELES = {
  rookie: { label: 'Rookie', min: 0, Icon: Sprout, color: '#4ade80' },
  regular: { label: 'Regular', min: 40, Icon: Medal, color: '#3DC4DB' },
  constante: { label: 'Constante', min: 60, Icon: Flame, color: '#facc15' },
  elite: { label: 'Elite', min: 80, Icon: Zap, color: '#f87171' },
  leyenda: { label: 'Leyenda', min: 95, Icon: Crown, color: '#fbbf24' },
};

// ─── Confetti ────────────────────────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      color: ['#3DC4DB', '#FFD700', '#FF6B6B', '#7CFC00', '#FF69B4'][Math.floor(Math.random() * 5)],
      r: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
    }));

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;
        p.vy += 0.05;
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    const t = setTimeout(() => cancelAnimationFrame(frame), 3500);
    return () => { cancelAnimationFrame(frame); clearTimeout(t); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─── Heatmap Grid ─────────────────────────────────────────────────────────────

function HeatmapGrid({ heatmap }: { heatmap: Record<string, number> }) {
  const WEEKS = 12;
  const today = new Date();

  // Build a 7×WEEKS grid of dates, oldest first
  const startDate = subDays(today, WEEKS * 7 - 1);
  const cells: { date: string; count: number }[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = subDays(today, WEEKS * 7 - 1 - i);
    const key = format(d, 'yyyy-MM-dd');
    cells.push({ date: key, count: heatmap[key] ?? 0 });
  }

  const maxCount = Math.max(1, ...Object.values(heatmap));

  const colorFor = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.06)';
    const intensity = count / maxCount;
    if (intensity < 0.33) return '#1a6b7a';
    if (intensity < 0.66) return '#2899af';
    return '#3DC4DB';
  };

  const weeks: typeof cells[] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Asistencias — últimas {WEEKS} semanas</p>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((l) => (
            <div key={l} className="size-[14px] flex items-center justify-center text-[8px] text-muted-foreground font-medium">
              {l}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell, di) => (
              <motion.div
                key={cell.date}
                title={`${cell.date}: ${cell.count} asistencia${cell.count !== 1 ? 's' : ''}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.004, duration: 0.2 }}
                className="size-[14px] rounded-sm"
                style={{ background: colorFor(cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[9px] text-muted-foreground">Menos</span>
        {[0, 0.33, 0.66, 1].map((v, i) => (
          <div key={i} className="size-[10px] rounded-sm" style={{ background: colorFor(v * maxCount) }} />
        ))}
        <span className="text-[9px] text-muted-foreground">Más</span>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function ScoringView() {
  const [celebrated, setCelebrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevRacha = useRef<number | null>(null);

  const { data } = useQuery({
    queryKey: ['scoring-me'],
    queryFn: () => api.get<{
      mes: string; totalSesiones: number; asistencias: number; porcentaje: number;
      rachaActual: number; rachaMaxima: number; nivel: keyof typeof NIVELES;
    }>('/stats/me/scoring'),
  });

  const heatmapQ = useQuery({
    queryKey: ['heatmap-me'],
    queryFn: () => api.get<{ heatmap: Record<string, number> }>('/stats/me/heatmap?days=84'),
  });

  // Celebración cuando la racha actual supera el récord anterior
  useEffect(() => {
    if (!data) return;
    if (prevRacha.current !== null && data.rachaActual > (prevRacha.current ?? 0) && data.rachaActual === data.rachaMaxima && !celebrated) {
      setShowConfetti(true);
      setCelebrated(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
    prevRacha.current = data.rachaActual;
  }, [data, celebrated]);

  const pct = data?.porcentaje ?? 0;
  const nivel = data?.nivel ?? 'rookie';
  const isRecord = (data?.rachaActual ?? 0) > 0 && data?.rachaActual === data?.rachaMaxima;

  return (
    <div className="space-y-5">
      {/* Ring card */}
      <Card className="text-center py-8 relative overflow-hidden">
        <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Asistencia este mes</p>
        <div className="relative w-40 h-40 mx-auto mt-4">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
            <motion.circle
              cx="50" cy="50" r="44" stroke="#3DC4DB" strokeWidth="8" strokeLinecap="round" fill="none"
              strokeDasharray={`${2 * Math.PI * 44}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - pct / 100) }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div>
              <p className="text-4xl font-bold">{pct}%</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                {(() => {
                  const NivelIcon = NIVELES[nivel].Icon;
                  return <NivelIcon className="size-3.5" style={{ color: NIVELES[nivel].color }} />;
                })()}
                {NIVELES[nivel].label}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {data?.asistencias ?? 0} asistencias / {data?.totalSesiones ?? 0} reservas
        </p>
      </Card>

      {/* Streak cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={`flex flex-col items-center text-center relative overflow-hidden ${isRecord ? 'border-amber-400/40' : ''}`}>
          {isRecord && (
            <div className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 bg-amber-400/10 text-amber-400 rounded-full border border-amber-400/30">
              récord
            </div>
          )}
          <motion.p
            key={data?.rachaActual}
            initial={{ scale: 1.4, color: '#3DC4DB' }}
            animate={{ scale: 1, color: '#FFFFFF' }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold flex items-center justify-center gap-1.5"
          >
            {data?.rachaActual ?? 0}
            {(data?.rachaActual ?? 0) > 3 && <Flame className="size-6 text-orange-400" />}
          </motion.p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Racha actual</p>
          <p className="text-[9px] text-muted-foreground">días seguidos</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Récord histórico</p>
          <p className="mt-2 text-3xl font-bold flex items-center justify-center gap-1.5">
            {data?.rachaMaxima ?? 0}
            <Trophy className="size-6 text-amber-400" />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">días seguidos</p>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="overflow-x-auto">
        {heatmapQ.isLoading
          ? <div className="h-24 flex items-center justify-center"><div className="text-xs text-muted-foreground">Cargando historial…</div></div>
          : <HeatmapGrid heatmap={heatmapQ.data?.heatmap ?? {}} />
        }
      </Card>

      {/* Niveles */}
      <Card>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Niveles</p>
        <ul className="space-y-2 text-sm">
          {(Object.entries(NIVELES) as Array<[keyof typeof NIVELES, (typeof NIVELES)[keyof typeof NIVELES]]>).map(
            ([key, n]) => {
              const Icon = n.Icon;
              return (
                <li
                  key={key}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${key === nivel ? 'bg-primary/10 border border-primary/40' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0" style={{ color: n.color }} />
                    {n.label}
                  </span>
                  <span className="text-muted-foreground text-xs">{n.min}%+</span>
                </li>
              );
            },
          )}
        </ul>
      </Card>
    </div>
  );
}
