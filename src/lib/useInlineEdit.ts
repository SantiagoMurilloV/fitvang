import { useState } from 'react';

/**
 * Máquina de estado de edición inline (editing/draft/saving + start/cancel/save),
 * antes duplicada en EditableField y el nombre de AvatarBlock (ProfileView) y en
 * Field y NameField (UserDetail). El caller decide la UI y la persistencia (onSave).
 *
 * - `normalize`: transforma el draft antes de comparar/guardar (ej. trim).
 * - `isUnchanged`: decide si no hay cambios reales (ej. vacío o igual al original).
 * - Si `onSave` lanza, el campo queda en edición (el caller muestra el error).
 */
export function useInlineEdit(opts: {
  value: string;
  onSave: (draft: string) => Promise<void>;
  normalize?: (v: string) => string;
  isUnchanged?: (draft: string, value: string) => boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(opts.value);
  const [saving, setSaving] = useState(false);

  function start() {
    setDraft(opts.value);
    setEditing(true);
  }

  function cancel() {
    setDraft(opts.value);
    setEditing(false);
  }

  async function save() {
    const normalized = opts.normalize ? opts.normalize(draft) : draft;
    const unchanged = opts.isUnchanged
      ? opts.isUnchanged(normalized, opts.value)
      : normalized === opts.value;
    if (unchanged) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await opts.onSave(normalized);
      setEditing(false);
    } catch {
      // el caller ya notificó el error; se mantiene en edición
    } finally {
      setSaving(false);
    }
  }

  return { editing, draft, setDraft, saving, start, cancel, save };
}
