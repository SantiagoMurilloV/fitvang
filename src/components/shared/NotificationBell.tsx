import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ notifications: NotificationRow[]; unread: number }>('/notifications'),
    refetchInterval: 60_000,
  });

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative grid place-items-center size-10 rounded-full border border-border hover:border-primary transition"
        aria-label="Notificaciones"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm h-full bg-card border-l border-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card">
              <h2 className="font-bold text-lg">Notificaciones</h2>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={() => readAll.mutate()} className="text-xs text-primary hover:underline">
                    Marcar todas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1">
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {(data?.notifications ?? []).length === 0 && (
                <li className="p-6 text-center text-sm text-muted-foreground">Sin notificaciones aún.</li>
              )}
              {data?.notifications.map((n) => (
                <li key={n.id} className={!n.leida ? 'bg-primary/5' : ''}>
                  <a
                    href={n.deepLinkUrl ?? '#'}
                    className="block p-4 hover:bg-white/5 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{n.titulo}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {relativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{n.mensaje}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
