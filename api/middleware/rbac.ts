import type { MiddlewareHandler } from 'hono';
import type { AccessPayload } from '../lib/jwt';

type Role = AccessPayload['rol'];

export const requireRole = (...roles: Role[]): MiddlewareHandler =>
  async (c, next) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.rol)) {
      return c.json({ error: 'forbidden', required: roles }, 403);
    }
    await next();
  };

export const requireAdmin = requireRole('super_admin');
export const requireStaff = requireRole('super_admin', 'coach');
