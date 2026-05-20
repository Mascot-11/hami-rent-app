import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { listTenants } from "@/lib/tenants.functions";
import { listBills, saveBill } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { BSMonthPicker } from "@/components/BSMonthPicker";
import { approxCurrentBS, bsLabel } from "@/lib/bs-calendar";
import { computeBillTotal, computeElectricity, computePaid, computeRemaining, fmtNPR, type ElectricityMode } from "@/lib/calc";
import { Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bills/new")({
  head: () => ({ meta: [{ title: "New bill — Hamro Rent" }] }),
  component: NewBillPage,
});

function NewBillPage() {
  const nav = useNavigate();
  const tenantsFn = useServerFn(listTenants);
  const billsFn = useServerFn(listBills);
  const saveFn = useServerFn(saveBill);
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: () => tenantsFn() });

  const cur = approxCurrentBS();
  const [tenantId, setTenantId] = useState("");
  const [year, setYear] = useState(cur.year);
  const [month, setMonth] = useState(cur.month);
  const [rent, setRent] = useState("");
  const [water, setWater] = useState("0");
  const [mode, setMode] = useState<ElectricityMode>("direct");
  const [prev, setPrev] = useState("");
  const [curr, setCurr] = useState("");
  const [rate, setRate] = useState("");
  const [svc, setSvc] = useState("0");
  const [direct, setDirect] = useState("");
  const [carry, setCarry] = useState("0");
  const [notes, setNotes] = useState("");
  const [charges, setCharges] = useState<{ label: string; amount: string; auto?: boolean }[]>([]);

  const { data: priorBills = [] } = useQuery({
    queryKey: ["bills", tenantId],
    queryFn: () => billsFn({ data: { tenant_id: tenantId } }),
    enabled: !!tenantId,
  });

  // Compute net outstanding (debit) or credit from prior bills (excluding this same month).
  const priorSummary = useMemo(() => {
    let debit = 0; // unpaid balance from prior bills
    let credit = 0; // overpayment from prior bills
    for (const b of priorBills as any[]) {
      if (b.bs_year === year && b.bs_month === month) continue;
      // Only consider bills strictly BEFORE current selected month
      if (b.bs_year > year || (b.bs_year === year && b.bs_month >= month)) continue;
      const total = computeBillTotal(b, b.additional_charges ?? []);
      const paid = computePaid(b.payments ?? []);
      const rem = total - paid;
      if (rem > 0) debit += rem;
      else if (rem < 0) credit += -rem;
    }
    const net = debit - credit; // positive = owed, negative = credit
    return { debit, credit, net };
  }, [priorBills, year, month]);

  // Auto-fill previous balance line + carry-forward credit whenever tenant/month changes.
  useEffect(() => {
    if (!tenantId) return;
    setCharges((prev) => {
      // Remove any previous auto-injected balance line
      const cleaned = prev.filter((c) => !c.auto);
      if (priorSummary.net > 0.005) {
        return [{ label: "Previous balance due", amount: String(Math.round(priorSummary.net * 100) / 100), auto: true }, ...cleaned];
      }
      return cleaned;
    });
    if (priorSummary.net < -0.005) {
      setCarry(String(Math.round(-priorSummary.net * 100) / 100));
    } else if (priorSummary.net > 0) {
      setCarry("0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, year, month, priorSummary.net]);

  const billObj = {
    rent_this_month: Number(rent) || 0,
    water_bill: Number(water) || 0,
    electricity_mode: mode,
    electricity_prev_reading: Number(prev) || 0,
    electricity_curr_reading: Number(curr) || 0,
    electricity_rate_snapshot: Number(rate) || 0,
    electricity_service_charge: Number(svc) || 0,
    electricity_direct_amount: Number(direct) || 0,
    carry_forward_credit: Number(carry) || 0,
  };
  const chargeRows = charges.filter((c) => c.label.trim() && Number(c.amount) > 0)
    .map((c, i) => ({ id: String(i), label: c.label, amount: Number(c.amount) }));
  const elec = computeElectricity(billObj);
  const total = computeBillTotal(billObj, chargeRows);

  const submit = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Pick a tenant");
      if (Number(rent) < 0) throw new Error("Rent cannot be negative");
      if (mode === "per_unit") {
        if (Number(curr) < Number(prev)) throw new Error("Current reading must be ≥ previous reading");
        if (!rate) throw new Error("Rate per unit is required");
      }
      for (const c of charges) {
        if (c.label.trim() && Number(c.amount) <= 0) throw new Error(`Charge "${c.label}" must have an amount > 0`);
        if (!c.label.trim() && c.amount) throw new Error("Additional charge label cannot be blank");
      }
      if ((priorBills as any[]).some((b) => b.bs_year === year && b.bs_month === month)) {
        throw new Error(`A bill already exists for ${bsLabel(year, month)}`);
      }
      if (!rent || Number(rent) === 0) {
        if (!confirm("Rent is 0 for this month. Continue?")) throw new Error("Cancelled");
      }
      return saveFn({
        data: {
          tenant_id: tenantId, bs_year: year, bs_month: month,
          rent_this_month: Number(rent) || 0,
          water_bill: Number(water) || 0,
          electricity_mode: mode,
          electricity_prev_reading: mode === "per_unit" ? Number(prev) : null,
          electricity_curr_reading: mode === "per_unit" ? Number(curr) : null,
          electricity_rate_snapshot: mode === "per_unit" ? Number(rate) : null,
          electricity_service_charge: Number(svc) || 0,
          electricity_direct_amount: mode === "direct" ? Number(direct) : null,
          carry_forward_credit: Number(carry) || 0,
          notes: notes.trim() || null,
          charges: chargeRows.map((c) => ({ label: c.label, amount: c.amount })),
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Bill created");
      nav({ to: "/bills/$billId", params: { billId: res.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-display">New bill</h1>

      <Card className="p-5 space-y-4">
        <div>
          <FieldLabel help={HELP.billTenant} required>Tenant</FieldLabel>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
            <SelectContent>
              {tenants.filter((t: any) => t.is_active).map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name} — Room {t.room_number ?? "—"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FieldLabel help={HELP.billMonth} required>Bill month (BS)</FieldLabel>
          <BSMonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><FieldLabel help={HELP.rent} required>Rent (NPR)</FieldLabel>
            <Input type="number" min="0" value={rent} onChange={(e) => setRent(e.target.value)} /></div>
          <div><FieldLabel help={HELP.water}>Water (NPR)</FieldLabel>
            <Input type="number" min="0" value={water} onChange={(e) => setWater(e.target.value)} /></div>
        </div>
      </Card>

      {tenantId && (priorSummary.debit > 0 || priorSummary.credit > 0) && (
        <Card className="p-4 bg-accent/30 border-primary/30 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm space-y-1 flex-1">
            <div className="flex items-center gap-1.5 font-medium">
              Previous balance detected
              <HelpTip text={HELP.previousDue} label="Previous balance" />
            </div>
            {priorSummary.debit > 0 && <div>Unpaid from earlier bills: <strong>{fmtNPR(priorSummary.debit)}</strong></div>}
            {priorSummary.credit > 0 && <div>Overpayment carried as credit: <strong>{fmtNPR(priorSummary.credit)}</strong></div>}
            <div className="text-muted-foreground">Auto-applied below. You can edit or remove the line.</div>
          </div>
        </Card>
      )}

      <Card className="p-5 space-y-3">
        <FieldLabel help={HELP.electricityMode} required>Electricity</FieldLabel>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as ElectricityMode)} className="flex gap-6">
          <div className="flex items-center gap-2"><RadioGroupItem value="per_unit" id="m1" /><Label htmlFor="m1">Per unit</Label><HelpTip text="Calculate from meter readings × rate." label="Per unit" /></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="direct" id="m2" /><Label htmlFor="m2">Direct amount</Label><HelpTip text="Enter a flat NPR figure (e.g. NEA bill)." label="Direct" /></div>
        </RadioGroup>
        {mode === "per_unit" ? (
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel help={HELP.electricityPrev}>Previous reading</FieldLabel><Input type="number" value={prev} onChange={(e) => setPrev(e.target.value)} /></div>
            <div><FieldLabel help={HELP.electricityCurr}>Current reading</FieldLabel><Input type="number" value={curr} onChange={(e) => setCurr(e.target.value)} /></div>
            <div><FieldLabel help={HELP.electricityRate}>Rate / unit (NPR)</FieldLabel><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
            <div><FieldLabel help={HELP.electricityService}>Service charge (NPR)</FieldLabel><Input type="number" value={svc} onChange={(e) => setSvc(e.target.value)} /></div>
          </div>
        ) : (
          <div><FieldLabel help={HELP.electricityDirect}>Amount (NPR)</FieldLabel><Input type="number" value={direct} onChange={(e) => setDirect(e.target.value)} /></div>
        )}
        <p className="text-sm text-muted-foreground">Electricity: {fmtNPR(elec)}</p>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel help={HELP.additionalCharges}>Additional charges</FieldLabel>
          <Button type="button" variant="outline" size="sm" onClick={() => setCharges([...charges, { label: "", amount: "" }])}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </div>
        {charges.map((c, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input placeholder="Label (e.g. Internet)" value={c.label} onChange={(e) => {
                const copy = [...charges]; copy[i] = { ...copy[i], label: e.target.value, auto: false }; setCharges(copy);
              }} />
              {c.auto && <p className="text-xs text-primary mt-1">Auto-added from previous balance · edit or remove if needed</p>}
            </div>
            <Input type="number" placeholder="Amount" className="w-32" value={c.amount} onChange={(e) => {
              const copy = [...charges]; copy[i] = { ...copy[i], amount: e.target.value, auto: false }; setCharges(copy);
            }} />
            <Button type="button" variant="ghost" size="icon" onClick={() => setCharges(charges.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      <Card className="p-5 space-y-3">
        <div><FieldLabel help={HELP.carryForward}>Carry-forward credit (NPR)</FieldLabel>
          <Input type="number" min="0" value={carry} onChange={(e) => setCarry(e.target.value)} /></div>
        <div><FieldLabel help={HELP.billNotes}>Notes</FieldLabel>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
      </Card>

      <Card className="p-5 bg-accent/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5">Bill total <HelpTip text={HELP.billTotal} label="Total" /></span>
          <span className="text-2xl font-display">{fmtNPR(total)}</span>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
          {submit.isPending ? "Saving…" : "Create bill"}
        </Button>
        <Link to="/dashboard"><Button variant="outline">Cancel</Button></Link>
      </div>
    </div>
  );
}
