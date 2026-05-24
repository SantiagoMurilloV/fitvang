import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Horarios = () => {
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
      title: 'Fuerza Funcional',
      coach: 'Coach Vang',
      duration: '60 min',
      level: 'Nivel intermedio',
      enrolled: 8,
      capacity: 12,
    },
    {
      time: '8:00 AM',
      title: 'HIIT Quema Total',
      coach: 'Coach Daniela',
      duration: '45 min',
      level: 'Nivel avanzado',
      enrolled: 11,
      capacity: 12,
    },
    {
      time: '5:00 PM',
      title: 'Entrenamiento Dirigido',
      coach: 'Coach Vang',
      duration: '60 min',
      level: 'Todos los niveles',
      enrolled: 6,
      capacity: 15,
    },
    {
      time: '7:00 PM',
      title: 'Movilidad y Recuperación',
      coach: 'Coach Laura',
      duration: '45 min',
      level: 'Todos los niveles',
      enrolled: 3,
      capacity: 10,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Horarios</h1>
            <p className="text-[13px] text-[#888888]">Semana del 19 - 24 May</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1A1A] text-[#888888] hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1A1A] text-[#888888] hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
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
          {classes.map((cls, index) => {
            const spotsLeft = cls.capacity - cls.enrolled;
            const isAlmostFull = spotsLeft <= 2;

            return (
              <Card key={index}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-semibold text-[#3DC4DB]">{cls.time}</span>
                  <Badge variant={isAlmostFull ? 'alert' : 'neutral'}>
                    {spotsLeft} cupo{spotsLeft !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{cls.title}</h3>
                <p className="text-xs text-[#888888] mb-4">
                  {cls.coach} | {cls.duration} | {cls.level}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-[#3DC4DB] border-2 border-[#1A1A1A] flex items-center justify-center"
                        >
                          <span className="text-[10px] text-white font-semibold">A</span>
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-[#888888]">
                      {cls.enrolled}/{cls.capacity} inscritos
                    </span>
                  </div>
                  <Button size="small">Reservar</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
