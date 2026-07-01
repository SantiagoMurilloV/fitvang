import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FileText, X, Download, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

/**
 * Visor del documento de T&C firmado por un usuario.
 * Trae el HTML desde el backend (copia de Cloudinary o regeneración) y lo
 * muestra dentro de un <iframe> sandbox — se ve igual en PC y móvil, sin
 * redirigir ni forzar descarga. "Descargar PDF" usa la impresión nativa del
 * navegador (Guardar como PDF), sin dependencias extra.
 */
export function TermsDocModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['terminos-doc', userId],
    queryFn: () => api.get<{ html: string; fuente: string }>(`/users/${userId}/terminos-doc`),
  });

  function handlePrint() {
    const win = frameRef.current?.contentWindow;
    if (!win) {
      toast.error('El documento aún se está cargando.');
      return;
    }
    win.focus();
    win.print();
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl bg-[#111] border border-border rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[94vh] sm:max-h-[88vh]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-3 border-b border-border shrink-0">
          <span className="size-10 rounded-xl bg-primary/15 border border-primary/30 grid place-items-center shrink-0">
            <FileText className="size-5 text-primary" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight">Documento firmado</h2>
            <p className="text-xs text-muted-foreground">Términos y Condiciones de Fitvang</p>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-full border border-border grid place-items-center hover:bg-white/5 active:scale-95 transition shrink-0"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Documento */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          {isLoading ? (
            <div className="h-full min-h-[50vh] grid place-items-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : isError || !data?.html ? (
            <div className="h-full min-h-[50vh] grid place-items-center text-center px-6">
              <p className="text-sm text-muted-foreground">No se pudo cargar el documento. Intenta de nuevo.</p>
            </div>
          ) : (
            <iframe
              ref={frameRef}
              srcDoc={data.html}
              sandbox="allow-same-origin allow-modals"
              title="Documento de Términos y Condiciones"
              className="w-full h-[60vh] sm:h-[65vh] rounded-xl bg-white"
            />
          )}
        </div>

        {/* Acciones */}
        <div className="p-5 pt-3 border-t border-border shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-border font-semibold text-sm hover:bg-white/5 active:scale-[0.98] transition"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            disabled={isLoading || isError || !data?.html}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="size-4" />
            Descargar PDF
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
