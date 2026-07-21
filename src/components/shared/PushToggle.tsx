import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';
import {
  registerPush,
  unsubscribePush,
  getPushEnabled,
  isPushSupported,
  PUSH_OPTOUT_KEY,
} from '@/lib/push';

// Toggle de notificaciones push para el perfil: el usuario puede activarlas o
// desactivarlas cuando quiera, sin depender del modal de bienvenida.
export function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false);
      return;
    }
    getPushEnabled().then(setEnabled).catch(() => {});
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribePush();
        localStorage.setItem(PUSH_OPTOUT_KEY, '1');
        setEnabled(false);
        toast.success('Notificaciones desactivadas');
      } else {
        localStorage.removeItem(PUSH_OPTOUT_KEY);
        const ok = await registerPush();
        if (ok) {
          setEnabled(true);
          toast.success('¡Notificaciones activadas!');
        } else if (Notification.permission === 'denied') {
          toast.error(
            'El navegador tiene bloqueadas las notificaciones para este sitio. Actívalas en la configuración del navegador.'
          );
        } else {
          toast.error('No se pudieron activar las notificaciones.');
        }
      }
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3">
      {enabled ? (
        <Bell className="size-4 text-primary shrink-0" />
      ) : (
        <BellOff className="size-4 text-muted-foreground shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Notificaciones push</p>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? 'Recibirás alertas de clases y pagos en este dispositivo'
            : 'No recibirás alertas en este dispositivo'}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={busy}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
          enabled ? 'bg-primary' : 'bg-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
