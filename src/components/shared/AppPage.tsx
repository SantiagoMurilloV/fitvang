import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, type ReactNode } from 'react';
import { queryClient } from '@/lib/query';
import { registerPush } from '@/lib/push';
import { useAuth, type SessionUser } from '@/lib/auth-store';
import { NotificationBell } from './NotificationBell';

interface Props {
  user: SessionUser;
  variant: 'app' | 'coach' | 'admin';
  children: ReactNode;
}

function Shell({ user, variant, children }: Props) {
  const setUser = useAuth((s) => s.setUser);
  useEffect(() => {
    setUser(user);
    registerPush().catch(() => {});
  }, [user, setUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 border-b border-border bg-background/80 backdrop-blur">
        <a href="/" className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-primary">FIT VANG</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
            {variant}
          </span>
        </a>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() =>
              fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).then(() => (window.location.href = '/'))
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 max-w-5xl w-full mx-auto pb-24">{children}</main>
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
