import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BS_MONTHS, bsYearOptions, daysInBSMonth } from "@/lib/bs-calendar";

interface BSMonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  disabled?: boolean;
}

export function BSMonthPicker({ year, month, onChange, disabled }: BSMonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const years = bsYearOptions();
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  function prevYear() {
    if (viewYear > minYear) setViewYear(viewYear - 1);
  }

  function nextYear() {
    if (viewYear < maxYear) setViewYear(viewYear + 1);
  }

  function selectMonth(m: number) {
    onChange(viewYear, m);
    setOpen(false);
  }

  const label = `${BS_MONTHS[month - 1]} ${year}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-[200px] justify-start gap-2 font-normal"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={prevYear}
            disabled={viewYear <= minYear}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{viewYear} BS</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={nextYear}
            disabled={viewYear >= maxYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {BS_MONTHS.map((name, i) => {
            const m = i + 1;
            const isSelected = viewYear === year && m === month;
            const days = daysInBSMonth(viewYear, m);
            return (
              <button
                key={name}
                onClick={() => selectMonth(m)}
                className={`
                  flex flex-col items-center justify-center rounded-md px-1 py-2 text-xs transition-colors
                  ${isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-accent hover:text-accent-foreground text-foreground"
                  }
                `}
              >
                <span className="font-medium">{name}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {days}d
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick year jump */}
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-1 justify-center">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setViewYear(y)}
              className={`
                text-xs px-2 py-0.5 rounded transition-colors
                ${y === viewYear
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-accent text-muted-foreground"
                }
              `}
            >
              {y}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
