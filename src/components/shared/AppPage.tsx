import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, type ReactNode } from 'react';
import { queryClient } from '@/lib/query';
import { registerPush } from '@/lib/push';
import { useAuth, type SessionUser } from '@/lib/auth-store';
import { NotificationBell } from './NotificationBell';
import { PushPromptModal } from './PushPromptModal';

interface Props {
  user: SessionUser;
  variant: 'app' | 'coach' | 'admin';
  children: ReactNode;
}

function Shell({ user, variant, children }: Props) {
  const setUser = useAuth((s) => s.setUser);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    setUser(user);

    // Show the prompt before registering if permission is still default
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      setTimeout(() => setShowPushPrompt(true), 1500);
    } else {
      registerPush().catch(() => {});
    }
  }, [user, setUser]);

  // Also check permission on mount with a delay (handles cases where the
  // effect above fires before the component is fully painted)
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 border-b border-border bg-background/80 backdrop-blur">
        <a href="/" className="flex items-center gap-2">
          <img src="/icons/logo.png" alt="Fitvang" className="h-8 w-auto object-contain" />
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
