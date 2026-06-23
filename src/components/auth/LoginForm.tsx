import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, ApiError } from '@/lib/api';

interface LoginResp {
  user: { id: string; nombre: string; rol: 'super_admin' | 'coach' | 'user'; email: string; esAcudiente?: boolean };
  redirect: string;
}

/* ─── Welcome screen after login ────────────────────────────────────── */
function WelcomeScreen({ nombre }: { nombre: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl scale-150 pointer-events-none" />
          <img
            src="/icons/logo.png"
            alt="Fitvang"
            className="relative h-20 w-auto object-contain mx-auto drop-shadow-[0_0_24px_rgba(61,196,219,0.6)]"
          />
        </div>
        <p className="text-2xl font-bold">¡Bienvenido, {nombre}!</p>
        <p className="text-sm text-muted-foreground mt-1">Cargando tu espacio…</p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#3DC4DB,#4DD4E8)' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Error banner ───────────────────────────────────────────────────── */
const ERROR_MESSAGES: Record<number, string> = {
  401: 'El teléfono/email o la contraseña no coinciden.',
  429: 'Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.',
  0:   'Sin conexión. Revisa tu red e intenta de nuevo.',
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return ERROR_MESSAGES[err.status] ?? 'Algo salió mal de nuestro lado. Intenta en unos segundos.';
  }
  return ERROR_MESSAGES[0];
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState(''); // puede ser email o teléfono
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [welcome, setWelcome] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post<LoginResp>('/auth/login', {
        email: email.trim(),
        password,
      });
      const firstName = data.user.nombre.split(' ')[0];
      setWelcome(firstName);
      const rol = data.user.rol;
      const esAcudiente = data.user.esAcudiente;
      const nextAllowed = next && (
        rol === 'super_admin' ||
        (rol === 'coach' && (next.startsWith('/coach') || next.startsWith('/admin'))) ||
        (esAcudiente && next.startsWith('/acudiente')) ||
        (rol === 'user' && !esAcudiente && next.startsWith('/app'))
      );
      setTimeout(() => {
        window.location.href = nextAllowed ? next! : data.redirect;
      }, 1500);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {welcome && <WelcomeScreen nombre={welcome} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm mx-auto rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/[0.05] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        {/* Logo + tagline */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-110 pointer-events-none" />
            <img
              src="/icons/logo.png"
              alt="Fitvang"
              className="relative h-24 w-auto object-contain mx-auto drop-shadow-[0_0_32px_rgba(61,196,219,0.55)]"
            />
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
            Centro de Entrenamiento
          </p>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-300 leading-snug">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Teléfono o Email
            </label>
            <input
              type="text"
              inputMode="tel"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="username"
              className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition text-sm"
              placeholder="3001234567"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                className="w-full h-12 px-4 pr-11 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!welcome}
            className="w-full h-13 rounded-xl bg-primary text-[#0D0D0D] font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_0_20px_rgba(61,196,219,0.4)] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block size-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
            )}
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Tu club. Tu progreso. Tu energía.
        </p>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
          ¿Olvidaste tu contraseña? Habla con tu entrenador o el admin.
        </p>
      </motion.div>
    </>
  );
}
