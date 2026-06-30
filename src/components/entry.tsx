import { useEffect, useState } from 'react';
import { AppPage } from './shared/AppPage';
import { ErrorBoundary } from './shared/ErrorBoundary';
import type { SessionUser } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { UserDashboard } from './user/UserDashboard';
import { SchedulePicker } from './user/SchedulePicker';
import { ScoringView } from './user/ScoringView';
import { PaymentsView } from './user/PaymentsView';
import { JourneyView } from './user/JourneyView';
import { ProfileView } from './user/ProfileView';
import { AcudienteDashboard } from './acudiente/AcudienteDashboard';
import { CoachDashboard } from './coach/CoachDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { UsersAdmin } from './admin/UsersAdmin';
import { ClassesAdmin } from './admin/ClassesAdmin';
import { PaymentsAdmin } from './admin/PaymentsAdmin';
import { PlansAdmin } from './admin/PlansAdmin';
import { ConfigAdmin } from './admin/ConfigAdmin';
import { SchedulerAdmin } from './admin/SchedulerAdmin';

const VIEWS = {
  'user/home': { variant: 'app' as const, render: () => <UserDashboard /> },
  'user/horarios': { variant: 'app' as const, render: () => <SchedulePicker /> },
  'user/scoring': { variant: 'app' as const, render: () => <ScoringView /> },
  'user/pagos': { variant: 'app' as const, render: () => <PaymentsView /> },
  'user/recorrido': { variant: 'app' as const, render: () => <JourneyView /> },
  'user/perfil': { variant: 'app' as const, render: () => <ProfileView /> },
  'acudiente/home': { variant: 'acudiente' as const, render: () => <AcudienteDashboard /> },
  'acudiente/horarios': { variant: 'acudiente' as const, render: () => <SchedulePicker /> },
  'acudiente/perfil': { variant: 'acudiente' as const, render: () => <ProfileView /> },
  'coach/home': { variant: 'coach' as const, render: () => <CoachDashboard /> },
  'admin/home': { variant: 'admin' as const, render: () => <AdminDashboard /> },
  'admin/users': { variant: 'admin' as const, render: () => <UsersAdmin /> },
  'admin/clases': { variant: 'admin' as const, render: () => <ClassesAdmin /> },
  'admin/pagos': { variant: 'admin' as const, render: () => <PaymentsAdmin /> },
  'admin/planes': { variant: 'admin' as const, render: () => <PlansAdmin /> },
  'admin/config': { variant: 'admin' as const, render: () => <ConfigAdmin /> },
  'admin/scheduler': { variant: 'admin' as const, render: () => <SchedulerAdmin /> },
} as const;

export type ViewKey = keyof typeof VIEWS;

// Cada rol tiene UN único espacio (home). Fuente de verdad del ruteo por rol.
function homeFor(u: SessionUser): string {
  if (u.rol === 'super_admin') return '/admin';
  if (u.rol === 'coach') return '/coach';
  if (u.esAcudiente) return '/acudiente';
  return '/app';
}

const VARIANT_HOME: Record<'app' | 'coach' | 'admin' | 'acudiente', string> = {
  app: '/app',
  coach: '/coach',
  admin: '/admin',
  acudiente: '/acudiente',
};

export default function Entry({ view }: { view: ViewKey }) {
  const v = VIEWS[view];
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const next = encodeURIComponent(window.location.pathname);

    function applyUser(u: SessionUser) {
      // Si el usuario aterriza en un área que no es la suya (p.ej. super_admin
      // entrando por el start_url del PWA o un deep-link), se le manda a su home.
      // Así un super_admin NUNCA queda en el espacio de cliente.
      const home = homeFor(u);
      if (home !== VARIANT_HOME[v.variant]) {
        window.location.replace(home);
        return;
      }
      setUser(u);
      setChecking(false);
    }

    api.get<{ user: SessionUser }>('/auth/me')
      .then(({ user: u }) => applyUser(u))
      .catch(() => {
        // Access token expirado — intentar renovar antes de botar al login
        api.post('/auth/refresh')
          .then(() => api.get<{ user: SessionUser }>('/auth/me'))
          .then(({ user: u }) => applyUser(u))
          .catch(() => window.location.replace(`/?next=${next}`));
      });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppPage user={user!} variant={v.variant}>
        <ErrorBoundary>
          {v.render()}
        </ErrorBoundary>
      </AppPage>
    </ErrorBoundary>
  );
}
