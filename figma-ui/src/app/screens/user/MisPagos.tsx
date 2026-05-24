import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Check } from 'lucide-react';

export const MisPagos = () => {
  const payments = [
    { month: 'Mayo 2026', description: 'Plan Full - mensualidad', amount: '$280.000', date: '15 May', status: 'paid' },
    { month: 'Abril 2026', description: 'Plan Full - mensualidad', amount: '$280.000', date: '15 Abr', status: 'paid' },
    { month: 'Marzo 2026', description: 'Plan Full - mensualidad', amount: '$280.000', date: '15 Mar', status: 'paid' },
    { month: 'Febrero 2026', description: 'Inscripción + primer mes', amount: '$380.000', date: '8 Feb', status: 'paid' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-6">
        {/* Header */}
        <h1 className="text-xl font-semibold text-white">Mis pagos</h1>

        {/* Plan activo */}
        <Card withBorder borderColor="#3DC4DB">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">Plan Full</span>
              <Badge variant="success">Al día</Badge>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">$280.000 / mes</p>
              <p className="text-xs text-[#888888]">Renovación automática</p>
            </div>
            <div className="space-y-2">
              <div className="h-1 bg-[#333333] rounded-full overflow-hidden">
                <div className="h-full w-[57%] bg-[#3DC4DB] rounded-full" />
              </div>
              <p className="text-[13px] text-[#888888]">Próximo cobro: 15 Jun 2026</p>
            </div>
          </div>
        </Card>

        {/* Resumen del mes */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            RESUMEN DEL MES
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-bold text-[#3DC4DB] mb-1">18</p>
              <p className="text-[11px] text-[#888888]">de 22 disponibles</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-white mb-1">$15.556</p>
              <p className="text-[11px] text-[#888888]">este mes</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-white mb-1">Feb 2026</p>
              <p className="text-[11px] text-[#888888]">4 meses activo</p>
            </Card>
          </div>
        </div>

        {/* Historial */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            HISTORIAL
          </p>
          <div className="space-y-2">
            {payments.map((payment, index) => (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3DC4DB] flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{payment.month}</p>
                      <p className="text-xs text-[#888888]">{payment.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white mb-1">{payment.amount}</p>
                    <p className="text-[11px] text-[#888888]">{payment.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Download button */}
        <Button variant="secondary" className="w-full">
          Descargar recibo
        </Button>
      </div>
    </div>
  );
};
