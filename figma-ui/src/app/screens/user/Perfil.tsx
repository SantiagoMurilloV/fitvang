import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ChevronRight, Bell, User, CreditCard, Calendar, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';

export const Perfil = () => {
  const navigate = useNavigate();

  const handleMenuClick = (label: string) => {
    if (label === 'Cerrar sesión') {
      navigate('/');
    } else if (label === 'Historial de asistencia') {
      navigate('/user/asistencias');
    } else if (label === 'Método de pago') {
      navigate('/user/pagos');
    }
  };

  const menuItems = [
    { icon: Bell, label: 'Notificaciones', color: 'text-[#888888]' },
    { icon: User, label: 'Datos personales', color: 'text-[#888888]' },
    { icon: CreditCard, label: 'Método de pago', color: 'text-[#888888]' },
    { icon: Calendar, label: 'Historial de asistencia', color: 'text-[#888888]' },
    { icon: HelpCircle, label: 'Soporte', color: 'text-[#888888]' },
    { icon: LogOut, label: 'Cerrar sesión', color: 'text-[#FF6B6B]' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 py-6">
          <div className="w-[72px] h-[72px] rounded-full bg-[#3DC4DB] flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-white">CM</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Carlos Mejía</h1>
            <p className="text-[13px] text-[#888888]">Miembro desde Feb 2026</p>
          </div>
          <Button variant="secondary" size="small">
            Editar perfil
          </Button>
        </div>

        {/* Estadísticas */}
        <Card>
          <div className="grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.06)]">
            <div className="text-center px-2">
              <p className="text-[28px] font-bold text-[#3DC4DB] mb-1">72</p>
              <p className="text-[11px] text-[#888888]">sesiones totales</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[28px] font-bold text-white mb-1">82%</p>
              <p className="text-[11px] text-[#888888]">asistencia</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[28px] font-bold text-white mb-1">12</p>
              <p className="text-[11px] text-[#888888]">racha actual</p>
            </div>
          </div>
        </Card>

        {/* Mi plan */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            MI PLAN
          </p>
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-white">Plan Full</span>
                <Badge variant="success">Al día</Badge>
              </div>
              <Button variant="secondary" size="small">
                Cambiar plan
              </Button>
            </div>
            <p className="text-sm text-[#888888]">$280.000 / mes</p>
          </Card>
        </div>

        {/* Opciones */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            OPCIONES
          </p>
          <Card className="p-0 overflow-hidden">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(item.label)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#222222] transition-colors border-b border-[rgba(255,255,255,0.06)] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
                  <span className={`text-sm ${item.color === 'text-[#FF6B6B]' ? 'text-[#FF6B6B]' : 'text-white'}`}>
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#888888]" />
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};
