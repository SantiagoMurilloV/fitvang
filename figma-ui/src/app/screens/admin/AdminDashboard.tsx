import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router';
import logoText from '../../../imports/WhatsApp_Image_2026-05-18_at_14.42.33.jpeg';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const todayClasses = [
    { time: '6:00 AM', name: 'Fuerza Funcional', attendance: 10, capacity: 12, coach: 'Coach Vang' },
    { time: '8:00 AM', name: 'HIIT Quema Total', attendance: 12, capacity: 12, coach: 'Coach Daniela' },
    { time: '5:00 PM', name: 'Entrenamiento Dirigido', attendance: 6, capacity: 15, coach: 'Coach Vang' },
  ];

  const pendingPayments = [
    { name: 'Andrés López', amount: '$280.000', status: 'Vence hoy' },
    { name: 'María Ruiz', amount: '$280.000', status: 'Vencido 3 días' },
    { name: 'Juan Torres', amount: '$180.000', status: 'Vencido 5 días' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <img
            src={logoText}
            alt="FitVang"
            className="h-8 object-contain"
          />
          <button className="relative p-2">
            <Bell className="w-6 h-6 text-[#888888]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B6B] rounded-full" />
          </button>
        </div>
        <p className="text-[13px] text-[#888888] mb-6">Hoy, 17 Mayo 2026</p>

        {/* Stats del día */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-[28px] font-bold text-[#3DC4DB] mb-1">32</p>
            <p className="text-[11px] text-[#888888]">check-ins hoy</p>
          </Card>
          <Card className="text-center">
            <p className="text-[28px] font-bold text-[#FF6B6B] mb-1">4</p>
            <p className="text-[11px] text-[#888888]">pagos pendientes</p>
          </Card>
          <Card className="text-center">
            <p className="text-[28px] font-bold text-white mb-1">47</p>
            <p className="text-[11px] text-[#888888]">usuarios activos</p>
          </Card>
        </div>

        {/* Clases de hoy */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            CLASES DE HOY
          </p>
          <div className="space-y-3">
            {todayClasses.map((cls, index) => {
              const percentage = (cls.attendance / cls.capacity) * 100;
              const isFull = cls.attendance === cls.capacity;

              return (
                <Card key={index}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">
                          {cls.time} - {cls.name}
                        </p>
                        <p className="text-xs text-[#888888]">{cls.coach}</p>
                      </div>
                      {isFull && (
                        <span className="text-xs font-semibold text-[#3DC4DB]">LLENO</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[#888888]">
                          {cls.attendance}/{cls.capacity}
                        </span>
                        <span className="text-xs text-[#888888]">{Math.round(percentage)}%</span>
                      </div>
                      <div className="h-1 bg-[#333333] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3DC4DB] rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Pagos pendientes */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            PAGOS PENDIENTES
          </p>
          <Card withBorder borderColor="#FF6B6B" className="space-y-3">
            {pendingPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-white">{payment.name}</p>
                  <p className="text-xs text-[#888888]">{payment.status}</p>
                </div>
                <p className="text-sm font-semibold text-white">{payment.amount}</p>
              </div>
            ))}
            <Button
              variant="secondary"
              className="w-full mt-2"
              size="small"
              onClick={() => navigate('/admin/pagos')}
            >
              Ver todos los pagos
            </Button>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-3">
          <Button className="w-full" onClick={() => navigate('/admin/clases')}>
            Gestionar clases
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/admin/usuarios')}>
            Ver usuarios
          </Button>
        </div>
      </div>
    </div>
  );
};
