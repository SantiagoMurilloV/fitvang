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

/** ¿El usuario puede ver esta área? Conservador para no provocar loops de redirect. */
function areaAllowed(user: MeUser, area: Area): boolean {
  switch (area) {
    case 'admin':
      return user.rol === 'super_admin';
    case 'coach':
      return user.rol === 'coach' || user.rol === 'super_admin';
    case 'app':
    case 'acudiente':
      return true; // cualquier usuario autenticado
  }
}

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
  return areaAllowed(user, area) ? null : areaHome(user);
}
