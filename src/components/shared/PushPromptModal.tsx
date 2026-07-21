import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { registerPush, PUSH_OPTOUT_KEY } from '@/lib/push';

interface Props {
  open: boolean;
  onClose: () => void;
}

const features = [
  'Asistencia registrada en tiempo real',
  'Alertas cuando tu clase se cancela',
  'Confirmación de pagos y plan activo',
];

export function PushPromptModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.removeItem(PUSH_OPTOUT_KEY);
        await registerPush().catch(() => {});
        toast.success('¡Notificaciones activadas!');
        onClose();
      } else {
        toast.error('Puedes activarlas cuando quieras desde tu perfil');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="push-backdrop"
          className="fixed inset-0 z-[300] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            key="push-card"
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-[#111] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-[#3DC4DB]" />

            <div className="p-8 flex flex-col items-center gap-6">
              {/* Logo */}
              <img
                src="/icons/logo.png"
                alt="Fitvang"
                className="h-16 w-auto object-contain"
              />

              {/* Headline */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Activa las notificaciones
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Recibe alertas de tus clases, pagos y logros al instante. Sin
                  ellas, te perderás lo que pasa en el club.
                </p>
              </div>

              {/* Feature rows */}
              <ul className="w-full space-y-3">
                {features.map((text) => (
                  <li key={text} className="flex items-center gap-3">
                    {/* Checkmark icon in blue circle */}
                    <span className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-[#3DC4DB]/20 border border-[#3DC4DB]/40">
                      <svg
                        className="h-4 w-4 text-[#3DC4DB]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.296a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.086l6.79-6.79a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-sm text-white/90">{text}</span>
                  </li>
                ))}
              </ul>

              {/* Primary button */}
              <button
                onClick={handleActivate}
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-[#3DC4DB] hover:bg-[#2fafc4] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#3DC4DB]/20"
              >
                {loading ? (
                  'Activando...'
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Activar notificaciones
                    <Bell className="size-4" />
                  </span>
                )}
              </button>

              {/* Ghost dismiss link */}
              <button
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-white transition-colors"
              >
                Ahora no
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
