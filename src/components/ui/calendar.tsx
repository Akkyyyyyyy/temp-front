
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = Omit<
  React.ComponentProps<typeof DayPicker>,
  "mode" | "selected" | "onSelect"
> & {
  mode?: "range";
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
};

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [hoverRange, setHoverRange] = React.useState<DateRange | undefined>();

  const handleDayClick = (day: Date) => {
    if (!range?.from) {
      setRange({ from: day, to: undefined });
    } else if (range.from && !range.to && day > range.from) {
      setRange({ ...range, to: day });
      setHoverRange(undefined);
    } else {
      setRange({ from: day, to: undefined });
      setHoverRange(undefined);
    }
  };

  const handleDayMouseEnter = (day: Date) => {
    if (range?.from && !range.to) {
      setHoverRange({ from: range.from, to: day });
    }
  };

  const handleDayMouseLeave = () => {
    if (range?.from && !range.to) {
      setHoverRange(undefined);
    }
  };

  return (
    <DayPicker
      mode="range"
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      selected={range}
      onSelect={setRange}
      onDayClick={handleDayClick}
      onDayMouseEnter={handleDayMouseEnter}
      onDayMouseLeave={handleDayMouseLeave}
      modifiers={{ hoverRange }}
      modifiersClassNames={{
        hoverRange: "bg-accent/90 text-accent-foreground",
      }}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-90",
        day_disabled: "text-muted-foreground opacity-50",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";
export { Calendar };
