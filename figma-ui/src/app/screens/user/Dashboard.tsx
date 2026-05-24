import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar, QrCode, CreditCard, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import brainLogo from '../../../imports/WhatsApp_Image_2026-05-18_at_14.42.50.jpeg';

export const Dashboard = () => {
  const navigate = useNavigate();
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const attendance = [true, true, false, true, true, false, false];

  const quickAccess = [
    { icon: Calendar, label: 'Horarios', subtitle: 'Ver clases', path: '/user/horarios' },
    { icon: QrCode, label: 'Asistencias', subtitle: 'Ver historial', path: '/user/asistencias' },
    { icon: CreditCard, label: 'Mis pagos', subtitle: 'Ver historial', path: '/user/pagos' },
    { icon: TrendingUp, label: 'Mi progreso', subtitle: 'Ver estadísticas', path: '/user/asistencias' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white mb-1">Hola, Carlos</h1>
            <p className="text-sm text-[#888888]">¿Listo para entrenar hoy?</p>
          </div>
          <img
            src={brainLogo}
            alt="FitVang"
            className="w-12 h-12 object-contain"
          />
        </div>

        {/* Próxima clase */}
        <Card withBorder borderColor="#3DC4DB" className="bg-gradient-to-r from-[#1A1A1A] to-[#222222]">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Fuerza Funcional</h3>
                <p className="text-[13px] text-[#888888]">Hoy - 5:00 PM | Coach Vang</p>
              </div>
              <Badge variant="primary">En 2 horas</Badge>
            </div>
            <Button size="small" onClick={() => navigate('/user/horarios')}>
              Reservar cupo
            </Button>
          </div>
        </Card>

        {/* Tu semana */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            ESTA SEMANA
          </p>
          <Card>
            <div className="flex justify-between items-center mb-4">
              {weekDays.map((day, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-[#888888]">{day}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      attendance[index]
                        ? 'bg-[#3DC4DB]'
                        : index === 3
                        ? 'border-2 border-[#3DC4DB] bg-transparent'
                        : 'bg-[#1A1A1A]'
                    }`}
                  >
                    {attendance[index] && (
                      <span className="text-xs text-white font-medium">{index + 13}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-[#888888] text-center">
              4 de 5 sesiones esta semana
            </p>
          </Card>
        </div>

        {/* Accesos rápidos */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            ACCESOS RÁPIDOS
          </p>
          <div className="grid grid-cols-2 gap-3">
            {quickAccess.map((item, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:bg-[#222222] transition-colors"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="w-6 h-6 text-[#3DC4DB] mb-2" strokeWidth={1.5} />
                <p className="text-[13px] font-semibold text-white mb-1">{item.label}</p>
                <p className="text-[11px] text-[#888888]">{item.subtitle}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Estado de cuenta */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Plan Full</span>
              <Badge variant="success">Al día</Badge>
            </div>
          </div>
          <p className="text-xs text-[#888888] mb-3">Próximo cobro: 15 Jun 2026</p>
          <div className="h-1 bg-[#333333] rounded-full overflow-hidden">
            <div className="h-full w-[57%] bg-[#3DC4DB] rounded-full" />
          </div>
        </Card>
      </div>
    </div>
  );
};
