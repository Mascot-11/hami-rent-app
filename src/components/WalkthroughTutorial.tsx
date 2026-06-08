import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, CreditCard, Share2, LayoutDashboard,
  X, ChevronRight, CheckCircle2, ArrowRight, Sparkles,
  Receipt, Plus, Banknote, Bell,
} from "lucide-react";

const STORAGE_KEY = "hamrorent_tutorial_done_v2";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboarding() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setActive(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
  };

  return { active, dismiss };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function WalkthroughTutorial() {
  const { active, dismiss } = useOnboarding();
  const [step, setStep] = useState<Step>(0);
  const [leaving, setLeaving] = useState(false);
  const nav = useNavigate();

  if (!active) return null;

  const goTo = (next: Step) => {
    setLeaving(true);
    setTimeout(() => { setStep(next); setLeaving(false); }, 220);
  };

  const next = () => {
    if (step < 4) goTo((step + 1) as Step);
    else { dismiss(); nav({ to: "/dashboard" }); }
  };

  const skip = () => dismiss();

  const goAndDismiss = (to: string) => { dismiss(); nav({ to: to as any }); };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Getting started</span>
        </div>

        {/* Step pills */}
        <div className="hidden sm:flex items-center gap-1.5">
          {(["Welcome", "Tenants", "Bills", "Payments", "Share"] as const).map((label, i) => (
            <button
              key={i}
              onClick={() => goTo(i as Step)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : i < step
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {i < step ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3.5 w-3.5 rounded-full border text-[10px] flex items-center justify-center font-bold border-current">{i + 1}</span>}
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={skip}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour <X className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${leaving ? "opacity-0" : "opacity-100"}`}>
        {step === 0 && <StepWelcome onNext={next} onSkip={skip} />}
        {step === 1 && <StepTenants onNext={next} onSkip={skip} onGo={() => goAndDismiss("/tenants")} />}
        {step === 2 && <StepBills onNext={next} onSkip={skip} onGo={() => goAndDismiss("/bills/new")} />}
        {step === 3 && <StepPayments onNext={next} onSkip={skip} onGo={() => goAndDismiss("/bills")} />}
        {step === 4 && <StepShare onDone={() => { dismiss(); nav({ to: "/dashboard" }); }} onSkip={skip} />}
      </div>

      {/* Bottom bar */}
      <footer className="border-t bg-card px-4 sm:px-8 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 sm:hidden">
          {[0,1,2,3,4].map(i => (
            <button key={i} onClick={() => goTo(i as Step)}
              className={`rounded-full transition-all duration-200 ${i === step ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Step {step + 1} of 5
        </p>
        <div className="flex items-center gap-2 ml-auto">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => goTo((step - 1) as Step)} className="h-8 text-xs">
              Back
            </Button>
          )}
          <Button size="sm" onClick={next} className="h-8 text-xs gap-1.5 px-4">
            {step === 4 ? "Go to Dashboard" : "Next"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const features = [
    { icon: Users, label: "Manage tenants", desc: "Track who rents each room with contact info and move-in dates." },
    { icon: FileText, label: "Generate bills", desc: "Monthly bills in Bikram Sambat — rent, water, electricity auto-calculated." },
    { icon: CreditCard, label: "Record payments", desc: "Log partial or full payments with date and method. Status updates instantly." },
    { icon: Share2, label: "Share receipts", desc: "Send a link or WhatsApp message to your tenant with a clean receipt." },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold">Welcome to Hamro Rent</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          This quick tour will walk you through the core workflow — takes about 2 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map(({ icon: Icon, label, desc }) => (
          <Card key={label} className="p-4 flex gap-3 items-start">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onNext} size="lg" className="gap-2 rounded-full px-8">
          Start the tour <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={onSkip} size="lg" className="text-muted-foreground rounded-full">
          Skip, take me to the app
        </Button>
      </div>
    </div>
  );
}

// ─── Step 1: Tenants ──────────────────────────────────────────────────────────

function StepTenants({ onNext, onSkip, onGo }: { onNext: () => void; onSkip: () => void; onGo: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
      <StepHeader
        step={1}
        icon={Users}
        iconColor="text-blue-600"
        iconBg="bg-blue-500/10"
        title="First, add your tenants"
        subtitle="Each person renting from you gets a tenant record. Bills are always linked to a tenant."
      />

      {/* Visual preview of tenant list */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <span className="text-sm font-semibold">Active (2)</span>
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Plus className="h-3.5 w-3.5" /> Add tenant
          </div>
        </div>
        <div className="divide-y">
          {[
            { name: "Ram Bahadur Shrestha", room: "Room 1A", rent: "Rs 8,000", phone: "9841000001" },
            { name: "Sita Kumari Thapa", room: "Room 2B", rent: "Rs 10,000", phone: "9841000002" },
          ].map((t) => (
            <div key={t.name} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.room} · {t.phone} · Rent: {t.rent}</p>
              </div>
              <div className="flex gap-1">
                <span className="text-xs border rounded px-2 py-0.5 text-muted-foreground">Edit</span>
                <span className="text-xs border rounded px-2 py-0.5 text-muted-foreground">Bills</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <TipItem>Set a <strong>Base Rent</strong> and <strong>Default Water</strong> amount per tenant — these auto-fill every new bill so you don't retype them each month.</TipItem>
        <TipItem>You can add a <strong>move-in date</strong> in Bikram Sambat and <strong>phone number</strong> for WhatsApp receipts.</TipItem>
        <TipItem>Archived tenants are hidden from bills but their history is preserved.</TipItem>
      </div>

      <StepActions
        primaryLabel="Go add tenants now"
        primaryAction={onGo}
        secondaryLabel="Continue tour"
        secondaryAction={onNext}
        skipAction={onSkip}
      />
    </div>
  );
}

// ─── Step 2: Bills ────────────────────────────────────────────────────────────

function StepBills({ onNext, onSkip, onGo }: { onNext: () => void; onSkip: () => void; onGo: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
      <StepHeader
        step={2}
        icon={FileText}
        iconColor="text-amber-600"
        iconBg="bg-amber-500/10"
        title="Create a monthly bill"
        subtitle="Each month, generate a bill for every tenant. The app calculates totals automatically."
      />

      {/* Visual preview of bill form */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <p className="text-sm font-semibold">New bill — Jestha 2082</p>
        </div>
        <div className="px-4 py-3 space-y-3">
          <BillPreviewRow label="Tenant" value="Ram Bahadur Shrestha — Room 1A" />
          <BillPreviewRow label="Rent (pre-filled)" value="Rs 8,000" highlight />
          <BillPreviewRow label="Water" value="Rs 300" />
          <BillPreviewRow label="Electricity (per unit)" value="245 × Rs 13 = Rs 3,185" />
          <div className="border-t pt-3 flex justify-between font-semibold text-sm">
            <span>Total</span>
            <span>Rs 11,485</span>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <TipItem>Bills use <strong>Bikram Sambat</strong> months — no conversion needed. The app knows today's BS date.</TipItem>
        <TipItem>Electricity can be entered as <strong>meter readings × rate</strong> or a <strong>flat amount</strong> (e.g. from NEA).</TipItem>
        <TipItem>If a tenant has an unpaid balance from last month, it's <strong>auto-detected</strong> and added as a line item.</TipItem>
      </div>

      <StepActions
        primaryLabel="Create first bill"
        primaryAction={onGo}
        secondaryLabel="Continue tour"
        secondaryAction={onNext}
        skipAction={onSkip}
      />
    </div>
  );
}

// ─── Step 3: Payments ─────────────────────────────────────────────────────────

function StepPayments({ onNext, onSkip, onGo }: { onNext: () => void; onSkip: () => void; onGo: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
      <StepHeader
        step={3}
        icon={CreditCard}
        iconColor="text-green-600"
        iconBg="bg-green-500/10"
        title="Record payments"
        subtitle="When a tenant pays — in full or partial — log it against their bill. The status updates live."
      />

      {/* Visual preview of payment section */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <span className="text-sm font-semibold">Bill — Jestha 2082</span>
          <span className="text-xs bg-yellow-100 text-yellow-700 font-medium rounded-full px-2 py-0.5">Partial</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">Rs 11,485</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-medium text-green-600">Rs 8,000</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-medium text-red-500">Rs 3,485</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500" style={{ width: "70%" }} />
          </div>
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Recent payments</p>
            <div className="flex justify-between text-xs">
              <span>2082-02-12 · Cash</span>
              <span className="font-medium">Rs 8,000</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <TipItem>Supported payment methods: <strong>Cash, Bank, eSewa, Khalti, Other</strong>.</TipItem>
        <TipItem><strong>Partial payments</strong> are fully supported — pay Rs 5,000 now, the rest next week.</TipItem>
        <TipItem>If a tenant <strong>overpays</strong>, the credit carries forward to the next month automatically.</TipItem>
      </div>

      <StepActions
        primaryLabel="View bills & record a payment"
        primaryAction={onGo}
        secondaryLabel="Continue tour"
        secondaryAction={onNext}
        skipAction={onSkip}
      />
    </div>
  );
}

// ─── Step 4: Share ────────────────────────────────────────────────────────────

function StepShare({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
      <StepHeader
        step={4}
        icon={Share2}
        iconColor="text-purple-600"
        iconBg="bg-purple-500/10"
        title="Share receipts with tenants"
        subtitle="Every bill has a shareable link. Your tenant can view it on any device — no account needed."
      />

      {/* Visual preview of share options */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <p className="text-sm font-semibold">Bill — Jestha 2082 · Ram Bahadur</p>
        </div>
        <div className="px-4 py-4 space-y-2">
          {[
            { icon: Share2, label: "Copy share link", desc: "Tenant opens it in any browser", color: "text-blue-600 bg-blue-50" },
            { icon: Bell, label: "Send via WhatsApp", desc: "Pre-filled message with bill summary", color: "text-green-600 bg-green-50" },
            { icon: Receipt, label: "Download PNG", desc: "Save or print the bill image", color: "text-orange-600 bg-orange-50" },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-accent transition-colors">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <TipItem>The share link is <strong>permanent</strong> — it always shows the latest payment status.</TipItem>
        <TipItem>The <strong>WhatsApp button</strong> pre-fills the tenant's number if you saved their phone.</TipItem>
        <TipItem>Download a <strong>PNG receipt</strong> to save or print — works great for record-keeping.</TipItem>
      </div>

      {/* Completion card */}
      <Card className="p-5 bg-primary/5 border-primary/20 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
        <h3 className="font-semibold text-lg">You're all set!</h3>
        <p className="text-sm text-muted-foreground">
          Start by adding your first tenant, then create a bill for them.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Button onClick={onDone} className="gap-2 rounded-full px-6">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          <Link to="/tenants" onClick={onSkip}>
            <Button variant="outline" className="gap-2 rounded-full px-6 w-full sm:w-auto">
              <Users className="h-4 w-4" /> Add first tenant
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepHeader({ step, icon: Icon, iconColor, iconBg, title, subtitle }: {
  step: number; icon: any; iconColor: string; iconBg: string; title: string; subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Step {step} of 4</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-display font-bold">{title}</h2>
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{subtitle}</p>
    </div>
  );
}

function TipItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

function BillPreviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-medium text-primary" : "font-medium"}>{value}</span>
    </div>
  );
}

function StepActions({ primaryLabel, primaryAction, secondaryLabel, secondaryAction, skipAction }: {
  primaryLabel: string; primaryAction: () => void;
  secondaryLabel: string; secondaryAction: () => void;
  skipAction: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      <Button onClick={primaryAction} className="gap-2 rounded-full px-6 w-full sm:w-auto">
        {primaryLabel} <ArrowRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={secondaryAction} className="gap-2 rounded-full px-6 w-full sm:w-auto">
        {secondaryLabel} <ChevronRight className="h-4 w-4" />
      </Button>
      <button onClick={skipAction} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors mt-1 sm:mt-0 sm:ml-2">
        Skip tour
      </button>
    </div>
  );
}
