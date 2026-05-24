import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';

export const Clases = () => {
  const [selectedDay, setSelectedDay] = useState(0);

  const days = [
    { day: 'LUN', date: '19' },
    { day: 'MAR', date: '20' },
    { day: 'MIE', date: '21' },
    { day: 'JUE', date: '22' },
    { day: 'VIE', date: '23' },
    { day: 'SAB', date: '24' },
  ];

  const classes = [
    {
      time: '6:00 AM',
      name: 'Fuerza Funcional',
      coach: 'Coach Vang',
      duration: '60 min',
      capacity: 12,
      level: 'Intermedio',
      active: true,
    },
    {
      time: '8:00 AM',
      name: 'HIIT Quema Total',
      coach: 'Coach Daniela',
      duration: '45 min',
      capacity: 12,
      level: 'Avanzado',
      active: true,
    },
    {
      time: '5:00 PM',
      name: 'Entrenamiento Dirigido',
      coach: 'Coach Vang',
      duration: '60 min',
      capacity: 15,
      level: 'Todos los niveles',
      active: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Clases</h1>
          <Button size="small">+ Nueva clase</Button>
        </div>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                selectedDay === index
                  ? 'bg-[#3DC4DB] text-white'
                  : 'bg-[#1A1A1A] text-[#888888] hover:text-white'
              }`}
            >
              {day.day} {day.date}
            </button>
          ))}
        </div>

        {/* Classes list */}
        <div className="space-y-3">
          {classes.map((cls, index) => (
            <Card key={index}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-[#3DC4DB]">{cls.time}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">{cls.name}</h3>
                    <p className="text-xs text-[#888888] mb-3">
                      {cls.coach} | {cls.duration}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-[#888888]">Cupo: </span>
                        <span className="text-white font-semibold">{cls.capacity}</span>
                      </div>
                      <div>
                        <span className="text-[#888888]">Nivel: </span>
                        <span className="text-white font-semibold">{cls.level}</span>
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={cls.active} />
                    <div className="w-11 h-6 bg-[#888888] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3DC4DB]"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222222] text-[#888888] hover:text-white text-xs font-semibold transition-colors flex-1 justify-center">
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222222] text-[#FF6B6B] hover:text-white text-xs font-semibold transition-colors flex-1 justify-center">
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
