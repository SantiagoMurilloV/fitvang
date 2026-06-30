const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

type Role = 'super_admin' | 'coach' | 'user';
export type Area = 'admin' | 'coach' | 'app' | 'acudiente';

interface MeUser {
  id: string;
  rol: Role;
  nombre: string;
  email: string;
  esAcudiente?: boolean;
}

/** Pantalla de inicio según el rol del usuario. */
function areaHome(user: MeUser): string {
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
 * Guard SSR para páginas protegidas. Devuelve una ruta de redirect si el usuario
 * no debe ver la página (no autenticado → login; rol incorrecto → su home), o
 * null si puede continuar. Llamar en el frontmatter:
 *
 *   const r = await guardArea(Astro.request, 'admin');
 *   if (r) return Astro.redirect(r);
 */
export async function guardArea(request: Request, area: Area): Promise<string | null> {
  const url = new URL(request.url);
  let user: MeUser;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return `/?next=${encodeURIComponent(url.pathname)}`;
    user = ((await res.json()) as { user: MeUser }).user;
  } catch {
    // API caída/lenta o sin sesión → al login (no colgamos el SSR por el timeout)
    return `/?next=${encodeURIComponent(url.pathname)}`;
  }
  // El usuario solo puede estar en SU área; en cualquier otra se le manda a su home.
  const home = areaHome(user);
  return home === AREA_PATH[area] ? null : home;
}
