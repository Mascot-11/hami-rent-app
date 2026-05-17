import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BS_MONTHS, bsYearOptions } from "@/lib/bs-calendar";

interface BSMonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  disabled?: boolean;
}

export function BSMonthPicker({ year, month, onChange, disabled }: BSMonthPickerProps) {
  const years = bsYearOptions();
  return (
    <div className="flex gap-2">
      <Select
        disabled={disabled}
        value={String(month)}
        onValueChange={(v) => onChange(year, Number(v))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {BS_MONTHS.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        disabled={disabled}
        value={String(year)}
        onValueChange={(v) => onChange(Number(v), month)}
      >
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
