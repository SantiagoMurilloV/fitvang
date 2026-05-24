import { defineMiddleware } from 'astro:middleware';
import { verifyAccess } from '@api/lib/jwt';
import { ACCESS_COOKIE } from '@api/lib/env';

const PROTECTED_PREFIXES: Array<{ prefix: string; roles: Array<'super_admin' | 'coach' | 'user'> }> = [
  { prefix: '/admin', roles: ['super_admin'] },
  { prefix: '/coach', roles: ['super_admin', 'coach'] },
  { prefix: '/app', roles: ['super_admin', 'coach', 'user'] },
];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const match = PROTECTED_PREFIXES.find((p) => url.pathname === p.prefix || url.pathname.startsWith(p.prefix + '/'));
  if (!match) return next();

  const token = context.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccess(token) : null;
  if (!payload) {
    return context.redirect(`/?next=${encodeURIComponent(url.pathname)}`);
  }
  if (!match.roles.includes(payload.rol)) {
    return context.redirect(payload.rol === 'super_admin' ? '/admin' : payload.rol === 'coach' ? '/coach' : '/app');
  }
  context.locals.user = payload;
  return next();
});

declare global {
  namespace App {
    interface Locals {
      user?: { sub: string; rol: 'super_admin' | 'coach' | 'user'; nombre: string };
    }
  }
}
