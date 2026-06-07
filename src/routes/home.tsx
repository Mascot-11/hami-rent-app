import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { initDemoStore, clearDemoStore, getDemoStore } from "@/lib/demo-data";
import {
  Home, Users, FileText, TrendingUp, ArrowRight, CheckCircle,
  Zap, Shield, Globe, Play, X, ChevronDown, Star,
} from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Hamro Rent — Nepal's #1 Rental Management App for Landlords" },
      { name: "description", content: "Manage tenants, bills and payments in Bikram Sambat. Auto-calculate electricity, water & rent. Used by landlords across Nepal. Free to start." },
      { name: "keywords", content: "hamro rent, Nepal rental management, landlord app Nepal, BS calendar billing, tenant management Nepal, rent tracking app" },
      { property: "og:title", content: "Hamro Rent — Nepal's #1 Landlord App" },
      { property: "og:description", content: "Auto-calculate rent, electricity & water bills in Nepali calendar (BS). Track payments, export reports, share bills via link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
      { name: "language", content: "en, ne" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: FileText,
    title: "Smart BS Billing",
    desc: "Bills in Bikram Sambat calendar with automatic electricity unit calculations, water charges, and carry-forward credits.",
    color: "from-terracotta/20 to-amber/10",
  },
  {
    icon: Users,
    title: "Tenant Management",
    desc: "Add, archive, and track all your tenants. Room numbers, move-in dates, contact info — all in one place.",
    color: "from-emerald/20 to-teal/10",
  },
  {
    icon: TrendingUp,
    title: "Live Dashboard",
    desc: "Monthly summaries, collection rates, and outstanding balances at a glance. Know your numbers instantly.",
    color: "from-blue/20 to-indigo/10",
  },
  {
    icon: Globe,
    title: "Shareable Bills",
    desc: "Send a secure link to any tenant so they can view their bill — no app needed on their side.",
    color: "from-violet/20 to-purple/10",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    desc: "Your data is yours. Encrypted in transit, backed up, and never shared. Export anytime as JSON.",
    color: "from-rose/20 to-pink/10",
  },
  {
    icon: Zap,
    title: "Instant Calculations",
    desc: "Enter meter readings — the app calculates electricity. Enter rent — the total builds itself. Zero math.",
    color: "from-yellow/20 to-orange/10",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Add Your Tenants",
    desc: "Create a profile for each tenant — name, room number, move-in date in BS. Takes 30 seconds.",
  },
  {
    step: "02",
    title: "Create Monthly Bills",
    desc: "Select the BS month, enter meter readings and rent. The app calculates electricity, water, extras automatically.",
  },
  {
    step: "03",
    title: "Record Payments",
    desc: "Mark payments as cash, eSewa, Khalti or bank transfer. Partial payments tracked with carry-forward logic.",
  },
  {
    step: "04",
    title: "Share & Export",
    desc: "Send a link to your tenant for their bill. Export full reports to Excel for your records.",
  },
];

const TESTIMONIALS = [
  {
    name: "Hari Bahadur K.",
    role: "Landlord, Lalitpur",
    text: "I used to spend hours every month calculating electricity units. Now it takes 5 minutes for all 6 rooms.",
    stars: 5,
  },
  {
    name: "Sita Devi M.",
    role: "Property Owner, Bhaktapur",
    text: "The shareable bill link is brilliant. My tenants see exactly what they owe without me calling them.",
    stars: 5,
  },
  {
    name: "Prakash T.",
    role: "House Owner, Pokhara",
    text: "Finally an app that uses Nepali calendar. I don't have to convert dates anymore.",
    stars: 5,
  },
];

function LandingPage() {
  const nav = useNavigate();
  const [demoActive, setDemoActive] = useState(!!getDemoStore());
  const [videoOpen, setVideoOpen] = useState(false);

  const startDemo = () => {
    initDemoStore();
    setDemoActive(true);
    nav({ to: "/demo/dashboard" });
  };

  const clearDemo = () => {
    clearDemoStore();
    setDemoActive(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">Hamro Rent</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-1">हाम्रो रेन्ट</span>
          </div>
          <div className="flex items-center gap-2">
            {demoActive && (
              <button
                onClick={clearDemo}
                className="hidden sm:flex items-center gap-1.5 text-xs text-warning-foreground bg-warning/20 border border-warning/40 rounded-full px-3 py-1.5 hover:bg-warning/30 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear demo
              </button>
            )}
            <button
              onClick={() => nav({ to: "/login" })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign in
            </button>
            <button
              onClick={() => nav({ to: "/login" })}
              className="text-sm bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors font-medium"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Background texture */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-amber-50/30" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-300/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs text-primary font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Nepal's rental management, simplified
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
            Stop doing rent math<br />
            <span className="text-primary">by hand every month</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Hamro Rent auto-calculates electricity units, water bills, and carry-forward credits using the{" "}
            <strong className="text-foreground">Nepali Bikram Sambat calendar</strong>.
            Built for Nepali landlords managing rooms and flats.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            <button
              onClick={() => nav({ to: "/login" })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-7 py-3.5 text-base font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={startDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-border rounded-xl px-7 py-3.5 text-base font-medium hover:bg-accent transition-all"
            >
              <Play className="h-4 w-4 fill-current" />
              {demoActive ? "Continue demo" : "Try live demo"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Free to use · No credit card · Demo data clears after 3 days
          </p>
        </div>

        {/* Mock UI Preview */}
        <div className="max-w-4xl mx-auto px-4 mt-14">
          <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
            {/* Fake browser chrome */}
            <div className="bg-muted/60 border-b border-border px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 mx-4 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground">
                app.hamrorent.com/dashboard
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="p-4 sm:p-6 bg-background">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-5 w-32 bg-primary/20 rounded-full mb-1" />
                  <div className="h-3 w-20 bg-muted rounded-full" />
                </div>
                <div className="h-8 w-24 bg-primary rounded-lg" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Expected", val: "Rs 47,300", color: "bg-primary/10 text-primary" },
                  { label: "Collected", val: "Rs 34,030", color: "bg-success/10 text-success" },
                  { label: "Outstanding", val: "Rs 13,270", color: "bg-warning/10 text-warning" },
                  { label: "Collection", val: "72%", color: "bg-info/10 text-info" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-3 ${s.color} border border-current/10`}>
                    <div className="text-xs font-medium opacity-70 mb-1">{s.label}</div>
                    <div className="text-base sm:text-lg font-display font-bold">{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { name: "Ramesh Sharma", room: "101", amount: "Rs 14,030", status: "paid" },
                  { name: "Sunita Rai", room: "102", amount: "Rs 12,600", status: "partial" },
                  { name: "Bikash Thapa", room: "201", amount: "Rs 17,915", status: "pending" },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold">
                        {t.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">Room {t.room}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.amount}</span>
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        t.status === "paid" ? "bg-success/15 text-success" :
                        t.status === "partial" ? "bg-warning/15 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground">Simple enough to start in under 2 minutes</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-border -translate-x-6 z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-4xl font-display font-bold text-primary/20 mb-3">{step.step}</div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Everything you need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built specifically for the way Nepali landlords operate — no unnecessary complexity
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all group">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Loved by landlords</h2>
            <p className="text-muted-foreground">Across the Kathmandu Valley and beyond</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-5 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO CTA ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-amber-50 border border-primary/20 p-10 sm:p-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              See it before you commit
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              The live demo is fully interactive — add tenants, create bills, record payments.
              Demo data is stored locally and clears after 3 days automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={startDemo}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-7 py-3.5 font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Play className="h-4 w-4 fill-current" />
                {demoActive ? "Continue demo →" : "Launch live demo"}
              </button>
              <button
                onClick={() => nav({ to: "/login" })}
                className="flex items-center justify-center gap-2 border border-border rounded-xl px-7 py-3.5 font-medium hover:bg-card transition-all"
              >
                Create free account
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" />No signup needed for demo</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" />Fully interactive</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" />Clears after 3 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Home className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold">Hamro Rent</span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-muted-foreground">
                Developed by{" "}
                <a
                  href="https://www.shreeyushdhungana.com.np/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Shreeyush Dhungana
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">© 2026 Hamro Rent Technologies · Made in Nepal 🇳🇵</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
