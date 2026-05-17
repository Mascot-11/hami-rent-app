import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HelpTipProps {
  text: string;
  label?: string;
  className?: string;
}

/** Small "?" icon that opens a popover with plain-English help text. */
export function HelpTip({ text, label, className }: HelpTipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ? `Help: ${label}` : "Help"}
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring",
            className,
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-72 text-sm whitespace-pre-line leading-relaxed"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
}

/** Label + HelpTip combo for form fields. */
export function FieldLabel({
  children,
  help,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  help?: string;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-sm font-medium text-foreground"
    >
      <span>
        {children}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {help && <HelpTip text={help} label={typeof children === "string" ? children : undefined} />}
    </label>
  );
}
