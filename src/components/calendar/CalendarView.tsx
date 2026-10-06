import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Truck,
  RotateCcw,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Rental, Equipment, MaintenanceLog, WorkspaceLocation } from '../../types';

interface CalendarViewProps {
  rentals: Rental[];
  equipmentList: Equipment[];
  maintenanceLogs: MaintenanceLog[];
  locations: WorkspaceLocation[];
  onSelectRental: (r: Rental) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  rentals,
  equipmentList,
  maintenanceLogs,
  locations,
  onSelectRental,
}) => {
  const { t, formatCurrency, formatDate } = useI18n();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEqId, setSelectedEqId] = useState<string>('all');

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month days generation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // Starting day offset (Monday = 1)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    // Previous month pad
    for (let i = startDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false, key: d.toISOString() });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true, key: d.toISOString() });
    }

    // Next month pad to complete rows of 7
    while (days.length % 7 !== 0) {
      const nextDate = new Date(year, month + 1, days.length - lastDay.getDate() - startDayOfWeek + 1);
      days.push({ date: nextDate, isCurrentMonth: false, key: nextDate.toISOString() });
    }

    return days;
  }, [currentDate]);

  const monthTitle = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const now = new Date();

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.nav.calendar}</h1>
          <p className="text-xs text-stone-500">
            Planning interactif des sorties, retours et indisponibilités
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-200 bg-stone-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'month' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'day' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
              }`}
            >
              Jour
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigation & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-md border border-stone-200 hover:bg-stone-50 text-stone-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-stone-200 hover:bg-stone-50 text-stone-700"
          >
            Aujourd'hui
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-md border border-stone-200 hover:bg-stone-50 text-stone-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="font-bold text-stone-900 text-sm capitalize ml-2">{monthTitle}</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border border-stone-200 p-1 bg-white text-stone-700 outline-none"
          >
            <option value="all">Toutes catégories</option>
            <option value="construction">BTP & Outillage</option>
            <option value="events">Événementiel</option>
            <option value="audiovisual">Audiovisuel</option>
            <option value="cleaning">Nettoyage</option>
            <option value="gardening">Jardinage</option>
          </select>

          <select
            value={selectedEqId}
            onChange={(e) => setSelectedEqId(e.target.value)}
            className="rounded border border-stone-200 p-1 bg-white text-stone-700 outline-none max-w-[180px] truncate"
          >
            <option value="all">Tous les matériels</option>
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-stone-500 font-semibold text-[11px] text-center py-2.5">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mer</div>
          <div>Jeu</div>
          <div>Ven</div>
          <div>Sam</div>
          <div>Dim</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-stone-100 text-xs">
          {monthDays.map((dayObj) => {
            const isToday =
              dayObj.date.getDate() === now.getDate() &&
              dayObj.date.getMonth() === now.getMonth() &&
              dayObj.date.getFullYear() === now.getFullYear();

            // Find events for this day
            const dStart = new Date(dayObj.date);
            dStart.setHours(0, 0, 0, 0);
            const dEnd = new Date(dayObj.date);
            dEnd.setHours(23, 59, 59, 999);

            const dayRentals = rentals.filter((r) => {
              if (r.bookingStatus === 'cancelled' || r.bookingStatus === 'declined') return false;
              if (selectedEqId !== 'all' && !r.lines.some((l) => l.equipmentId === selectedEqId))
                return false;

              const rStart = new Date(r.startDate);
              const rEnd = new Date(r.endDate);
              return rStart <= dEnd && rEnd >= dStart;
            });

            // Find maintenance for this day
            const dayMaintenance = maintenanceLogs.filter((m) => {
              if (m.status === 'resolved') return false;
              if (selectedEqId !== 'all' && m.equipmentId !== selectedEqId) return false;
              const mStart = new Date(m.startDate);
              const mEnd = new Date(m.expectedCompletionDate);
              return mStart <= dEnd && mEnd >= dStart;
            });

            return (
              <div
                key={dayObj.key}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                  !dayObj.isCurrentMonth
                    ? 'bg-stone-50/50 text-stone-300'
                    : isToday
                    ? 'bg-emerald-50/20'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      isToday
                        ? 'bg-[#1E4D38] text-white'
                        : dayObj.isCurrentMonth
                        ? 'text-stone-800'
                        : 'text-stone-400'
                    }`}
                  >
                    {dayObj.date.getDate()}
                  </span>

                  {(dayRentals.length > 0 || dayMaintenance.length > 0) && (
                    <span className="text-[10px] text-stone-400 font-medium">
                      {dayRentals.length + dayMaintenance.length} op.
                    </span>
                  )}
                </div>

                {/* Event badges inside cell */}
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {dayRentals.slice(0, 2).map((rental) => {
                    const isOverdue =
                      (rental.fulfillmentStatus === 'checked_out' ||
                        rental.fulfillmentStatus === 'partially_picked_up') &&
                      new Date(rental.endDate) < now;

                    return (
                      <div
                        key={rental.id}
                        onClick={() => onSelectRental(rental)}
                        className={`cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                          isOverdue
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : rental.fulfillmentStatus === 'checked_out'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                        title={`${rental.referenceNumber} - ${rental.lines.map((l) => l.equipmentName).join(', ')}`}
                      >
                        {isOverdue && '⚠️ '}
                        {rental.referenceNumber} · {rental.lines[0]?.equipmentName.slice(0, 12)}
                      </div>
                    );
                  })}

                  {dayMaintenance.slice(0, 1).map((m) => (
                    <div
                      key={m.id}
                      className="truncate rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[10px] font-medium"
                      title={`Maintenance: ${m.equipmentName}`}
                    >
                      🔧 {m.equipmentName.slice(0, 14)}
                    </div>
                  ))}

                  {dayRentals.length + dayMaintenance.length > 3 && (
                    <div className="text-[9px] text-stone-400 pl-1">
                      +{dayRentals.length + dayMaintenance.length - 2} autres...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
