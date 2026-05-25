/**
 * Cliente fetch tipado para la API Fitvang.
 * Las cookies HttpOnly viajan automáticamente; no se pasa Bearer.
 */
export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(method: string, path: string, body?: Json, _retry = false): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    // Intentar refresh transparente una sola vez (flag _retry evita bucle infinito)
    if (res.status === 401 && !_retry && path !== '/auth/refresh' && path !== '/auth/login') {
      const r = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (r.ok) return request<T>(method, path, body, true);
    }
    throw new ApiError(res.status, data?.error ?? res.statusText, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Json) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: Json) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: Json) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
