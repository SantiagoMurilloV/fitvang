import { jwtVerify, type JWTPayload } from 'jose';

export const ACCESS_COOKIE = 'fv_access';

interface AccessClaims extends JWTPayload {
  sub: string;
  rol: 'super_admin' | 'coach' | 'user';
  nombre: string;
}

export async function verifyAccess(token: string): Promise<{ sub: string; rol: 'super_admin' | 'coach' | 'user'; nombre: string } | null> {
  try {
    const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET);
    const { payload } = await jwtVerify<AccessClaims>(token, secret, { issuer: 'fitvang' });
    return { sub: payload.sub, rol: payload.rol, nombre: payload.nombre };
  } catch {
    return null;
  }
}
