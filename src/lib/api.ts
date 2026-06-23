/**
 * Cliente fetch tipado para la API Fitvang.
 * En prod apunta a Railway (PUBLIC_API_URL). En dev apunta a localhost:3000.
 * Las cookies HttpOnly viajan automáticamente con credentials: 'include'.
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

function apiBase(): string {
  if (typeof window !== 'undefined') {
    // Browser: usa la variable inyectada en build time
    return (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000') + '/api';
  }
  // SSR: igual
  return (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000') + '/api';
}

async function requestForm<T>(path: string, form: FormData, _retry = false): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    if (res.status === 401 && !_retry) {
      const r = await fetch(`${apiBase()}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (r.ok) return requestForm<T>(path, form, true);
    }
    throw new ApiError(res.status, data?.error ?? res.statusText, data);
  }
  return data as T;
}

async function request<T>(method: string, path: string, body?: Json, _retry = false): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
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
    if (res.status === 401 && !_retry && path !== '/auth/refresh' && path !== '/auth/login') {
      const r = await fetch(`${apiBase()}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (r.ok) return request<T>(method, path, body, true);
    }
    throw new ApiError(res.status, data?.error ?? res.statusText, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Json) => request<T>('POST', path, body),
  postForm: <T>(path: string, form: FormData) => requestForm<T>(path, form),
  patch: <T>(path: string, body?: Json) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: Json) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
