import { AppPage } from './shared/AppPage';
import type { SessionUser } from '@/lib/auth-store';
import { UserDashboard } from './user/UserDashboard';
import { SchedulePicker } from './user/SchedulePicker';
import { ScoringView } from './user/ScoringView';
import { PaymentsView } from './user/PaymentsView';
import { CoachDashboard } from './coach/CoachDashboard';
import { AdminDashboard } from './admin/AdminDashboard';
import { UsersAdmin } from './admin/UsersAdmin';

const VIEWS = {
  'user/home': { variant: 'app' as const, render: () => <UserDashboard /> },
  'user/horarios': { variant: 'app' as const, render: () => <SchedulePicker /> },
  'user/scoring': { variant: 'app' as const, render: () => <ScoringView /> },
  'user/pagos': { variant: 'app' as const, render: () => <PaymentsView /> },
  'coach/home': { variant: 'coach' as const, render: () => <CoachDashboard /> },
  'admin/home': { variant: 'admin' as const, render: () => <AdminDashboard /> },
  'admin/users': { variant: 'admin' as const, render: () => <UsersAdmin /> },
} as const;

export type ViewKey = keyof typeof VIEWS;

export default function Entry({ view, user }: { view: ViewKey; user: SessionUser }) {
  const v = VIEWS[view];
  return <AppPage user={user} variant={v.variant}>{v.render()}</AppPage>;
}
