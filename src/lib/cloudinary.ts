const CLOUD = 'dsg6dulng';
const PRESET = 'fitvang_avatars';

export async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) {
    let msg = data?.error?.message ?? JSON.stringify(data);
    if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('unknown')) {
      msg = 'El preset de Cloudinary debe ser "Unsigned". Ve a Settings → Upload Presets → fitvang_avatars y cambia el modo.';
    }
    console.error('[cloudinary] upload error:', data?.error?.message ?? data);
    throw new Error(msg);
  }
  return data.secure_url.replace('/upload/', '/upload/c_fill,g_face,w_200,h_200,f_webp,q_auto/');
}
