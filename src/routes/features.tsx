import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicStats } from "@/lib/public-stats.functions";
import { PublicFooter } from "./about";
import logo from "@/assets/hamro-rent-logo.jpeg";
import {
  ArrowRight, Calculator, Users, Calendar, Zap, Receipt, Share2,
  Download, BarChart3, Shield, Clock, CheckCircle2, Menu, X,
  Building2, Banknote, FileText, CreditCard, Bell, Lock,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Hamro Rent | Billing Tools for Nepali Landlords" },
      { name: "description", content: "Bikram Sambat bills, per-unit electricity calculation, carry-forward balances, WhatsApp-shareable receipts, Excel export." },
      { property: "og:title", content: "Features — Hamro Rent" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: FeaturesPage,
});

function PublicNav({ active }: { active: "about" | "features" | "home" }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Hamro Rent" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20" />
          <span className="font-display text-lg font-bold tracking-tight">Hamro Rent</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <Link to="/" className={active === "home" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>Home</Link>
          <Link to="/features" className={active === "features" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>Features</Link>
          <Link to="/about" className={active === "about" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"}>About</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/login"><Button size="sm" className="rounded-full px-5">Get started</Button></Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-md hover:bg-accent">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background/95 px-4 py-4 flex flex-col gap-4 text-sm">
          <Link to="/" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/features" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">Features</Link>
          <Link to="/about" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">About</Link>
        </div>
      )}
    </header>
  );
}

const FEATURE_GROUPS = [
  {
    group: "Billing", icon: <Receipt className="h-5 w-5" />, color: "bg-orange-50 text-orange-600 border-orange-100",
    features: [
      { icon: <Calendar className="h-5 w-5" />, title: "Bikram Sambat Native", body: "Every bill is created in a BS month — Baisakh through Chaitra. No Gregorian conversion needed anywhere. Supports BS 2080 to 2090.", badge: "Core" },
      { icon: <Zap className="h-5 w-5" />, title: "Smart Electricity Calculation", body: "Two modes: per-unit (enter previous and current meter reading, select rate slab) or direct amount. Previous month's reading carries forward automatically.", badge: "Unique" },
      { icon: <Calculator className="h-5 w-5" />, title: "Auto-Calculated Totals", body: "Rent + electricity + water + carry-forward balance + any additional charges — all summed instantly. No manual addition, no errors.", badge: "Core" },
      { icon: <Clock className="h-5 w-5" />, title: "Carry-Forward Balances", body: "If a tenant paid रू 9,500 but owed रू 10,000, the रू 500 due automatically appears in next month's bill. Overpayments create credits the same way.", badge: "Unique" },
      { icon: <FileText className="h-5 w-5" />, title: "Additional Charges", body: "Add custom line items to any bill — maintenance fees, internet charges, parking, or anything else. Each charge has a label and amount." },
    ],
  },
  {
    group: "Tenants", icon: <Users className="h-5 w-5" />, color: "bg-blue-50 text-blue-600 border-blue-100",
    features: [
      { icon: <Users className="h-5 w-5" />, title: "Full Tenant Profiles", body: "Name, room number, phone, move-in date (BS), notes, and document attachments. Complete payment and bill history per tenant." },
      { icon: <Building2 className="h-5 w-5" />, title: "Base Rent & Default Water", body: "Set a default rent and water charge per tenant. These auto-fill every new bill — you only enter what actually changed.", badge: "Saves time" },
      { icon: <Bell className="h-5 w-5" />, title: "Billed / Not Billed View", body: "One page shows exactly which active tenants have and haven't been billed for the selected BS month. One-click to create the missing bill." },
    ],
  },
  {
    group: "Payments", icon: <Banknote className="h-5 w-5" />, color: "bg-green-50 text-green-600 border-green-100",
    features: [
      { icon: <CreditCard className="h-5 w-5" />, title: "Multiple Payment Methods", body: "Record payments as cash, bank transfer, eSewa, Khalti, or other. Each payment logs the method, date (BS), amount, and optional note." },
      { icon: <CheckCircle2 className="h-5 w-5" />, title: "Partial Payment Tracking", body: "A tenant paid half this month? Mark the partial payment, the remaining balance is clearly shown. Pay in multiple installments." },
      { icon: <BarChart3 className="h-5 w-5" />, title: "Collection Dashboard", body: "See total expected, collected, and outstanding for the current BS month at a glance. Collection rate bar, month-over-month comparison." },
    ],
  },
  {
    group: "Sharing & Export", icon: <Share2 className="h-5 w-5" />, color: "bg-purple-50 text-purple-600 border-purple-100",
    features: [
      { icon: <Share2 className="h-5 w-5" />, title: "WhatsApp-Ready Bill Links", body: "Every bill generates a unique public URL. Send it on WhatsApp — your tenant opens a clean, mobile-friendly bill page with no login required.", badge: "Popular" },
      { icon: <Download className="h-5 w-5" />, title: "Excel Export", body: "Export a full summary for any period — 3 sheets: monthly summary, tenant overview, and full payment ledger." },
    ],
  },
  {
    group: "Security", icon: <Shield className="h-5 w-5" />, color: "bg-slate-50 text-slate-600 border-slate-100",
    features: [
      { icon: <Lock className="h-5 w-5" />, title: "Private to Your Account", body: "Your tenants, bills, and payments are protected by row-level security. No one else can see your data. Export your full ledger anytime." },
    ],
  },
];

function FeaturesPage() {
  const fn = useServerFn(getPublicStats);
  const { data, isLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });

  const fmt = (n: number) => (n > 0 ? `${n}+` : "Growing");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="features" />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-16 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 -translate-x-1/3 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-8">
            Built for Nepal's real workflow
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mb-6">
            Every feature you need —{" "}
            <span className="text-primary">none you don't.</span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
            Hamro Rent is designed around the actual workflow of a Nepali landlord. BS calendar, NEA electricity rates, carry-forward balances, WhatsApp-friendly receipts.
          </p>
          <div className="flex flex-wrap gap-6 sm:gap-10">
            {[
              { label: "Landlords using Hamro Rent", value: isLoading ? "…" : fmt(data?.landlords ?? 0) },
              { label: "Active tenants tracked", value: isLoading ? "…" : fmt(data?.tenants ?? 0) },
              { label: "BS calendar coverage", value: "2080–2090" },
            ].map((s) => (
              <div key={s.label}>
                <div className={`font-display text-2xl sm:text-3xl text-primary transition-all ${isLoading ? "opacity-40" : ""}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature groups */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 space-y-16">
        {FEATURE_GROUPS.map((group) => (
          <div key={group.group}>
            <div className="flex items-center gap-3 mb-7">
              <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${group.color}`}>{group.icon}</div>
              <h2 className="font-display text-2xl sm:text-3xl">{group.group}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {group.features.map((f) => (
                <Card key={f.title} className="p-5 sm:p-6 hover:border-primary/30 hover:shadow-md transition-all group relative">
                  {f.badge && (
                    <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wide">{f.badge}</span>
                  )}
                  <div className="h-9 w-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">{f.icon}</div>
                  <div className="font-display text-lg mb-2">{f.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl mb-5">All of this — completely free.</h2>
          <p className="text-background/70 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            No subscription. No credit card. No feature locks. Every landlord gets every feature.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login">
              <Button size="lg" className="rounded-full px-8 h-12 shadow-lg shadow-primary/30">
                Get started free <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link to="/about">
              <button className="h-12 px-6 rounded-full border border-background/20 text-sm font-medium hover:bg-background/10 transition-colors">
                Read our story
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
