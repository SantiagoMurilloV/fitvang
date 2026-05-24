import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Asistencias = () => {
  const [selectedMonth, setSelectedMonth] = useState('Mayo 2026');

  const monthData = {
    attendance: [
      [0, 0, 0, 0, 1, 2, 3],
      [4, 5, 0, 7, 8, 0, 10],
      [11, 12, 0, 14, 15, 0, 17],
      [18, 0, 20, 21, 22, 0, 24],
      [25, 26, 0, 28, 29, 0, 31],
    ],
    completed: 18,
    total: 22,
    percentage: 82,
    streak: 12,
  };

  const recentSessions = [
    { date: 'Vie 16 May', time: '5:00 PM', class: 'Fuerza Funcional' },
    { date: 'Jue 15 May', time: '6:00 AM', class: 'HIIT Quema Total' },
    { date: 'Mie 14 May', time: '7:00 PM', class: 'Movilidad' },
    { date: 'Mar 13 May', time: '5:00 PM', class: 'Entrenamiento Dirigido' },
    { date: 'Lun 12 May', time: '6:00 AM', class: 'Fuerza Funcional' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-5 pt-4 pb-24">
      <div className="max-w-[390px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Mi asistencia</h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1A1A] text-[#888888] hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-white">{selectedMonth}</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1A1A1A] text-[#888888] hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendario */}
        <Card>
          <div className="space-y-3">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                <div key={i} className="text-center text-xs text-[#888888] font-semibold">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            {monthData.attendance.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => {
                  const hasAttendance = day > 0 && day <= 22;
                  const isToday = day === 16;

                  return (
                    <div
                      key={dayIndex}
                      className={`aspect-square flex items-center justify-center rounded-full text-sm ${
                        hasAttendance
                          ? 'bg-[#3DC4DB] text-white font-semibold'
                          : isToday
                          ? 'border-2 border-[#3DC4DB] text-white font-semibold'
                          : day > 0
                          ? 'text-[#888888]'
                          : 'text-[#333333]'
                      }`}
                    >
                      {day > 0 ? day : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#3DC4DB] mb-1">{monthData.completed}</p>
              <p className="text-xs text-[#888888]">sesiones completadas</p>
              <p className="text-[10px] text-[#666666]">de {monthData.total}</p>
            </div>
            <div className="text-center border-l border-r border-[rgba(255,255,255,0.06)] px-2">
              <p className="text-2xl font-bold text-white mb-1">{monthData.percentage}%</p>
              <p className="text-xs text-[#888888]">tasa de asistencia</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-1">{monthData.streak}</p>
              <p className="text-xs text-[#888888]">racha actual</p>
              <p className="text-[10px] text-[#666666]">días</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#888888]">Meta: 90%</span>
              <span className="text-[#888888]">{monthData.percentage}%</span>
            </div>
            <div className="relative h-2 bg-[#333333] rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-[#3DC4DB] rounded-full transition-all"
                style={{ width: `${monthData.percentage}%` }}
              />
              <div className="absolute top-0 left-[90%] w-px h-full bg-[#888888]" />
            </div>
          </div>
        </Card>

        {/* Detalle del mes */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
            DETALLE DEL MES
          </p>
          <div className="space-y-2">
            {recentSessions.map((session, index) => (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">
                      {session.date} - {session.time}
                    </p>
                    <p className="text-xs text-[#888888]">{session.class}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#3DC4DB] flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      strokeWidth="3"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
