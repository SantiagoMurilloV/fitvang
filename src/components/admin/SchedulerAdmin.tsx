import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X, Check, Trash2, Clock, Users, CalendarDays, RefreshCw, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '@/lib/api';
import { useUiAction } from '@/lib/ui-actions';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface TrainingType {
  id: string;
  nombre: string;
  slug: string;
  colorHex: string;
}

interface PlanType {
  id: string;
  nombre: string;
  trainingNombre: string;
  trainingColor: string;
  activo: boolean;
}

interface Template {
  id: string;
  nombre: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  trainingColor: string;
  trainingNombre: string;
  capacidadMax: number;
  planIds: string[];
}

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
const DIAS_SHORT: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue',
  viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
};
const HOURS = Array.from({ length: 16 }, (_, i) => `${String(i + 5).padStart(2, '0')}:00`); // 05:00 – 20:00

type Dia = typeof DIAS[number];

/* ─── Preview grid cell ──────────────────────────────────────────────── */
function PreviewCell({ nombre, color, horaInicio, horaFin, isNew }: {
  nombre: string; color: string; horaInicio: string; horaFin: string; isNew?: boolean;
}) {
  return (
    <div
      className={`rounded-md p-1 text-left border transition-all ${isNew ? 'ring-2 ring-white/40 scale-105' : ''}`}
      style={{ borderLeftColor: color, borderLeftWidth: 3, backgroundColor: `${color}18`, borderColor: `${color}30` }}
    >
      <p className="text-[9px] font-semibold truncate" style={{ color }}>{nombre}</p>
      <p className="text-[8px] text-muted-foreground">{horaInicio.slice(0,5)}</p>
    </div>
  );
}

/* ─── Live Preview Grid ──────────────────────────────────────────────── */
function LivePreview({ templates, draft }: {
  templates: Template[];
  draft: { nombre: string; dias: Dia[]; horaInicio: string; duracionMin: number; color: string } | null;
}) {
  // Calcular horaFin del draft
  const draftFin = useMemo(() => {
    if (!draft) return '';
    const [h, m] = draft.horaInicio.split(':').map(Number);
    const total = h * 60 + m + draft.duracionMin;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }, [draft]);

  // Agrupar templates por día
  const byDay = useMemo(() => {
    const map: Record<string, Template[]> = {};
    for (const d of DIAS) map[d] = [];
    for (const t of templates) {
      if (map[t.diaSemana]) map[t.diaSemana].push(t);
    }
    return map;
  }, [templates]);

  // Horas únicas (existentes + draft)
  const hours = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) set.add(t.horaInicio.slice(0, 5));
    if (draft?.horaInicio) set.add(draft.horaInicio.slice(0, 5));
    return [...set].sort();
  }, [templates, draft]);

  if (hours.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        El horario aparecerá aquí conforme configures las clases.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        {/* Header días */}
        <div className="grid gap-0.5 mb-1" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
          <div />
          {DIAS.map((d) => (
            <div key={d} className={`text-center text-[10px] font-semibold py-1 rounded ${draft?.dias.includes(d) ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
              {DIAS_SHORT[d]}
            </div>
          ))}
        </div>

        {/* Filas por hora */}
        {hours.map((hour) => (
          <div key={hour} className="grid gap-0.5 mb-0.5 min-h-[40px]" style={{ gridTemplateColumns: '36px repeat(7, 1fr)' }}>
            <div className="flex items-start justify-end pr-1 pt-0.5">
              <span className="text-[9px] text-muted-foreground">{hour}</span>
            </div>
            {DIAS.map((dia) => {
              const cells = byDay[dia].filter((t) => t.horaInicio.slice(0, 5) === hour);
              const showDraft = draft && draft.dias.includes(dia) && draft.horaInicio.slice(0, 5) === hour && draft.nombre;
              return (
                <div key={dia} className="space-y-0.5 min-h-[36px]">
                  {cells.map((t) => (
                    <PreviewCell key={t.id} nombre={t.nombre} color={t.trainingColor || '#3DC4DB'} horaInicio={t.horaInicio} horaFin={t.horaFin} />
                  ))}
                  {showDraft && (
                    <PreviewCell nombre={draft.nombre} color={draft.color || '#3DC4DB'} horaInicio={draft.horaInicio} horaFin={draftFin} isNew />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Class Form ─────────────────────────────────────────────────────── */
type Draft = { nombre: string; dias: Dia[]; horaInicio: string; duracionMin: number; color: string } | null;

function ClassForm({ trainingTypes, plans, templates, onSuccess, onDraftChange }: {
  trainingTypes: TrainingType[];
  plans: PlanType[];
  templates: Template[];
  onSuccess: () => void;
  onDraftChange: (draft: Draft) => void;
}) {
  const [form, setForm] = useState({
    nombre: '',
    trainingTypeId: '',
    dias: [] as Dia[],
    horaInicio: '06:00',
    duracionMin: 60,
    capacidadMax: '' as string | number,
    planIds: [] as string[],
    repetir: 'siempre' as 'mes' | 'siempre',
    generarDias: 60,
  });

  // Inicializar trainingTypeId cuando lleguen los datos
  useEffect(() => {
    if (trainingTypes.length > 0 && !form.trainingTypeId) {
      setForm((f) => ({ ...f, trainingTypeId: trainingTypes[0].id }));
    }
  }, [trainingTypes]);

  const selectedTraining = trainingTypes.find((t) => t.id === form.trainingTypeId);

  // Actualizar draft hacia el padre en tiempo real
  useEffect(() => {
    const draft: Draft = form.nombre && form.dias.length > 0 && form.trainingTypeId ? {
      nombre: form.nombre,
      dias: form.dias,
      horaInicio: form.horaInicio,
      duracionMin: form.duracionMin,
      color: selectedTraining?.colorHex ?? '#3DC4DB',
    } : null;
    onDraftChange(draft);
  }, [form.nombre, form.dias, form.horaInicio, form.duracionMin, form.trainingTypeId, selectedTraining?.colorHex]);

  const save = useMutation({
    mutationFn: () => {
      if (!form.trainingTypeId) throw new Error('Selecciona una categoría');
      if (form.dias.length === 0) throw new Error('Selecciona al menos un día');
      return api.post('/classes/programar', {
        nombre: form.nombre.trim(),
        trainingTypeId: form.trainingTypeId,
        dias: form.dias,
        horaInicio: form.horaInicio.slice(0, 5), // asegurar HH:MM sin segundos
        duracionMin: Number(form.duracionMin),
        capacidadMax: form.capacidadMax !== '' ? Number(form.capacidadMax) : null,
        planIds: form.planIds,
        repetir: form.repetir,
        generarDias: form.generarDias,
      });
    },
    onSuccess: (data: any) => {
      toast.success(`Clase creada en ${form.dias.length} día${form.dias.length > 1 ? 's' : ''}. ${data.sesionesGeneradas} sesiones generadas.`);
      setForm((f) => ({ nombre: '', trainingTypeId: f.trainingTypeId, dias: [], horaInicio: '06:00', duracionMin: 60, capacidadMax: '', planIds: [], repetir: 'siempre', generarDias: 60 }));
      onSuccess();
    },
    onError: (err: any) => toast.error(err?.message ?? 'No se pudo crear la clase.'),
  });

  function toggleDia(d: Dia) {
    setForm((f) => ({
      ...f,
      dias: f.dias.includes(d) ? f.dias.filter((x) => x !== d) : [...f.dias, d],
    }));
  }

  function togglePlan(id: string) {
    setForm((f) => ({
      ...f,
      planIds: f.planIds.includes(id) ? f.planIds.filter((x) => x !== id) : [...f.planIds, id],
    }));
  }

  function allDays() {
    setForm((f) => ({ ...f, dias: f.dias.length === 7 ? [] : [...DIAS] }));
  }

  const activePlans = plans.filter((p) => p.activo);

  return (
    <div className="space-y-5">
      {/* Nombre */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre de la clase</label>
        <input
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Ej: Funcional 6AM, Fútbol Funcional…"
          className="mt-1.5 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
        />
      </div>

      {/* Tipo de entrenamiento */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoría</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {trainingTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => setForm({ ...form, trainingTypeId: t.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
              style={
                form.trainingTypeId === t.id
                  ? { backgroundColor: `${t.colorHex}25`, borderColor: t.colorHex, color: t.colorHex }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
              }
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: t.colorHex }} />
              {t.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Días */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Días</label>
          <button onClick={allDays} className="text-xs text-primary hover:underline">
            {form.dias.length === 7 ? 'Quitar todos' : 'Todos los días'}
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DIAS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDia(d)}
              className={`py-2 rounded-xl text-[10px] font-semibold border transition-all ${
                form.dias.includes(d)
                  ? 'bg-primary text-background border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {DIAS_SHORT[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Hora y duración */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora inicio</label>
          <input
            type="time"
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            className="mt-1.5 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duración (min)</label>
          <input
            type="number"
            value={form.duracionMin}
            min={15}
            max={480}
            step={15}
            onChange={(e) => setForm({ ...form, duracionMin: Number(e.target.value) })}
            className="mt-1.5 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Capacidad */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacidad máxima <span className="text-muted-foreground/50 normal-case">(opcional)</span></label>
        <input
          type="number"
          value={form.capacidadMax}
          min={1}
          max={500}
          onChange={(e) => setForm({ ...form, capacidadMax: e.target.value })}
          placeholder="Sin límite"
          className="mt-1.5 w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
        />
      </div>

      {/* Planes que acceden */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Planes con acceso <span className="text-muted-foreground/50 normal-case">(vacío = todos)</span></label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {activePlans.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlan(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                form.planIds.includes(p.id)
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {form.planIds.includes(p.id) && <Check size={10} />}
              {p.nombre}
            </button>
          ))}
          {activePlans.length === 0 && <p className="text-xs text-muted-foreground">No hay planes activos.</p>}
        </div>
      </div>

      {/* Repetición */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Repetición</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {([['siempre', 'Todos los meses'], ['mes', 'Solo este mes']] as const).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setForm({ ...form, repetir: val, generarDias: val === 'mes' ? 30 : 60 })}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.repetir === val
                  ? 'bg-primary/15 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        loading={save.isPending}
        onClick={() => save.mutate()}
        disabled={!form.nombre || form.dias.length === 0}
      >
        <Plus size={14} /> Crear clase
      </Button>
    </div>
  );
}

/* ─── Edit Template Modal ────────────────────────────────────────────── */
function EditTemplateModal({ template, trainingTypes, onClose, onSaved }: {
  template: Template;
  trainingTypes: TrainingType[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(template.nombre);
  const [horaInicio, setHoraInicio] = useState(template.horaInicio.slice(0, 5));
  const [capacidadMax, setCapacidadMax] = useState(String(template.capacidadMax || ''));
  const [trainingTypeId, setTrainingTypeId] = useState(template.trainingNombre
    ? (trainingTypes.find((t) => t.nombre === template.trainingNombre)?.id ?? '')
    : '');

  const mutation = useMutation({
    mutationFn: () => api.patch(`/classes/templates/${template.id}`, {
      nombre: nombre.trim(),
      trainingTypeId: trainingTypeId || undefined,
      horaInicio: horaInicio.slice(0, 5),
      capacidadMax: capacidadMax ? Number(capacidadMax) : null,
    }),
    onSuccess: () => { toast.success('Clase actualizada.'); onSaved(); onClose(); },
    onError: () => toast.error('No se pudo guardar.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <Card className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">Editar clase</p>
              <p className="text-xs text-muted-foreground mt-0.5">{DIAS_SHORT[template.diaSemana]}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Categoría</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {trainingTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTrainingTypeId(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                  style={
                    trainingTypeId === t.id
                      ? { backgroundColor: `${t.colorHex}25`, borderColor: t.colorHex, color: t.colorHex }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                  }
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: t.colorHex }} />
                  {t.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Hora inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Capacidad</label>
              <input
                type="number"
                value={capacidadMax}
                min={1}
                max={500}
                onChange={(e) => setCapacidadMax(e.target.value)}
                placeholder="Sin límite"
                className="mt-1 w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()} className="flex-1">Guardar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── Template list ──────────────────────────────────────────────────── */
interface TemplateGroup {
  key: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  capacidadMax: number | null;
  trainingColor: string;
  trainingNombre: string;
  dias: string[];           // días que tiene este horario
  ids: string[];            // una id por día (para editar/eliminar)
  representative: Template; // la primera, para el modal de edición
}

function groupTemplates(templates: Template[]): TemplateGroup[] {
  const map = new Map<string, TemplateGroup>();
  for (const t of templates) {
    // Agrupar por categoría (trainingNombre) — "Fitvang Kids · lunes", "Fitvang Kids · martes" → 1 entrada
    const key = t.trainingNombre;
    if (!map.has(key)) {
      map.set(key, {
        key,
        nombre: t.trainingNombre, // mostrar nombre de la categoría, no el de la plantilla
        horaInicio: t.horaInicio,
        horaFin: t.horaFin,
        capacidadMax: t.capacidadMax,
        trainingColor: t.trainingColor,
        trainingNombre: t.trainingNombre,
        dias: [],
        ids: [],
        representative: t,
      });
    }
    const g = map.get(key)!;
    g.dias.push(t.diaSemana);
    g.ids.push(t.id);
  }
  return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function TemplateList({ templates, trainingTypes, onDelete, onEdit }: {
  templates: Template[];
  trainingTypes: TrainingType[];
  onDelete: (ids: string[], label: string) => void;
  onEdit: (t: Template) => void;
}) {
  if (!templates.length) return (
    <div className="text-center py-8 text-sm text-muted-foreground">
      No hay clases aún. Crea una con "+ Nueva clase".
    </div>
  );

  const groups = groupTemplates(templates);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {groups.length} clase{groups.length !== 1 ? 's' : ''}
      </p>
      {groups.map((g) => (
        <div key={g.key} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
          <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: g.trainingColor || '#3DC4DB' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{g.nombre}</p>
            <p className="text-xs text-muted-foreground">{g.horaInicio.slice(0,5)} – {g.horaFin.slice(0,5)} · Cap. {g.capacidadMax ?? '∞'}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(g.representative)}
              className="size-7 rounded-lg text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10 flex items-center justify-center transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(g.ids, `${g.nombre} (${g.horaInicio.slice(0,5)})`)}
              className="size-7 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export function SchedulerAdmin() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const [draft, setDraft] = useState<Draft>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useUiAction('crear-clase', () => setShowForm(true));

  const { data: trainingData } = useQuery({
    queryKey: ['training-types'],
    queryFn: () => api.get<{ trainingTypes: TrainingType[] }>('/classes/training-types'),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plan-types'],
    queryFn: () => api.get<{ planTypes: PlanType[] }>('/plans/types'),
  });

  // Admin: mostrar TODAS las plantillas (antes filtraba ?coachId=me, pero como
  // las clases no tienen coach asignado el admin no veía ninguna en "Mis clases").
  const { data: templatesData, refetch } = useQuery({
    queryKey: ['class-templates'],
    queryFn: () => api.get<{ templates: Template[] }>('/classes/templates'),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => api.delete(`/classes/templates/${id}`))),
    onSuccess: () => { toast.success('Clase eliminada.'); refetch(); },
    onError: () => toast.error('No se pudo eliminar.'),
  });

  async function handleDeleteTemplate(ids: string[], label: string) {
    const result = await Swal.fire({
      title: 'Eliminar clase',
      html: `<span style="color:#a1a1aa">¿Eliminar <b style="color:#f8f8f8">${label}</b>? Se desactivará en todos los días y no generará más sesiones.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f0f11',
      color: '#f8f8f8',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2f',
      customClass: { popup: 'rounded-2xl border border-white/10' },
      reverseButtons: true,
    });
    if (result.isConfirmed) deleteTemplateMutation.mutate(ids);
  }

  const trainingTypes = trainingData?.trainingTypes ?? [];
  const plans = plansData?.planTypes ?? [];
  const templates = templatesData?.templates ?? [];

  return (
    <div className="space-y-6">

      {/* Layout: form izquierda, preview derecha en desktop */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista + form opcional */}
        <div className="lg:w-[400px] shrink-0 space-y-6">
          {showForm && (
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-sm">Nueva clase</p>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
              </div>
              <ClassForm
                trainingTypes={trainingTypes}
                plans={plans}
                templates={templates}
                onDraftChange={setDraft}
                onSuccess={() => { qc.invalidateQueries({ queryKey: ['class-templates'] }); refetch(); setShowForm(false); }}
              />
            </div>
          )}
          <TemplateList
            templates={templates}
            trainingTypes={trainingTypes}
            onDelete={handleDeleteTemplate}
            onEdit={(t) => setEditingTemplate(t)}
          />
        </div>

        {/* Preview en tiempo real */}
        <div className="flex-1 rounded-2xl bg-card border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Vista previa del horario</p>
            <button onClick={() => refetch()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw size={11} /> Actualizar
            </button>
          </div>
          <LivePreview templates={templates} draft={draft} />
        </div>
      </div>

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          trainingTypes={trainingTypes}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['class-templates'] }); refetch(); }}
        />
      )}
    </div>
  );
}
