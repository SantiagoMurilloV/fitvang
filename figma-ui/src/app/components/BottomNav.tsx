import { Home, Calendar, QrCode, CreditCard, User, Users, DollarSign, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

interface BottomNavProps {
  type: 'user' | 'admin';
}

export const BottomNav = ({ type }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userItems: NavItem[] = [
    { icon: Home, label: 'Inicio', path: '/user' },
    { icon: Calendar, label: 'Horarios', path: '/user/horarios' },
    { icon: QrCode, label: 'Asistencias', path: '/user/asistencias' },
    { icon: CreditCard, label: 'Pagos', path: '/user/pagos' },
    { icon: User, label: 'Perfil', path: '/user/perfil' },
  ];

  const adminItems: NavItem[] = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Calendar, label: 'Clases', path: '/admin/clases' },
    { icon: DollarSign, label: 'Pagos', path: '/admin/pagos' },
    { icon: Settings, label: 'Config', path: '/admin/config' },
  ];

  const items = type === 'user' ? userItems : adminItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[rgba(255,255,255,0.06)] px-2 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-[390px] mx-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 min-w-[60px] transition-colors"
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'text-[#3DC4DB]' : 'text-[#888888]'}`}
                strokeWidth={1.5}
              />
              {isActive && (
                <span className="text-[10px] font-semibold text-[#3DC4DB]">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
