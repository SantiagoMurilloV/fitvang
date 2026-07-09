import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, X, Send, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = {
  user: [
    '¿A qué clases puedo entrar?',
    '¿Cuándo es mi próxima reserva?',
    '¿Tengo pagos pendientes?',
    'Dame un tip para mejorar mi sentadilla',
  ],
  admin: [
    '¿Quién está reservado hoy?',
    '¿Quién tiene pagos pendientes?',
    'Analiza las finanzas de los últimos 6 meses',
    'Resérvale una clase a un usuario',
    '¿Qué planes vencen esta semana?',
    '¿Quién lleva un mes sin venir?',
  ],
};

const API_BASE = (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000') + '/api';

// Etiquetas legibles de lo que está consultando el agente
const TOOL_LABELS: Record<string, string> = {
  mis_planes: 'Revisando tu plan…',
  mis_reservas: 'Revisando tus reservas…',
  mi_scoring: 'Revisando tu asistencia…',
  mis_pagos: 'Revisando tus pagos…',
  clases_disponibles: 'Buscando clases disponibles…',
  reservas_por_fecha: 'Revisando reservas…',
  pagos_estado: 'Revisando pagos…',
  resumen_financiero: 'Calculando finanzas…',
  finanzas_por_mes: 'Calculando finanzas…',
  deudores: 'Revisando deudores…',
  preparar_notificacion: 'Preparando notificación…',
  enviar_notificacion: 'Enviando notificación…',
  buscar_usuario: 'Buscando usuarios…',
  detalle_usuario: 'Revisando datos del usuario…',
  listar_usuarios: 'Listando miembros…',
  usuarios_inactivos: 'Revisando inactividad…',
  planes_del_club: 'Revisando planes del club…',
  planes_por_vencer: 'Buscando planes por vencer…',
  clases_semana: 'Revisando horario y cupos…',
  reservar_clase: 'Gestionando la reserva…',
  cancelar_reserva: 'Gestionando la cancelación…',
  aprobar_pago: 'Procesando el pago…',
  rechazar_comprobante: 'Procesando el comprobante…',
  modo_analisis: 'Analizando a fondo, dame un momento…',
};

// Render markdown ligero: **negrita** + viñetas + saltos de línea.
function renderInline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1.5" />;
        const bullet = /^[-*•]\s+/.test(t);
        const numbered = /^\d+\.\s+/.test(t);
        const content = bullet ? t.replace(/^[-*•]\s+/, '') : t;
        if (bullet) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-primary shrink-0">•</span>
              <span>{renderInline(content)}</span>
            </div>
          );
        }
        return <p key={i} className={numbered ? 'pl-1' : ''}>{renderInline(content)}</p>;
      })}
    </div>
  );
}

export function VangBubble() {
  const user = useAuth((s) => s.user);
  const firstName = user?.nombre?.split(' ')[0] ?? '';
  const isAdmin = user?.rol === 'super_admin';

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const greeting = isAdmin
    ? `Hola **${firstName}**. Soy **Vang**, tu asistente del club. Pregúntame por usuarios, reservas, cupos, planes y finanzas, pídeme análisis a fondo, o dime y le reservo una clase a alguien, apruebo pagos y envío notificaciones (siempre te pido confirmación antes).`
    : `Hola **${firstName}**. Soy **Vang**, tu asistente de Fitvang. Pregúntame por tus clases, reservas y pagos, o pídeme tips de entrenamiento y alimentación.`;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [open, greeting, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || sending) return;
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    setInput('');
    setSending(true);
    setStatus('');

    // Historial sin el saludo inicial (debe empezar en un mensaje de usuario)
    const payload = (next[0]?.role === 'assistant' ? next.slice(1) : next).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_BASE}/agent/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });
      if (!res.ok || !res.body) throw new Error('stream_failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let reply = '';
      let errored = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';
        for (const ev of events) {
          let name = 'message';
          let data = '';
          for (const line of ev.split('\n')) {
            if (line.startsWith('event:')) name = line.slice(6).trim();
            else if (line.startsWith('data:')) data += line.slice(5).trim();
          }
          if (name === 'tool') setStatus(TOOL_LABELS[data] ?? 'Consultando…');
          else if (name === 'done') { try { reply = JSON.parse(data).reply; } catch { /* noop */ } }
          else if (name === 'error') errored = data || 'No pude responder.';
        }
      }
      setMessages((m) => [...m, { role: 'assistant', content: errored || reply || 'No tengo una respuesta para eso.' }]);
    } catch {
      // Fallback sin streaming
      try {
        const { reply } = await api.post<{ reply: string }>('/agent/chat', { messages: payload });
        setMessages((m) => [...m, { role: 'assistant', content: reply || 'No pude responder.' }]);
      } catch (err) {
        const msg = err instanceof ApiError ? (err.data?.message ?? 'No pude responder.') : 'No pude responder.';
        setMessages((m) => [...m, { role: 'assistant', content: msg }]);
      }
    } finally {
      setSending(false);
      setStatus('');
    }
  }

  if (!user) return null;
  const showChips = messages.length <= 1 && !sending;

  return (
    <>
      {/* Burbuja flotante (cerebrito azul/negro) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir Vang"
        className="fixed right-4 z-60 size-14 rounded-full bg-[#0D0D0D] border border-primary/50 grid place-items-center shadow-lg shadow-primary/25 hover:border-primary transition-colors"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
      >
        <span className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        <Brain className="size-7 text-primary relative" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="vang-panel"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed right-3 z-61 flex flex-col rounded-2xl border border-primary/30 bg-[#0d0d0d] shadow-2xl shadow-black/50 overflow-hidden w-[min(390px,calc(100vw-1.5rem))] h-[min(72vh,580px)]"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-linear-to-r from-primary/10 to-transparent">
              <span className="size-9 rounded-xl bg-primary/15 border border-primary/40 grid place-items-center">
                <Brain className="size-5 text-primary" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">Vang</p>
                <p className="text-[10px] text-muted-foreground">Asistente Fitness · IA</p>
              </div>
              <button
                onClick={() => setMessages([{ role: 'assistant', content: greeting }])}
                title="Limpiar conversación"
                className="size-8 rounded-full bg-white/5 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
              <button onClick={() => setOpen(false)} className="size-8 rounded-full bg-white/5 grid place-items-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-4" />
              </button>
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card border border-border text-foreground rounded-bl-sm',
                    )}
                  >
                    {m.role === 'assistant' ? <RichText text={m.content} /> : m.content}
                  </div>
                </div>
              ))}

              {/* Chips de sugerencias */}
              {showChips && (
                <div className="space-y-2 pt-1">
                  {SUGGESTIONS[isAdmin ? 'admin' : 'user'].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full text-left text-sm px-3 py-2 rounded-xl bg-card border border-border text-foreground/90 hover:border-primary hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.2s]" />
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.1s]" />
                      <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" />
                    </span>
                    {status && <span className="text-xs text-muted-foreground">{status}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 p-3 border-t border-white/10 bg-[#0D0D0D]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                rows={1}
                placeholder="Fitness, reservas, tu cuenta…"
                className="flex-1 resize-none max-h-24 px-3 py-2 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || sending}
                className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Send className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
