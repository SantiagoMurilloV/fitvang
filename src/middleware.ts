import { defineMiddleware } from 'astro:middleware';

// Auth is handled client-side — middleware is a no-op in cross-domain setup
export const onRequest = defineMiddleware(async (_context, next) => {
  return next();
});

declare global {
  namespace App {
    interface Locals {
      user?: { sub: string; rol: 'super_admin' | 'coach' | 'user'; nombre: string };
    }
  }
}
