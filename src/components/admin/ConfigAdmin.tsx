import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

function DangerZone() {
  const [loading, setLoading] = useState(false);

  async function handleClear() {
    // Paso 1: preguntar si todo o un mes
    const { value: opcion } = await Swal.fire({
      title: 'Limpiar programación',
      text: '¿Qué deseas limpiar?',
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Todo lo futuro',
      denyButtonText: 'Un mes específico',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#ef4444',
      denyButtonColor: '#f59e0b',
      cancelButtonColor: '#2a2a2f',
      customClass: {
        popup: 'rounded-2xl border border-white/10',
        confirmButton: 'rounded-xl font-semibold',
        denyButton: 'rounded-xl font-semibold',
        cancelButton: 'rounded-xl font-semibold',
      },
      reverseButtons: true,
    });

    if (!opcion && opcion !== false) return; // cancelado

    let mes: string | undefined;

    if (opcion === false) {
      // Eligió "un mes específico" — mostrar selector de mes
      const meses = Array.from({ length: 6 }, (_, i) => {
        const d = addMonths(new Date(), i);
        return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: es }) };
      });

      const { value: mesSeleccionado } = await Swal.fire({
        title: 'Selecciona el mes',
        input: 'select',
        inputOptions: Object.fromEntries(meses.map((m) => [m.value, m.label])),
        inputPlaceholder: 'Selecciona un mes',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        background: '#0f0f11',
        color: '#f8f8f8',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#2a2a2f',
        customClass: {
          popup: 'rounded-2xl border border-white/10',
          confirmButton: 'rounded-xl font-semibold',
          cancelButton: 'rounded-xl font-semibold',
          input: 'rounded-xl bg-background border border-border text-foreground px-3 py-2 text-sm',
        },
      });

      if (!mesSeleccionado) return;
      mes = mesSeleccionado;
    }

    // Paso 2: confirmación final
    const label = mes
      ? `las sesiones de ${format(new Date(mes + '-15'), 'MMMM yyyy', { locale: es })}`
      : 'todas las sesiones futuras';

    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      html: `Se eliminarán permanentemente <strong>${label}</strong> con estado <em>programada</em>.<br><br>Las reservas activas <strong>no serán notificadas</strong>.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2f',
      customClass: {
        popup: 'rounded-2xl border border-red-500/30',
        confirmButton: 'rounded-xl font-semibold',
        cancelButton: 'rounded-xl font-semibold',
      },
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const url = mes ? `/classes/sessions/clear?mes=${mes}` : '/classes/sessions/clear';
      const { deleted } = await api.delete<{ deleted: number }>(url);
      toast.success(`${deleted} sesión${deleted !== 1 ? 'es' : ''} eliminada${deleted !== 1 ? 's' : ''}.`);
    } catch {
      toast.error('No se pudo limpiar la programación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-red-400 shrink-0" />
        <h3 className="font-semibold text-red-400">Zona de peligro</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Estas acciones son irreversibles. Úsalas con cuidado.
      </p>

      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div>
          <p className="text-sm font-semibold">Limpiar programación</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Elimina sesiones futuras con estado <em>programada</em>. Puedes elegir todo o un mes específico.
          </p>
        </div>
        <button
          onClick={handleClear}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 shrink-0"
        >
          <Trash2 size={14} />
          {loading ? 'Limpiando…' : 'Limpiar'}
        </button>
      </div>
    </div>
  );
}

export function ConfigAdmin() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Ajustes generales del club.</p>

      <DangerZone />
    </div>
  );
}
