import { Card } from '../../components/ui/Card';
import { ChevronRight } from 'lucide-react';

export const Config = () => {
  const sections = [
    { label: 'Configuración del gimnasio', items: ['Horarios de apertura', 'Datos del negocio', 'Políticas'] },
    { label: 'Notificaciones', items: ['Push notifications', 'Email', 'SMS'] },
    { label: 'Sistema', items: ['Respaldo de datos', 'Usuarios admin', 'Logs'] },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-6">
        {/* Header */}
        <h1 className="text-xl font-semibold text-white">Configuración</h1>

        {/* Sections */}
        {sections.map((section, index) => (
          <div key={index}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
              {section.label}
            </p>
            <Card className="p-0 overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#222222] transition-colors border-b border-[rgba(255,255,255,0.06)] last:border-b-0"
                >
                  <span className="text-sm text-white">{item}</span>
                  <ChevronRight className="w-5 h-5 text-[#888888]" />
                </button>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
