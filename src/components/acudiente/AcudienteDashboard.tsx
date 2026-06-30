import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Card } from '@/components/shared/Card';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';

interface Minor {
  menorId: string;
  nombre: string;
  avatarUrl: string | null;
  relacion: string;
}

interface Booking {
  sessionId: string;
  estado: string;
  fecha?: string;
  nombre?: string;
  horaInicio?: string;
  horaFin?: string;
  trainingColor?: string;
  asistio?: boolean | null;
}

const RELACION_LABEL: Record<string, string> = {
  padre: 'Padre',
  madre: 'Madre',
  tutor: 'Tutor/a',
  otro: 'Acudiente',
};

function todaySpanish(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function MinorCard({ minor }: { minor: Minor }) {
  const bookings = useQuery({
    queryKey: ['bookings-menor', minor.menorId],
    queryFn: () => api.get<{ bookings: Booking[] }>(`/bookings/user/${minor.menorId}`),
  });

  const upcoming = (bookings.data?.bookings ?? [])
    .filter((b) => b.estado === 'activa')
    .slice(0, 2);

  const initials = minor.nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="border-border space-y-4">
      {/* Header del menor */}
      <div className="flex items-center gap-3">
        {minor.avatarUrl ? (
          <img
            src={minor.avatarUrl}
            alt={minor.nombre}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base">
            {initials}
          </div>
        )}
        <div>
          <p className="font-bold text-base">{minor.nombre}</p>
          <p className="text-xs text-muted-foreground">{RELACION_LABEL[minor.relacion] ?? 'Menor'}</p>
        </div>
      </div>

      {/* Próximas clases del menor */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
          Próximas clases
        </p>
        {bookings.isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl bg-white/5 border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Sin clases reservadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div
                key={b.sessionId}
                className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-border p-3"
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: b.trainingColor ?? '#3DC4DB' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.nombre ?? 'Clase'}</p>
                  {b.fecha && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.fecha + 'T12:00').toLocaleDateString('es-CO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      {b.horaInicio ? ` · ${b.horaInicio.slice(0, 5)}` : ''}
                    </p>
                  )}
                </div>
                {b.asistio === true ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : b.asistio === false ? (
                  <XCircle size={16} className="text-red-400 shrink-0" />
                ) : (
                  <Clock size={16} className="text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function AcudienteDashboard() {
  const user = useAuth((s) => s.user);
  const firstName = user?.nombre?.split(' ')[0] ?? 'Acudiente';

  const menores = useQuery({
    queryKey: ['menores-me'],
    queryFn: () => api.get<{ menores: Minor[] }>(`/users/${user?.id}/menores`),
    enabled: !!user?.id,
  });

  const lista = menores.data?.menores ?? [];

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div>
        <h1 className="text-3xl font-bold">Hola, {firstName}</h1>
        <p className="text-sm text-muted-foreground capitalize">{todaySpanish()}</p>
      </div>

      {/* Menores a cargo */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-pink-400" />
          <h2 className="text-base font-semibold">Menores a tu cargo</h2>
        </div>

        {menores.isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-16 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : lista.length === 0 ? (
          <Card className="border-border text-center py-8">
            <p className="text-muted-foreground text-sm">
              No tienes menores vinculados.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Habla con el admin del club para vincular a tu menor.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {lista.map((m) => (
              <motion.div
                key={m.menorId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <MinorCard minor={m} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
