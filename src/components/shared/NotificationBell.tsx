import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/utils';

interface NotificationRow {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  deepLinkUrl?: string | null;
  createdAt: string;
}

const TIPO_ICON: Record<string, string> = {
  asistencia: '✅',
  pago_ok: '💪',
  pago_fail: '⚠️',
  pago_efectivo: '💵',
  plan_vence: '📅',
  plan_vencido: '🔄',
  reserva: '📋',
  reserva_cancelada: '❌',
  cupo_disponible: '🎉',
  clase_cancelada: '🚫',
  bienvenida: '🏋️',
  sistema: '🔔',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ notifications: NotificationRow[]; unread: number }>('/notifications'),
    refetchInterval: 30_000,
    staleTime: 0,
  });

  // Refresca la lista cada vez que se abre el drawer
  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const readAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const unread = data?.unread ?? 0;
  const notifs = data?.notifications ?? [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative grid place-items-center size-10 rounded-full border border-border hover:border-primary transition"
        aria-label="Notificaciones"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-primary text-[#0D0D0D] text-[10px] font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[300] flex justify-end" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm h-full flex flex-col bg-[#111] border-l border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fijo */}
            <div className="flex-none flex items-center justify-between p-4 border-b border-white/10" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
              <h2 className="font-bold text-lg text-white">Notificaciones</h2>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button
                    onClick={() => readAll.mutate()}
                    className="text-xs text-[#3DC4DB] hover:underline"
                  >
                    Marcar todas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-white/60 hover:text-white transition">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Lista scrollable */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-[#3DC4DB]" />
                </div>
              ) : notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Bell className="size-10 text-white/20 mb-3" />
                  <p className="text-sm font-medium text-white/50">Sin notificaciones aún</p>
                  <p className="text-xs text-white/30 mt-1">Cuando haya actividad te avisamos aquí.</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {notifs.map((n) => (
                    <li key={n.id} className={!n.leida ? 'bg-[#3DC4DB]/5' : ''}>
                      <a
                        href={n.deepLinkUrl ?? '#'}
                        className="flex items-start gap-3 p-4 hover:bg-white/5 transition"
                        onClick={() => setOpen(false)}
                      >
                        <span className="text-lg mt-0.5 flex-none">
                          {TIPO_ICON[n.tipo] ?? '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-tight ${!n.leida ? 'font-semibold text-white' : 'font-medium text-white/60'}`}>
                              {n.titulo}
                            </p>
                            <span className="text-[10px] text-white/40 whitespace-nowrap flex-none">
                              {relativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-white/50 line-clamp-2">{n.mensaje}</p>
                        </div>
                        {!n.leida && (
                          <span className="flex-none mt-1.5 size-2 rounded-full bg-[#3DC4DB]" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
