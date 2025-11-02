import React from 'react';
import { Button } from '@/components/ui/button'; // adjust import path as needed

export type TimeView = 'day' | 'week' | 'month';

interface TimeViewToggleProps {
  timeView: any;
  setTimeView: (view: any) => void;
  views?: TimeView[];
  className?: string;
  selectedDay: any;
  setSelectedDay: (day: any) => void;
  selectedMonth: any;
  setSelectedMonth: (month: any) => void;
  selectedYear: any;
  setSelectedYear: (year: any) => void;
}

export const TimeViewToggle: React.FC<TimeViewToggleProps> = ({
  timeView,
  setTimeView,
  views = ['day', 'week', 'month'],
  className = '',
  selectedDay,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear
}) => {
  const handleTimeViewChange = (view: TimeView) => {
  if (view === 'day') {
    // If switching to day view and any date parameter is missing, set current date
    if (!selectedDay || !selectedMonth || !selectedYear) {
      const currentDate = new Date();
      setSelectedDay(currentDate.getDate());
      setSelectedMonth(currentDate.getMonth() + 1);
      setSelectedYear(currentDate.getFullYear());
    } else {
      setSelectedDay(selectedDay);
      setSelectedMonth(selectedMonth);
      setSelectedYear(selectedYear);
    }
  } 

  setTimeView(view);
};

  const getSliderPosition = () => {
    const index = views.indexOf(timeView);
    if (index === -1) return 'left-1';
    return `left-1 translate-x-[${index * 100}%]`;
  };

  const getSliderWidth = () => {
    return `w-[calc(${100 / views.length}% - 0.5rem)]`;
  };

  return (
    <div className={`w-full border border-gray-700 rounded-full bg-muted sm:w-fit ${className}`}>
      <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border shadow-sm relative">
        <div
          className={`
            absolute bg-primary rounded-full shadow-sm transition-all duration-300 ease-in-out
            ${getSliderPosition()}
            ${getSliderWidth()} h-[calc(100%-8px)] 
          `}
        />

        {views.map((view) => (
          <button
            key={view}
            onClick={() => handleTimeViewChange(view)}
            className={`
              relative capitalize px-6 py-1.5 text-sm rounded-full transition-all duration-300
              z-10 min-w-[80px] justify-center font-semibold h-8
              ${timeView === view
                ? 'text-primary-foreground bg-studio-gold'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};