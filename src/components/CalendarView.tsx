import { Button } from "@/components/ui/button";

type TimeView = 'day' | 'month' | 'year';

interface CalendarViewProps {
  timeView: TimeView;
  selectedDay?: number;
  setSelectedDay: (day: number) => void;
  periods: (string | number)[];
}

export function CalendarView({ timeView, selectedDay, setSelectedDay, periods }: CalendarViewProps) {
  return (
    <div className="mb-4">
      <div className="grid grid-cols-[200px_1fr] gap-4">
        <div></div>
        <div className="flex">
          {periods.map((period, index) => {
            const dayOfWeek = timeView === 'day' ? new Date(2024, 7, typeof period === 'number' ? period : 1).toLocaleDateString('en-US', {
              weekday: 'short'
            }) : '';
            const isSelected = timeView === 'day' && selectedDay === period;
            return (
              <div key={index} className="flex-1 text-center">
                <div 
                  className={`text-xs mb-1 p-2 rounded-lg border transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-studio-gold text-studio-dark border-studio-gold font-bold' 
                      : 'text-muted-foreground bg-muted/30 border-border/20 hover:bg-muted/50'
                  }`} 
                  onClick={() => timeView === 'day' && setSelectedDay(period as number)}
                >
                  {timeView === 'day' && <div className="font-medium">{dayOfWeek}</div>}
                  <div className="font-semibold text-sm">{period}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}