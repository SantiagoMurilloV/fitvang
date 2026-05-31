import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/shared/Button';

interface LoginResp {
  user: { id: string; nombre: string; rol: 'super_admin' | 'coach' | 'user'; email: string };
  redirect: string;
}

export default function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<LoginResp>('/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });
      toast.success(`¡Bienvenido, ${data.user.nombre.split(' ')[0]}!`);
      window.location.href = next || data.redirect;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) toast.error('Email o contraseña incorrectos.');
        else if (err.status === 429) toast.error('Muchos intentos. Espera un minuto.');
        else toast.error('No pudimos iniciar sesión. Intenta de nuevo.');
      } else toast.error('Error de red.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toaster theme="dark" position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-auto"
      >
        {/* Logo + tagline */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <img
              src="/icons/logo.png"
              alt="Fitvang"
              className="h-24 w-auto object-contain mx-auto drop-shadow-[0_0_24px_rgba(61,196,219,0.35)]"
            />
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
            Centro de Entrenamiento · Cali
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition text-sm"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full h-13 rounded-xl bg-primary text-[#0D0D0D] font-bold text-base
              transition-all disabled:opacity-60 disabled:cursor-not-allowed
              hover:brightness-110 hover:shadow-[0_0_20px_rgba(61,196,219,0.4)]
              active:scale-[0.98]
              flex items-center justify-center gap-2
            `}
          >
            {loading && (
              <span className="inline-block size-4 rounded-full border-2 border-[#0D0D0D] border-t-transparent animate-spin" />
            )}
            Entrar
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
