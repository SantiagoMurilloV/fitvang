import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface Seccion { titulo: string; texto: string }

export function TermsModal({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['terminos'],
    queryFn: () => api.get<{ version: string; secciones: Seccion[] }>('/users/terminos'),
  });

  async function accept() {
    if (!checked || saving) return;
    setSaving(true);
    try {
      await api.post('/users/me/aceptar-terminos');
      toast.success('¡Listo! Gracias por aceptar.');
      onAccepted();
    } catch {
      toast.error('No se pudo registrar la aceptación. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-lg bg-[#111] border border-border rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-3 border-b border-border shrink-0">
          <span className="size-10 rounded-xl bg-primary/15 border border-primary/30 grid place-items-center shrink-0">
            <FileText className="size-5 text-primary" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight">Términos y Condiciones</h2>
            <p className="text-xs text-muted-foreground">Para continuar, léelos y acéptalos.</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {!data ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            data.secciones.map((s) => (
              <div key={s.titulo}>
                <p className="text-sm font-semibold">{s.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.texto}</p>
              </div>
            ))
          )}
        </div>

        {/* Acción */}
        <div className="p-5 pt-3 border-t border-border shrink-0 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="size-5 accent-primary mt-0.5 shrink-0"
            />
            <span className="text-sm text-foreground/90">He leído y acepto los Términos y Condiciones de Fitvang.</span>
          </label>
          <button
            onClick={accept}
            disabled={!checked || saving}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 hover:bg-primary/90 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            {saving && <span className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
            Aceptar y continuar
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
