import { useEffect, useRef } from 'react';
import { create } from 'zustand';

/**
 * Canal tipado para las acciones contextuales del header (antes window CustomEvents
 * tipo 'fitvang:crear-usuario'). El header dispara `fire(action)` y la pantalla
 * montada reacciona vía `useUiAction(action, cb)`. Tipado y sin acoplamiento global.
 */
export type UiAction =
  | 'crear-usuario'
  | 'abrir-permisos'
  | 'crear-plan'
  | 'crear-clase'
  | 'ir-programacion';

interface UiActionState {
  // `nonce` se incrementa en cada disparo para que listeners reaccionen incluso a repeticiones
  last: { action: UiAction; nonce: number } | null;
  fire: (action: UiAction) => void;
}

let counter = 0;

export const useUiActions = create<UiActionState>((set) => ({
  last: null,
  fire: (action) => set({ last: { action, nonce: ++counter } }),
}));

/** Ejecuta `cb` cuando se dispara `action`. No reacciona a disparos previos al montaje. */
export function useUiAction(action: UiAction, cb: () => void): void {
  const last = useUiActions((s) => s.last);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const seen = useRef<number>(last?.nonce ?? 0);

  useEffect(() => {
    if (last && last.nonce !== seen.current) {
      seen.current = last.nonce;
      if (last.action === action) cbRef.current();
    }
  }, [last, action]);
}
