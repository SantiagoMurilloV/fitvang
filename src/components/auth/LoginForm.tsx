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
      const data = await api.post<LoginResp>('/auth/login', { email: email.toLowerCase().trim(), password });
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
        <div className="text-center mb-8">
          <img
            src="/icons/logo.png"
            alt="Fitvang"
            className="h-24 w-auto object-contain mx-auto"
          />
          <p className="text-sm text-muted-foreground mt-4">Tu club. Tu progreso. Tu energía.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
            Entrar
          </Button>
        </form>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          ¿Olvidaste tu contraseña? Habla con tu entrenador o el admin del club.
        </p>
      </motion.div>
    </>
  );
}
