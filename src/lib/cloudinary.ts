import { api } from '@/lib/api';

export async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const data = await api.postForm<{ url: string }>('/upload/avatar', fd);
  return data.url;
}
