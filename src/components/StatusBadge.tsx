import { cn } from "@/lib/utils";
import { HelpTip } from "./HelpTip";
import { HELP } from "@/lib/help-copy";
import type { BillStatus } from "@/lib/calc";

const STYLES: Record<BillStatus, string> = {
  paid: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30",
  partial: "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)] border-[color:var(--warning)]/40",
  pending: "bg-muted text-muted-foreground border-border",
  overpaid: "bg-[color:var(--info)]/15 text-[color:var(--info)] border-[color:var(--info)]/30",
};

const LABELS: Record<BillStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  pending: "Pending",
  overpaid: "Overpaid",
};

const HELPS: Record<BillStatus, string> = {
  paid: HELP.statusPaid,
  partial: HELP.statusPartial,
  pending: HELP.statusPending,
  overpaid: HELP.statusOverpaid,
};

export function StatusBadge({ status, showHelp = true }: { status: BillStatus; showHelp?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", STYLES[status])}>
      {LABELS[status]}
      {showHelp && <HelpTip text={HELPS[status]} label={LABELS[status]} className="h-3 w-3" />}
    </span>
  );
}
