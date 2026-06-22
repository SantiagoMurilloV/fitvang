import { AppPage } from './shared/AppPage';
import { ErrorBoundary } from './shared/ErrorBoundary';
import type { SessionUser } from '@/lib/auth-store';
import { UserDashboard } from './user/UserDashboard';
import { SchedulePicker } from './user/SchedulePicker';
import { ScoringView } from './user/ScoringView';
import { PaymentsView } from './user/PaymentsView';
import { JourneyView } from './user/JourneyView';
import { ProfileView } from './user/ProfileView';
import { CoachDashboard } from './coach/CoachDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { UsersAdmin } from './admin/UsersAdmin';
import { ClassesAdmin } from './admin/ClassesAdmin';
import { PaymentsAdmin } from './admin/PaymentsAdmin';
import { PlansAdmin } from './admin/PlansAdmin';

const VIEWS = {
  'user/home': { variant: 'app' as const, render: () => <UserDashboard /> },
  'user/horarios': { variant: 'app' as const, render: () => <SchedulePicker /> },
  'user/scoring': { variant: 'app' as const, render: () => <ScoringView /> },
  'user/pagos': { variant: 'app' as const, render: () => <PaymentsView /> },
  'user/recorrido': { variant: 'app' as const, render: () => <JourneyView /> },
  'user/perfil': { variant: 'app' as const, render: () => <ProfileView /> },
  'coach/home': { variant: 'coach' as const, render: () => <CoachDashboard /> },
  'admin/home': { variant: 'admin' as const, render: () => <AdminDashboard /> },
  'admin/users': { variant: 'admin' as const, render: () => <UsersAdmin /> },
  'admin/clases': { variant: 'admin' as const, render: () => <ClassesAdmin /> },
  'admin/pagos': { variant: 'admin' as const, render: () => <PaymentsAdmin /> },
  'admin/planes': { variant: 'admin' as const, render: () => <PlansAdmin /> },
} as const;

export type ViewKey = keyof typeof VIEWS;

export default function Entry({ view, user }: { view: ViewKey; user: SessionUser }) {
  const v = VIEWS[view];
  return (
    <ErrorBoundary>
      <AppPage user={user} variant={v.variant}>
        <ErrorBoundary>
          {v.render()}
        </ErrorBoundary>
      </AppPage>
    </ErrorBoundary>
  );
}
