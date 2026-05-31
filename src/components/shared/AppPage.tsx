import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, type ReactNode } from 'react';
import { queryClient } from '@/lib/query';
import { registerPush } from '@/lib/push';
import { useAuth, type SessionUser } from '@/lib/auth-store';
import { NotificationBell } from './NotificationBell';
import { PushPromptModal } from './PushPromptModal';
import {
  Home,
  Calendar,
  BarChart2,
  CreditCard,
  LayoutDashboard,
  Users2,
  BookOpen,
  Wallet,
  Tag,
} from 'lucide-react';

interface Props {
  user: SessionUser;
  variant: 'app' | 'coach' | 'admin';
  children: ReactNode;
}

const APP_TABS = [
  { label: 'Home', href: '/app', icon: Home, exact: true },
  { label: 'Horarios', href: '/app/horarios', icon: Calendar },
  { label: 'Scoring', href: '/app/asistencias', icon: BarChart2 },
  { label: 'Pagos', href: '/app/pagos', icon: CreditCard },
];

const COACH_TABS = [
  { label: 'Hoy', href: '/coach', icon: LayoutDashboard, exact: true },
];

const ADMIN_TABS = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users2 },
  { label: 'Clases', href: '/admin/clases', icon: BookOpen },
  { label: 'Pagos', href: '/admin/pagos', icon: Wallet },
  { label: 'Planes', href: '/admin/planes', icon: Tag },
];

const VARIANT_TABS = { app: APP_TABS, coach: COACH_TABS, admin: ADMIN_TABS };

function isActive(href: string, exact?: boolean): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  if (exact) return path === href;
  return path === href || path.startsWith(href + '/');
}

function BottomNav({ variant }: { variant: 'app' | 'coach' | 'admin' }) {
  const tabs = VARIANT_TABS[variant];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-stretch"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href, (tab as any).exact);
        const Icon = tab.icon;
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] flex-1 transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
            )}
            <span className="relative flex flex-col items-center gap-0.5">
              {active && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
              <Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </span>
          </a>
        );
      })}
    </nav>
  );
}

function Shell({ user, variant, children }: Props) {
  const setUser = useAuth((s) => s.setUser);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    setUser(user);

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      setTimeout(() => setShowPushPrompt(true), 1500);
    } else {
      registerPush().catch(() => {});
    }
  }, [user, setUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'default'
      ) {
        setShowPushPrompt(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const initials = user.nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    app: 'Miembro',
    coach: 'Coach',
    admin: 'Admin',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-background/90 backdrop-blur-md">
        <a href="/" className="flex items-center gap-2">
          <img src="/icons/logo.png" alt="Fitvang" className="h-7 w-auto object-contain" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
            {roleLabel[variant] ?? variant}
          </span>
        </a>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() =>
              fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).then(
                () => (window.location.href = '/'),
              )
            }
            className="size-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold text-primary hover:bg-primary hover:text-background transition-colors"
            title="Cerrar sesión"
          >
            {initials}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto pb-28">{children}</main>

      <BottomNav variant={variant} />

      <PushPromptModal open={showPushPrompt} onClose={() => setShowPushPrompt(false)} />
    </div>
  );
}

export function AppPage(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell {...props} />
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
