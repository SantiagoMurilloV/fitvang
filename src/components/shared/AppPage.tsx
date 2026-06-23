import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, type ReactNode } from 'react';
import { queryClient } from '@/lib/query';
import { registerPush } from '@/lib/push';
import { useAuth, type SessionUser } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { NotificationBell } from './NotificationBell';
import { PushPromptModal } from './PushPromptModal';
import Swal from 'sweetalert2';
import {
  Home,
  Calendar,
  BarChart2,
  CreditCard,
  User,
  LayoutDashboard,
  Users2,
  BookOpen,
  Wallet,
  Tag,
  Share,
  X,
  LogOut,
  Settings,
  Plus,
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
  { label: 'Perfil', href: '/app/perfil', icon: User },
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
  { label: 'Config', href: '/admin/configuracion', icon: Settings },
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

function useIosInstallBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = ('standalone' in navigator) && (navigator as any).standalone;
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (isIos && !isStandalone && !dismissed) setShow(true);
  }, []);
  return { show, dismiss: () => { sessionStorage.setItem('pwa-banner-dismissed', '1'); setShow(false); } };
}

function IosBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl flex items-start gap-3">
      <img src="/icons/icon-192.png" alt="Fitvang" className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Instala Fitvang</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Toca <Share size={11} className="inline mx-0.5" /> y luego <strong>"Agregar a inicio"</strong>
        </p>
      </div>
      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground p-1">
        <X size={16} />
      </button>
    </div>
  );
}

async function handleLogout() {
  const result = await Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Tendrás que volver a iniciar sesión para acceder.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    background: '#0f0f11',
    color: '#f8f8f8',
    confirmButtonColor: '#3DC4DB',
    cancelButtonColor: '#2a2a2f',
    customClass: {
      popup: 'rounded-2xl border border-white/10',
      confirmButton: 'rounded-xl font-semibold',
      cancelButton: 'rounded-xl font-semibold',
    },
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    await api.post('/auth/logout');
    window.location.href = '/';
  }
}

// ── Configuración del header por ruta ──────────────────────────────────
interface HeaderConfig {
  title: string;           // título que aparece en el header
  back?: string;           // href para flecha de regreso (si aplica)
  action?: {
    label: string;
    event: string;   // nombre del CustomEvent a disparar
  };
}

function getHeaderConfig(variant: string): HeaderConfig {
  if (typeof window === 'undefined') return { title: '' };
  const path = window.location.pathname;

  // Rutas admin
  if (variant === 'admin') {
    if (path === '/admin') return { title: '' };
    if (path.startsWith('/admin/usuarios')) return {
      title: 'Usuarios',
      action: { label: 'Nuevo', event: 'fitvang:crear-usuario' },
    };
    if (path.startsWith('/admin/clases')) return {
      title: 'Clases',
      action: { label: 'Mis clases', event: 'fitvang:ir-programacion' },
    };
    if (path.startsWith('/admin/programacion')) return {
      title: 'Mis clases',
      action: { label: 'Nueva clase', event: 'fitvang:crear-clase' },
    };
    if (path.startsWith('/admin/pagos')) return { title: 'Pagos' };
    if (path.startsWith('/admin/planes')) return {
      title: 'Planes',
      action: { label: 'Nuevo', event: 'fitvang:crear-plan' },
    };
    if (path.startsWith('/admin/configuracion')) return { title: 'Configuración' };
  }

  // Rutas app usuario
  if (variant === 'app') {
    if (path === '/app') return { title: '' };
    if (path.startsWith('/app/horarios')) return { title: 'Horarios' };
    if (path.startsWith('/app/asistencias')) return { title: 'Scoring' };
    if (path.startsWith('/app/pagos')) return { title: 'Pagos' };
    if (path.startsWith('/app/perfil')) return { title: 'Perfil' };
    if (path.startsWith('/app/recorrido')) return { title: 'Mi Recorrido' };
  }

  // Rutas coach
  if (variant === 'coach') return { title: '' };

  return { title: '' };
}

function Shell({ user, variant, children }: Props) {
  const setUser = useAuth((s) => s.setUser);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const { show: showIosBanner, dismiss: dismissIosBanner } = useIosInstallBanner();
  const header = getHeaderConfig(variant);
  const isDashboard = !header.title; // sin título = home/dashboard

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

  const roleLabel: Record<string, string> = { app: 'Miembro', coach: 'Coach', admin: 'Admin' };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-background/90 backdrop-blur-md">

        {/* Izquierda: logo (dashboard) o flecha+título (sección) */}
        {isDashboard ? (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
            {roleLabel[variant] ?? variant}
          </span>
        ) : (
          <h1 className="text-base font-bold">{header.title}</h1>
        )}

        {/* Derecha: acción contextual + notificaciones + logout */}
        <div className="flex items-center gap-2">
          {header.action && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent(header.action!.event))}
              className="flex items-center gap-1 px-3 h-8 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus size={13} />
              {header.action.label}
            </button>
          )}
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="size-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-red-400 hover:border-red-400/50 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto pb-28">{children}</main>

      <BottomNav variant={variant} />

      <PushPromptModal open={showPushPrompt} onClose={() => setShowPushPrompt(false)} />
      {showIosBanner && <IosBanner onDismiss={dismissIosBanner} />}
    </div>
  );
}

export function AppPage({ user, variant, children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell user={user} variant={variant}>
        {children}
      </Shell>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
