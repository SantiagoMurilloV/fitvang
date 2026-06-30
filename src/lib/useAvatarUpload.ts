import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { uploadAvatar } from '@/lib/cloudinary';
import { swalConfirm } from '@/lib/swal';

/**
 * Lógica de subir/quitar avatar, antes duplicada casi idéntica en ProfileView,
 * UserDetail y CoachDashboard. El caller pasa la ruta PATCH y un callback onDone
 * (refetch / invalidar queries / actualizar estado local).
 */
export function useAvatarUpload(opts: { patchPath: string; onDone?: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      await api.patch(opts.patchPath, { avatarUrl: url });
      opts.onDone?.(url);
      toast.success('Foto actualizada');
    } catch (err: any) {
      toast.error(err?.message ?? 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    const ok = await swalConfirm({
      title: 'Eliminar foto',
      text: '¿Quitar la foto de perfil?',
      confirmButtonText: 'Sí, quitar',
      confirmButtonColor: '#ef4444',
    });
    if (!ok) return;
    try {
      await api.patch(opts.patchPath, { avatarUrl: '' });
      opts.onDone?.('');
      toast.success('Foto eliminada');
    } catch {
      toast.error('No se pudo eliminar la foto.');
    }
  }

  return { uploading, upload, remove };
}
