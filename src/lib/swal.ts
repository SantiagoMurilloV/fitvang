import Swal from 'sweetalert2';

/**
 * Diálogo de confirmación con el tema oscuro de Fitvang (antes repetido ~11 veces
 * con la misma config de Swal.fire). Devuelve true si el usuario confirma.
 */
export async function swalConfirm(opts: {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  icon?: 'warning' | 'question' | 'info' | 'error' | 'success';
}): Promise<boolean> {
  const result = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: opts.icon ?? 'warning',
    showCancelButton: true,
    confirmButtonText: opts.confirmButtonText ?? 'Confirmar',
    cancelButtonText: opts.cancelButtonText ?? 'Cancelar',
    background: '#0f0f11',
    color: '#f8f8f8',
    confirmButtonColor: opts.confirmButtonColor ?? '#3DC4DB',
    cancelButtonColor: '#2a2a2f',
    customClass: {
      popup: 'rounded-2xl border border-white/10',
      confirmButton: 'rounded-xl font-semibold',
      cancelButton: 'rounded-xl font-semibold',
    },
    reverseButtons: true,
  });
  return result.isConfirmed;
}
