import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Search, Plus } from 'lucide-react';

export const Usuarios = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Todos', count: 47 },
    { id: 'active', label: 'Al día', count: 39 },
    { id: 'pending', label: 'Pendientes', count: 4 },
    { id: 'inactive', label: 'Inactivos', count: 4 },
  ];

  const users = [
    {
      initials: 'CM',
      name: 'Carlos Mejía',
      plan: 'Plan Full',
      status: 'active',
      lastSession: 'Hoy',
    },
    {
      initials: 'AL',
      name: 'Andrés López',
      plan: 'Plan Full',
      status: 'pending',
      lastPayment: 'Último pago vence hoy',
    },
    {
      initials: 'MR',
      name: 'María Ruiz',
      plan: 'Plan Full',
      status: 'overdue',
      info: 'Vencido hace 3 días',
    },
    {
      initials: 'LG',
      name: 'Laura Gómez',
      plan: 'Plan Básico',
      status: 'active',
      lastSession: 'Ayer',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Al día</Badge>;
      case 'pending':
        return <Badge variant="alert">Pendiente</Badge>;
      case 'overdue':
        return <Badge variant="alert">Vencido</Badge>;
      default:
        return <Badge variant="neutral">Inactivo</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-5">
        {/* Header */}
        <h1 className="text-xl font-semibold text-white">Usuarios</h1>

        {/* Search */}
        <Input icon={Search} placeholder="Buscar por nombre..." />

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-[#3DC4DB] text-white'
                  : 'bg-[#1A1A1A] text-[#888888] hover:text-white'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Users list */}
        <div className="space-y-2">
          {users.map((user, index) => (
            <Card key={index} className="cursor-pointer hover:bg-[#222222] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3DC4DB] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-white">{user.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{user.name}</p>
                    <p className="text-xs text-[#888888] mb-2">{user.plan}</p>
                    <p className="text-[11px] text-[#888888]">
                      {user.lastSession && `Última sesión: ${user.lastSession}`}
                      {user.lastPayment && user.lastPayment}
                      {user.info && user.info}
                    </p>
                  </div>
                </div>
                {getStatusBadge(user.status)}
              </div>
            </Card>
          ))}
        </div>

        {/* Floating add button */}
        <button className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#3DC4DB] flex items-center justify-center shadow-lg hover:bg-[#2FB5C8] transition-colors">
          <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
