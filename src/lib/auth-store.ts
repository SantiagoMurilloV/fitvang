import { create } from 'zustand';

export type Role = 'super_admin' | 'coach' | 'user';
export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  avatarUrl?: string | null;
  esMenor?: boolean;
  esAcudiente?: boolean;
  /** Cliente con menores vinculados en guardians: accede también a /acudiente */
  tieneMenores?: boolean;
  /** Doble perfil: admin con fila activa en coaches — accede también a /coach */
  esCoach?: boolean;
  terminosAceptados?: boolean;
}

interface AuthState {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
