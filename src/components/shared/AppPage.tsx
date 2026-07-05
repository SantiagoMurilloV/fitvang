import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, type ReactNode } from 'react';
import { queryClient } from '@/lib/query';
import { registerPush } from '@/lib/push';
import { useAuth, type SessionUser } from '@/lib/auth-store';
import { useUiActions, type UiAction } from '@/lib/ui-actions';
import { api } from '@/lib/api';
import { NotificationBell } from './NotificationBell';
import { PushPromptModal } from './PushPromptModal';
import { VangBubble } from './VangBubble';
import { TermsModal } from './TermsModal';
import { PwaInstallBanner } from './PwaInstallBanner';
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
  LogOut,
  Settings,
  Plus,
  ChevronLeft,
} from 'lucide-react';

interface Props {
  user: SessionUser;
  variant: 'app' | 'coach' | 'admin' | 'acudiente';
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
  { label: 'Semana', href: '/coach/semana', icon: Calendar },
  { label: 'Alumnos', href: '/coach/alumnos', icon: Users2 },
  { label: 'Perfil', href: '/coach/perfil', icon: User },
];

const ACUDIENTE_TABS = [
  { label: 'Inicio', href: '/acudiente', icon: Home, exact: true },
  { label: 'Horarios', href: '/acudiente/horarios', icon: Calendar },
  { label: 'Perfil', href: '/acudiente/perfil', icon: User },
];

const ADMIN_TABS = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users2 },
  { label: 'Clases', href: '/admin/clases', icon: BookOpen },
  { label: 'Pagos', href: '/admin/pagos', icon: Wallet },
  { label: 'Planes', href: '/admin/planes', icon: Tag },
  { label: 'Config', href: '/admin/configuracion', icon: Settings },
];

const VARIANT_TABS = { app: APP_TABS, coach: COACH_TABS, admin: ADMIN_TABS, acudiente: ACUDIENTE_TABS };

function isActive(href: string, exact?: boolean): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  if (exact) return path === href;
  return path === href || path.startsWith(href + '/');
}

function BottomNav({ variant, mounted }: { variant: 'app' | 'coach' | 'admin' | 'acudiente'; mounted: boolean }) {
  const tabs = VARIANT_TABS[variant];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border flex items-stretch"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {tabs.map((tab) => {
        const active = mounted && isActive(tab.href, (tab as any).exact);
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
interface HeaderAction {
  label: string;
  action: UiAction;
  icon?: 'plus' | 'settings' | 'calendar' | 'chart';
}
interface HeaderConfig {
  title: string;
  back?: string;
  action?: HeaderAction;
  actions?: HeaderAction[];
}

function getHeaderConfig(variant: string): HeaderConfig {
  if (typeof window === 'undefined') return { title: '' };
  const path = window.location.pathname;

  // Rutas admin
  if (variant === 'admin') {
    if (path === '/admin') return { title: '' };
    if (path.startsWith('/admin/finanzas')) return { title: 'Análisis financiero', back: '/admin/pagos' };
    if (path.startsWith('/admin/usuarios')) return {
      title: 'Usuarios',
      actions: [
        { label: 'Permisos', action: 'abrir-permisos', icon: 'settings' as const },
        { label: 'Nuevo', action: 'crear-usuario', icon: 'plus' as const },
      ],
    };
    if (path.startsWith('/admin/clases')) return {
      title: 'Clases',
      action: { label: 'Mis clases', action: 'ir-programacion' },
    };
    if (path.startsWith('/admin/programacion')) return {
      title: 'Mis clases',
      back: '/admin/clases',
      action: { label: 'Nueva clase', action: 'crear-clase' },
    };
    if (path.startsWith('/admin/pagos')) return { title: 'Pagos', action: { label: 'Análisis financiero', action: 'ir-finanzas', icon: 'chart' } };
    // OJO: debe ir antes de '/admin/planes' — startsWith también matchearía esta ruta
    if (path.startsWith('/admin/planes-activos')) return { title: 'Planes activos', back: '/admin' };
    if (path.startsWith('/admin/reservar')) return { title: 'Hacer reserva', back: '/admin' };
    if (path.startsWith('/admin/deudores')) return { title: 'Deudores', back: '/admin' };
    if (path.startsWith('/admin/planes')) return {
      title: 'Planes',
      action: { label: 'Nuevo', action: 'crear-plan' },
    };
    if (path.startsWith('/admin/configuracion')) return { title: 'Configuración' };
  }

  // Rutas app usuario
  if (variant === 'app') {
    if (path === '/app') return { title: '' };
    if (path.startsWith('/app/horarios')) return { title: 'Horarios', action: { label: 'Mis reservas', action: 'editar-reservas', icon: 'calendar' } };
    if (path.startsWith('/app/asistencias')) return { title: 'Scoring' };
    if (path.startsWith('/app/pagos')) return { title: 'Pagos' };
    if (path.startsWith('/app/perfil')) return { title: 'Perfil' };
    if (path.startsWith('/app/recorrido')) return { title: 'Mi Recorrido' };
  }

  // Rutas acudiente
  if (variant === 'acudiente') {
    if (path === '/acudiente') return { title: '' };
    if (path.startsWith('/acudiente/horarios')) return { title: 'Horarios', action: { label: 'Reservas', action: 'editar-reservas', icon: 'calendar' } };
    if (path.startsWith('/acudiente/perfil')) return { title: 'Perfil' };
  }

  // Rutas coach
  if (variant === 'coach') {
    if (path.startsWith('/coach/semana')) return { title: 'Semana' };
    if (path.startsWith('/coach/alumnos')) return { title: 'Alumnos' };
    if (path.startsWith('/coach/perfil')) return { title: 'Perfil' };
    return { title: '' }; // /coach (Hoy) → muestra el chip COACH
  }

  return { title: '' };
}

function Shell({ user, variant, children }: Props) {
  const setUser = useAuth((s) => s.setUser);
  const authUser = useAuth((s) => s.user) ?? user;
  const fire = useUiActions((s) => s.fire);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  // getHeaderConfig/isActive dependen de window.location → en SSR no existe. Para
  // evitar mismatch de hidratación, en el primer render (server + cliente) usamos
  // un header neutro y recién tras montar calculamos el real.
  const header = mounted ? getHeaderConfig(variant) : { title: '' };
  const isDashboard = !header.title; // sin título = home/dashboard

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const roleLabel: Record<string, string> = { app: 'Miembro', coach: 'Coach', admin: 'Admin', acudiente: 'Acudiente' };

  // Doble perfil: en el header del dashboard el chip de rol se convierte en un
  // switch para cambiar de espacio (cliente↔acudiente, admin↔coach).
  const esClienteAcudiente = authUser.rol === 'user' && !authUser.esAcudiente && !!authUser.tieneMenores;
  const esAdminCoach = authUser.rol === 'super_admin' && !!authUser.esCoach;
  const spaceSwitch: { href: string; label: string; activo: boolean; activeClass: string }[] | null =
    esClienteAcudiente && (variant === 'app' || variant === 'acudiente')
      ? [
          { href: '/app', label: 'Cliente', activo: variant === 'app', activeClass: 'bg-primary text-primary-foreground' },
          { href: '/acudiente', label: 'Acudiente', activo: variant === 'acudiente', activeClass: 'bg-pink-500 text-white' },
        ]
      : esAdminCoach && (variant === 'admin' || variant === 'coach')
        ? [
            { href: '/admin', label: 'Admin', activo: variant === 'admin', activeClass: 'bg-purple-500 text-white' },
            { href: '/coach', label: 'Coach', activo: variant === 'coach', activeClass: 'bg-green-500 text-white' },
          ]
        : null;
  const showSpaceSwitch = isDashboard && !!spaceSwitch;

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 border-b border-border bg-background/90 backdrop-blur-md"
        style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(56px + env(safe-area-inset-top))' }}
      >

        {/* Izquierda: logo (dashboard) | flecha+título (sección con back) | título solo */}
        {isDashboard ? (
          showSpaceSwitch && spaceSwitch ? (
            <div className="flex items-center h-8 rounded-full bg-card border border-border p-0.5">
              {spaceSwitch.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  className={`px-3 h-7 rounded-full text-[11px] font-semibold flex items-center transition-colors ${
                    s.activo ? s.activeClass : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
              {roleLabel[variant] ?? variant}
            </span>
          )
        ) : header.back ? (
          <a href={header.back} className="flex items-center gap-1 text-base font-bold hover:text-primary transition-colors">
            <ChevronLeft size={20} className="text-muted-foreground" />
            {header.title}
          </a>
        ) : (
          <h1 className="text-base font-bold">{header.title}</h1>
        )}

        {/* Derecha: acción contextual + notificaciones + logout */}
        <div className="flex items-center gap-2">
          {(header.actions ?? (header.action ? [header.action] : [])).map((a) => (
            <button
              key={a.action}
              onClick={() => fire(a.action)}
              className="flex items-center gap-1 px-3 h-8 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              {a.icon === 'calendar' ? <Calendar size={13} /> : a.icon === 'chart' ? <BarChart2 size={13} /> : a.icon !== 'settings' ? <Plus size={13} /> : null}
              {a.label}
            </button>
          ))}
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

      <main
        className={`flex-1 px-4 py-5 w-full mx-auto pb-28 ${
          variant === 'admin' ? 'max-w-7xl' : 'max-w-5xl'
        }`}
      >
        {children}
      </main>

      <BottomNav variant={variant} mounted={mounted} />

      <VangBubble />

      {authUser.rol === 'user' && !authUser.terminosAceptados && (
        <TermsModal onAccepted={() => setUser({ ...authUser, terminosAceptados: true })} />
      )}

      <PushPromptModal open={showPushPrompt} onClose={() => setShowPushPrompt(false)} />
      <PwaInstallBanner />
    </div>
  );
}

export function AppPage({ user, variant, children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell user={user} variant={variant}>
        {children}
      </Shell>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ duration: 4500 }}
      />
    </QueryClientProvider>
  );
}
