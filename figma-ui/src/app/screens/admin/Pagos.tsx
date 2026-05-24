import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

export const Pagos = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'collected', label: 'Cobrados' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'overdue', label: 'Vencidos' },
  ];

  const payments = [
    {
      name: 'Carlos Mejía',
      plan: 'Plan Full',
      amount: '$280.000',
      date: '15 May 2026',
      status: 'collected',
    },
    {
      name: 'Andrés López',
      plan: 'Plan Full',
      amount: '$280.000',
      date: 'Vence hoy',
      status: 'pending',
    },
    {
      name: 'María Ruiz',
      plan: 'Plan Full',
      amount: '$280.000',
      date: 'Venció 14 May',
      status: 'overdue',
    },
    {
      name: 'Laura Gómez',
      plan: 'Plan Básico',
      amount: '$180.000',
      date: '12 May 2026',
      status: 'collected',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'collected':
        return <Badge variant="success">Cobrado</Badge>;
      case 'pending':
        return <Badge className="bg-[#FFA500] text-white">Pendiente</Badge>;
      case 'overdue':
        return <Badge variant="alert">Vencido</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Pagos</h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1A1A] text-[#888888] hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-white">Mayo 2026</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1A1A] text-[#888888] hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumen del mes */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-2">
            INGRESOS MAYO
          </p>
          <p className="text-[32px] font-bold text-[#3DC4DB] mb-4">$8.940.000</p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-white">32</p>
              <p className="text-xs text-[#888888]">cobrados</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">4</p>
              <p className="text-xs text-[#888888]">pendientes</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">$1.120.000</p>
              <p className="text-xs text-[#888888]">por cobrar</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span>Progreso</span>
              <span>89%</span>
            </div>
            <div className="h-1 bg-[#333333] rounded-full overflow-hidden">
              <div className="h-full w-[89%] bg-[#3DC4DB] rounded-full" />
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeFilter === filter.id
                  ? 'bg-[#3DC4DB] text-white'
                  : 'bg-[#1A1A1A] text-[#888888] hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Payments list */}
        <div className="space-y-2">
          {payments.map((payment, index) => (
            <Card key={index}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{payment.name}</p>
                      <p className="text-xs text-[#888888]">{payment.plan}</p>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm font-semibold text-white">{payment.amount}</p>
                    <p className="text-xs text-[#888888]">{payment.date}</p>
                  </div>
                </div>
                <button className="ml-3 p-1 text-[#888888] hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
