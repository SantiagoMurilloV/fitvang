import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Zap, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Template {
  id: string;
  nombre: string;
  trainingSlug: string;
  trainingNombre: string;
  trainingColor: string;
  coachId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  capacidadMax: number;
  activo: boolean;
}

interface Session {
  id: string;
  fecha: string;
  estado: 'programada' | 'cancelada' | 'finalizada';
  nombre: string;
  trainingSlug: string;
  trainingColor: string;
  horaInicio: string;
  horaFin: string;
  ocupados: number;
  capacidadMax: number;
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ESTADO_STYLES: Record<Session['estado'], string> = {
  programada: 'bg-primary/15 text-primary border-primary/30',
  cancelada: 'bg-red-500/15 text-red-400 border-red-500/30',
  finalizada: 'bg-white/10 text-muted-foreground border-border',
};

/* ─── Cancel Modal ───────────────────────────────────────────────────── */
function CancelModal({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post<{ ok: boolean; notificados: number }>(`/classes/sessions/${session.id}/cancel`, { motivo: motivo || undefined }),
    onSuccess: (data) => {
      toast.success(`Clase cancelada. ${data.notificados} usuario${data.notificados !== 1 ? 's' : ''} notificado${data.notificados !== 1 ? 's' : ''}.`);
      qc.invalidateQueries({ queryKey: ['sessions'] });
      onClose();
    },
    onError: () => toast.error('No se pudo cancelar la clase.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm"
      >
        <Card className="border-red-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-red-400">Cancelar clase</p>
              <p className="text-xs text-muted-foreground mt-0.5">{session.nombre} · {session.horaInicio}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Motivo (opcional)</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Ej: El coach está indispuesto..."
            className="mt-1 w-full px-3 py-2 rounded-xl bg-background border border-border focus:border-primary focus:outline-none transition resize-none text-sm"
          />
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()} className="flex-1">
              Confirmar
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/* ─── Templates Tab ──────────────────────────────────────────────────── */
function TemplatesTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['class-templates'],
    queryFn: () => api.get<{ templates: Template[] }>('/classes/templates'),
  });

  const generate = useMutation({
    mutationFn: () => api.post<{ inserted: number }>('/classes/generate?days=30'),
    onSuccess: (data) => toast.success(`${data.inserted} sesiones generadas para los próximos 30 días.`),
    onError: () => toast.error('Error al generar sesiones.'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.templates.length ?? 0} plantillas registradas</p>
        <Button
          size="sm"
          loading={generate.isPending}
          onClick={() => generate.mutate()}
          className="gap-1.5"
        >
          <Zap className="size-3.5" />
          Generar 30 días
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : !data?.templates.length ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-4">No hay plantillas registradas.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.templates.map((t) => (
            <Card key={t.id} className={t.activo ? '' : 'opacity-50'}>
              <div className="flex items-center gap-3">
                <div
                  className="size-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.trainingColor || '#3DC4DB' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.nombre}</p>
                  <p className="text-xs text-muted-foreground">{t.trainingNombre}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium">{DIAS[t.diaSemana]}</p>
                  <p className="text-xs text-muted-foreground">{t.horaInicio}–{t.horaFin}</p>
                  <p className="text-xs text-muted-foreground">Cap. {t.capacidadMax}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${t.activo ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground border-border'}`}
                >
                  {t.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Sessions Tab ───────────────────────────────────────────────────── */
function SessionsTab() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const in7 = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(in7);
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', from, to],
    queryFn: () => api.get<{ sessions: Session[] }>(`/classes/sessions?from=${from}&to=${to}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : !data?.sessions.length ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-4">No hay sesiones en este rango.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start gap-3">
                <div
                  className="size-3 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: s.trainingColor || '#3DC4DB' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(s.fecha + 'T12:00:00'), "EEE d MMM", { locale: es })} · {s.horaInicio}–{s.horaFin}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ESTADO_STYLES[s.estado]}`}>
                      {s.estado}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {s.ocupados}/{s.capacidadMax} cupos
                    </span>
                  </div>
                </div>
                {s.estado === 'programada' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setCancelTarget(s)}
                    className="flex-shrink-0 text-xs"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {cancelTarget && (
          <CancelModal session={cancelTarget} onClose={() => setCancelTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
type Tab = 'plantillas' | 'sesiones';

export function ClassesAdmin() {
  const [tab, setTab] = useState<Tab>('plantillas');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Clases</h1>
        <p className="text-sm text-muted-foreground mt-1">Plantillas y sesiones programadas.</p>
      </div>

      <div className="flex gap-1 bg-card rounded-xl p-1">
        {(['plantillas', 'sesiones'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition capitalize ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'plantillas' ? <TemplatesTab /> : <SessionsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
