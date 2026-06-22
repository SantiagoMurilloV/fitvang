const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

type Role = 'super_admin' | 'coach' | 'user';

interface AuthUser {
  sub: string;
  rol: Role;
  nombre: string;
  email: string;
}

interface RequireAuthResult {
  user: AuthUser | null;
  redirect?: string;
}

export async function requireAuth(
  request: Request,
  allowedRoles: Role[],
): Promise<RequireAuthResult> {
  const url = new URL(request.url);
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    if (!res.ok) {
      return { user: null, redirect: `/?next=${encodeURIComponent(url.pathname)}` };
    }
    const { user } = (await res.json()) as { user: { id: string; rol: Role; nombre: string; email: string } };
    if (!allowedRoles.includes(user.rol)) {
      const fallback = user.rol === 'super_admin' ? '/admin' : user.rol === 'coach' ? '/coach' : '/app';
      return { user: null, redirect: fallback };
    }
    return { user: { sub: user.id, rol: user.rol, nombre: user.nombre, email: user.email } };
  } catch {
    return { user: null, redirect: `/?next=${encodeURIComponent(url.pathname)}` };
  }
}
