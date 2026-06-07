import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getDemoStore, saveDemoStore, type DemoBill, type DemoAdditionalCharge } from "@/lib/demo-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/HelpTip";
import { BSMonthPicker } from "@/components/BSMonthPicker";
import { approxCurrentBS } from "@/lib/bs-calendar";
import { computeBillTotal, computeElectricity, fmtNPR, type ElectricityMode } from "@/lib/calc";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/bills/new")({
  head: () => ({ meta: [{ title: "New Bill (Demo) — Hamro Rent" }] }),
  component: DemoNewBillPage,
});

function newId() {
  return "demo-" + Math.random().toString(36).slice(2, 10);
}

function DemoNewBillPage() {
  const nav = useNavigate();
  const store = getDemoStore()!;
  const cur = approxCurrentBS();

  const tenants = store.tenants.filter((t) => t.is_active);

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
  const [charges, setCharges] = useState<{ label: string; amount: string }[]>([]);

  const draft = useMemo(() => ({
    rent_this_month: Number(rent) || 0,
    water_bill: Number(water) || 0,
    electricity_mode: mode,
    electricity_prev_reading: mode === "per_unit" ? Number(prev) || 0 : null,
    electricity_curr_reading: mode === "per_unit" ? Number(curr) || 0 : null,
    electricity_rate_snapshot: mode === "per_unit" ? Number(rate) || 0 : null,
    electricity_service_charge: mode === "per_unit" ? Number(svc) || 0 : 0,
    electricity_direct_amount: mode === "direct" ? Number(direct) || 0 : null,
    carry_forward_credit: Number(carry) || 0,
  }), [rent, water, mode, prev, curr, rate, svc, direct, carry]);

  const elec = computeElectricity(draft);
  const extraCharges = charges.map((c, i) => ({ id: `extra-${i}`, label: c.label, amount: Number(c.amount) || 0 }));
  const total = computeBillTotal(draft, extraCharges);

  const submit = () => {
    if (!tenantId) { toast.error("Please select a tenant"); return; }
    if (!rent) { toast.error("Rent is required"); return; }
    const bill: DemoBill = {
      id: newId(), tenant_id: tenantId, bs_year: year, bs_month: month,
      ...draft,
      notes: notes || null, created_at: new Date().toISOString(),
      additional_charges: extraCharges,
      payments: [],
    };
    const next = { ...store, bills: [...store.bills, bill] };
    saveDemoStore(next);
    toast.success("Bill created");
    nav({ to: "/demo/dashboard" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display font-bold">New Bill</h1>

      <Card className="p-5 space-y-5">
        <div>
          <FieldLabel required>Tenant</FieldLabel>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger><SelectValue placeholder="Select tenant…" /></SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}{t.room_number ? ` — Room ${t.room_number}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel required>Billing Month (BS)</FieldLabel>
          <BSMonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Rent (NPR)</FieldLabel>
            <Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} placeholder="e.g. 12000" />
          </div>
          <div>
            <FieldLabel>Water (NPR)</FieldLabel>
            <Input type="number" value={water} onChange={(e) => setWater(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div>
          <FieldLabel>Electricity</FieldLabel>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as ElectricityMode)} className="flex gap-4 mt-1">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="direct" id="direct" />
              <Label htmlFor="direct">Direct amount</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="per_unit" id="per_unit" />
              <Label htmlFor="per_unit">Per unit (meter reading)</Label>
            </div>
          </RadioGroup>
        </div>

        {mode === "direct" ? (
          <div>
            <FieldLabel>Electricity Amount (NPR)</FieldLabel>
            <Input type="number" value={direct} onChange={(e) => setDirect(e.target.value)} placeholder="e.g. 1800" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Previous Reading</FieldLabel>
              <Input type="number" value={prev} onChange={(e) => setPrev(e.target.value)} placeholder="e.g. 1200" />
            </div>
            <div>
              <FieldLabel>Current Reading</FieldLabel>
              <Input type="number" value={curr} onChange={(e) => setCurr(e.target.value)} placeholder="e.g. 1340" />
            </div>
            <div>
              <FieldLabel>Rate per unit (NPR)</FieldLabel>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div>
              <FieldLabel>Service charge</FieldLabel>
              <Input type="number" value={svc} onChange={(e) => setSvc(e.target.value)} placeholder="0" />
            </div>
          </div>
        )}

        <div>
          <FieldLabel>Carry-forward credit (NPR)</FieldLabel>
          <Input type="number" value={carry} onChange={(e) => setCarry(e.target.value)} placeholder="0" />
        </div>

        {/* Additional charges */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Additional Charges</FieldLabel>
            <button onClick={() => setCharges([...charges, { label: "", amount: "" }])} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          {charges.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input value={c.label} onChange={(e) => { const n = [...charges]; n[i].label = e.target.value; setCharges(n); }} placeholder="Label" className="flex-1" />
              <Input type="number" value={c.amount} onChange={(e) => { const n = [...charges]; n[i].amount = e.target.value; setCharges(n); }} placeholder="Amount" className="w-28" />
              <button onClick={() => setCharges(charges.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <div>
          <FieldLabel>Notes</FieldLabel>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>

        {/* Total preview */}
        <div className="border-t pt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Rent</span><span>{fmtNPR(Number(rent) || 0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Water</span><span>{fmtNPR(Number(water) || 0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Electricity</span><span>{fmtNPR(elec)}</span>
          </div>
          {extraCharges.map((c) => (
            <div key={c.id} className="flex justify-between text-muted-foreground">
              <span>{c.label || "Extra"}</span><span>{fmtNPR(c.amount)}</span>
            </div>
          ))}
          {Number(carry) > 0 && (
            <div className="flex justify-between text-success">
              <span>Carry-forward credit</span><span>-{fmtNPR(Number(carry))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-1 border-t">
            <span>Total</span><span>{fmtNPR(total)}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={submit} className="flex-1">Create Bill</Button>
        <Button variant="outline" onClick={() => nav({ to: "/demo/dashboard" })}>Cancel</Button>
      </div>
    </div>
  );
}
