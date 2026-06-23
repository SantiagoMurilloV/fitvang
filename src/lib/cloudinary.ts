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
    const msg = data?.error?.message ?? JSON.stringify(data);
    console.error('[cloudinary] upload error:', msg);
    throw new Error(msg);
  }
  return data.secure_url.replace('/upload/', '/upload/c_fill,g_face,w_200,h_200,f_webp,q_auto/');
}
