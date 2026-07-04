import type { SessionUser } from './auth-store';

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

export type Area = 'admin' | 'coach' | 'app' | 'acudiente';

export interface GuardResult {
  redirect?: string;
  user?: SessionUser;
}

/** Pantalla de inicio según el rol del usuario. */
function areaHome(user: SessionUser): string {
  if (user.rol === 'super_admin') return '/admin';
  if (user.rol === 'coach') return '/coach';
  if (user.esAcudiente) return '/acudiente';
  return '/app';
}

// Ruta home de cada área. Cada rol tiene exactamente UN área → sin loops.
const AREA_PATH: Record<Area, string> = {
  admin: '/admin',
  coach: '/coach',
  app: '/app',
  acudiente: '/acudiente',
};

/**
 * Guard SSR para páginas protegidas. Hace UNA verificación de sesión y devuelve:
 *  - { redirect } si no debe ver la página (no autenticado → login; rol → su home)
 *  - { user }     si puede continuar (se pasa al island para evitar otro /auth/me)
 *
 *   const g = await guardArea(Astro.request, 'admin');
 *   if (g.redirect) return Astro.redirect(g.redirect);
 *   ... <Entry user={g.user} />
 */
export async function guardArea(request: Request, area: Area): Promise<GuardResult> {
  const url = new URL(request.url);
  let user: SessionUser;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { redirect: `/?next=${encodeURIComponent(url.pathname)}` };
    user = ((await res.json()) as { user: SessionUser }).user;
  } catch {
    // API caída/lenta o sin sesión → al login (no colgamos el SSR por el timeout)
    return { redirect: `/?next=${encodeURIComponent(url.pathname)}` };
  }
  // El usuario solo puede estar en SU área; en cualquier otra se le manda a su home.
  // Excepciones (doble perfil, cambian de espacio con el switch del header):
  //  - cliente que también es acudiente (menores vinculados) → además /acudiente
  //  - admin que también es coach (fila activa en coaches) → además /coach
  const home = areaHome(user);
  const esClienteAcudiente = user.rol === 'user' && !user.esAcudiente && !!user.tieneMenores;
  const esAdminCoach = user.rol === 'super_admin' && !!user.esCoach;
  const permitida =
    home === AREA_PATH[area] ||
    (esClienteAcudiente && area === 'acudiente') ||
    (esAdminCoach && area === 'coach');
  if (!permitida) return { redirect: home };
  return { user };
}
