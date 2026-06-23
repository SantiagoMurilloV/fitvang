const CLOUD = 'dsg6dulng';
const PRESET = 'fitvang_avatars';
const TRANSFORM = 'c_fill,g_face,w_200,h_200,f_webp,q_auto';

export async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    { method: 'POST', body: fd }
  );
  const data = await res.json() as any;
  if (!res.ok) {
    console.error('[cloudinary]', data);
    throw new Error(data?.error?.message ?? 'Upload failed');
  }
  return (data.secure_url as string).replace('/upload/', `/upload/${TRANSFORM}/`);
}
