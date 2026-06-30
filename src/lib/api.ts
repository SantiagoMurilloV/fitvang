/**
 * Cliente fetch tipado para la API Fitvang.
 * En prod apunta a Railway (PUBLIC_API_URL). En dev apunta a localhost:3000.
 * Las cookies HttpOnly viajan automáticamente con credentials: 'include'.
 *
 * Resiliencia:
 *  - Timeout vía AbortSignal en todas las llamadas (evita "cargando" infinito).
 *  - Retry con backoff para errores transitorios (red / 5xx) SOLO en GET,
 *    para no reintentar mutaciones (ej. pagos) y causar duplicados.
 *  - Auto-refresh transparente en 401.
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

const DEFAULT_TIMEOUT_MS = 10_000;
const FORM_TIMEOUT_MS = 20_000; // uploads (Cloudinary) pueden tardar más
const MAX_RETRIES = 2;

function apiBase(): string {
  // Mismo origen lógico en browser y SSR
  return (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000') + '/api';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseBody(text: string): any {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function refreshOnce(): Promise<boolean> {
  try {
    const r = await fetchWithTimeout(`${apiBase()}/auth/refresh`, { method: 'POST', credentials: 'include' });
    return r.ok;
  } catch {
    return false;
  }
}

async function requestForm<T>(path: string, form: FormData, _retry = false): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${apiBase()}${path}`, { method: 'POST', credentials: 'include', body: form }, FORM_TIMEOUT_MS);
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.', null);
  }
  const data = parseBody(await res.text());
  if (!res.ok) {
    if (res.status === 401 && !_retry) {
      if (await refreshOnce()) return requestForm<T>(path, form, true);
    }
    throw new ApiError(res.status, data?.error ?? res.statusText, data);
  }
  return data as T;
}

async function request<T>(method: string, path: string, body?: Json, _retry = false): Promise<T> {
  const url = `${apiBase()}${path}`;
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  const canRetry = method === 'GET'; // solo reintentar peticiones idempotentes

  let res: Response;
  let attempt = 0;
  for (;;) {
    try {
      res = await fetchWithTimeout(url, options);
    } catch {
      // timeout o fallo de red
      if (canRetry && attempt < MAX_RETRIES) {
        attempt++;
        await sleep(300 * attempt);
        continue;
      }
      throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.', null);
    }
    // 5xx transitorio (cold start de serverless, etc.)
    if (res.status >= 500 && canRetry && attempt < MAX_RETRIES) {
      attempt++;
      await sleep(300 * attempt);
      continue;
    }
    break;
  }

  const data = parseBody(await res.text());
  if (!res.ok) {
    if (res.status === 401 && !_retry && path !== '/auth/refresh' && path !== '/auth/login') {
      if (await refreshOnce()) return request<T>(method, path, body, true);
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
