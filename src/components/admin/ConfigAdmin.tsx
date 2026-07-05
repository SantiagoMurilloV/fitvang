import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, Landmark, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import Swal from 'sweetalert2';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface Cuenta {
  banco: string;
  numero: string;
  titular?: string;
}

// Cuentas a las que los usuarios transfieren para pagar saldos pendientes.
// Se muestran en la vista de pagos del usuario y en el form de reportar pago.
function CuentasPago() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['cuentas-pago'],
    queryFn: () => api.get<{ cuentas: Cuenta[] }>('/config/cuentas-pago'),
  });
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<Cuenta>({ banco: '', numero: '', titular: '' });

  useEffect(() => {
    if (data && !dirty) setCuentas(data.cuentas);
  }, [data, dirty]);

  const guardar = useMutation({
    mutationFn: (nuevas: Cuenta[]) =>
      api.patch('/config/cuentas-pago', {
        cuentas: nuevas.map((cta) => ({ ...cta, titular: cta.titular?.trim() || undefined })),
      }),
    onSuccess: () => {
      toast.success('Cuentas guardadas');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['cuentas-pago'] });
    },
    onError: () => toast.error('No se pudieron guardar las cuentas.'),
  });

  function agregar() {
    if (!draft.banco.trim() || !draft.numero.trim()) {
      toast.error('Banco y número son obligatorios');
      return;
    }
    setCuentas((prev) => [...prev, { ...draft, banco: draft.banco.trim(), numero: draft.numero.trim() }]);
    setDraft({ banco: '', numero: '', titular: '' });
    setDirty(true);
  }

  function quitar(i: number) {
    setCuentas((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  }

  const inputClass = 'h-10 rounded-xl bg-background border border-border px-3 text-sm outline-none focus:border-primary transition-colors';

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Landmark className="size-4 text-primary shrink-0" />
        <h3 className="font-semibold">Cuentas para pagos</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Los usuarios ven estas cuentas en su sección de pagos para transferir y reportar sus saldos pendientes.
      </p>

      {isLoading ? (
        <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
      ) : cuentas.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Aún no hay cuentas configuradas.</p>
      ) : (
        <div className="space-y-2">
          {cuentas.map((cta, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{cta.banco}</p>
                <p className="text-xs text-muted-foreground">
                  {cta.numero}
                  {cta.titular ? ` · ${cta.titular}` : ''}
                </p>
              </div>
              <button
                onClick={() => quitar(i)}
                className="size-8 shrink-0 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-red-400/50 hover:text-red-400 transition-colors"
                title="Quitar cuenta"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
        <input
          className={inputClass}
          placeholder="Banco (Nequi, Bancolombia…)"
          value={draft.banco}
          onChange={(e) => setDraft((d) => ({ ...d, banco: e.target.value }))}
        />
        <input
          className={inputClass}
          placeholder="Número / celular"
          value={draft.numero}
          onChange={(e) => setDraft((d) => ({ ...d, numero: e.target.value }))}
        />
        <input
          className={inputClass}
          placeholder="Titular (opcional)"
          value={draft.titular}
          onChange={(e) => setDraft((d) => ({ ...d, titular: e.target.value }))}
        />
        <button
          onClick={agregar}
          className="h-10 px-4 rounded-xl border border-primary/30 bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center gap-1 hover:bg-primary/20 transition-colors"
        >
          <Plus className="size-4" /> Agregar
        </button>
      </div>

      {dirty && (
        <button
          onClick={() => guardar.mutate(cuentas)}
          disabled={guardar.isPending}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {guardar.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      )}
    </div>
  );
}

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

      <CuentasPago />

      <DangerZone />
    </div>
  );
}
