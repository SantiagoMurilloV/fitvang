import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { addDays, format, startOfWeek } from 'date-fns';
import { api, ApiError } from '@/lib/api';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { cn } from '@/lib/utils';

interface SessionRow {
  id: string;
  fecha: string;
  nombre: string;
  trainingSlug: string;
  trainingColor: string;
  horaInicio: string;
  horaFin: string;
  capacidadMax: number;
  ocupados: number;
  estado: string;
}

export function SchedulePicker() {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  const from = format(monday, 'yyyy-MM-dd');
  const to = format(addDays(monday, 6), 'yyyy-MM-dd');

  const sessions = useQuery({
    queryKey: ['sessions', from, to],
    queryFn: () => api.get<{ sessions: SessionRow[] }>(`/classes/sessions?from=${from}&to=${to}`),
  });

  const myBookings = useQuery({
    queryKey: ['bookings-me'],
    queryFn: () => api.get<{ bookings: Array<{ sessionId: string; estado: string }> }>('/bookings/me'),
  });
  const reservedSet = new Set(
    (myBookings.data?.bookings ?? [])
      .filter((b) => b.estado === 'activa' || b.estado === 'asistio')
      .map((b) => b.sessionId),
  );

  const reserve = useMutation({
    mutationFn: (sessionId: string) => api.post('/bookings', { sessionId }),
    onSuccess: (_, sessionId) => {
      toast.success('Reservado ✨');
      qc.invalidateQueries({ queryKey: ['bookings-me'] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      void sessionId;
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const map: Record<string, string> = {
          sin_plan_activo: 'No tienes plan activo.',
          plan_no_cubre_training: 'Tu plan no cubre este tipo de clase.',
          kids_solo_por_admin: 'Las clases Kids se inscriben con el admin.',
          ya_reservada: 'Ya tienes esta clase reservada.',
          sesion_no_disponible: 'Esta sesión ya no está disponible.',
        };
        toast.error(map[err.data?.error] ?? 'No se pudo reservar.');
      }
    },
  });

  const groups: Record<string, SessionRow[]> = {};
  for (const s of sessions.data?.sessions ?? []) {
    (groups[s.fecha] ??= []).push(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reservar clase</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            →
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Semana de {format(monday, 'd MMM')} a {format(addDays(monday, 6), 'd MMM')}
      </p>

      <div className="space-y-6">
        {Object.entries(groups).length === 0 && !sessions.isLoading && (
          <p className="text-center text-muted-foreground py-12">Sin clases en esta semana.</p>
        )}
        {Object.entries(groups).map(([fecha, list]) => (
          <div key={fecha}>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {new Date(fecha + 'T12:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
            </h2>
            <div className="grid gap-2">
              {list.map((s) => {
                const reserved = reservedSet.has(s.id);
                const full = s.ocupados >= s.capacidadMax;
                return (
                  <motion.div key={s.id} whileHover={{ scale: 1.005 }}>
                    <Card className="flex items-center gap-3 p-4">
                      <div
                        className="size-1.5 self-stretch rounded-full"
                        style={{ background: s.trainingColor }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{s.nombre.split('·')[0].trim()}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.horaInicio.slice(0, 5)} – {s.horaFin.slice(0, 5)} ·{' '}
                          <span className={cn(full && 'text-destructive', !full && 'text-primary')}>
                            {s.ocupados}/{s.capacidadMax}
                          </span>
                        </p>
                      </div>
                      {reserved ? (
                        <span className="text-xs text-primary font-semibold">✓ Reservada</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={full ? 'outline' : 'primary'}
                          loading={reserve.isPending && reserve.variables === s.id}
                          onClick={() => reserve.mutate(s.id)}
                        >
                          {full ? 'Lista espera' : 'Reservar'}
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
