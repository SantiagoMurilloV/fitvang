import { defineMiddleware } from 'astro:middleware';

const PROTECTED_PREFIXES: Array<{ prefix: string; roles: Array<'super_admin' | 'coach' | 'user'> }> = [
  { prefix: '/admin', roles: ['super_admin'] },
  { prefix: '/coach', roles: ['super_admin', 'coach'] },
  { prefix: '/app', roles: ['super_admin', 'coach', 'user'] },
];

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const match = PROTECTED_PREFIXES.find(
    (p) => url.pathname === p.prefix || url.pathname.startsWith(p.prefix + '/'),
  );
  if (!match) return next();

  // Verificar sesión preguntándole al backend con las cookies del request
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        cookie: context.request.headers.get('cookie') ?? '',
      },
    });

    if (!res.ok) {
      return context.redirect(`/?next=${encodeURIComponent(url.pathname)}`);
    }

    const { user } = await res.json() as { user: { id: string; rol: 'super_admin' | 'coach' | 'user'; nombre: string } };

    if (!match.roles.includes(user.rol)) {
      return context.redirect(
        user.rol === 'super_admin' ? '/admin' : user.rol === 'coach' ? '/coach' : '/app',
      );
    }

    context.locals.user = { sub: user.id, rol: user.rol, nombre: user.nombre };
  } catch {
    return context.redirect(`/?next=${encodeURIComponent(url.pathname)}`);
  }

  return next();
});

declare global {
  namespace App {
    interface Locals {
      user?: { sub: string; rol: 'super_admin' | 'coach' |  'user'; nombre: string };
    }
  }
}
