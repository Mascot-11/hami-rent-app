import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Hamro Rent" },
      {
        name: "description",
        content:
          "Simple monthly pricing for Nepali landlords. Free for up to 3 tenants. Basic रू150/month, Pro रू300/month. Pay via eSewa, Khalti, bank, or cash.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Hamro Rent Pricing — Monthly plans for landlords" },
      {
        property: "og:description",
        content: "Free for up to 3 tenants. Basic रू150/mo, Pro रू300/mo. No card required.",
      },
    ],
  }),
  component: PricingPage,
});

// ─── Plan definitions ─────────────────────────────────────────────────────────
// Slot counts MUST stay in sync with what the super admin actually grants.
// Monthly pricing; yearly shown as a discounted equivalent (2 months free).
type Plan = {
  name: string;
  monthly: number;
  yearly: number;
  blurb: string;
  featured: boolean;
  cta: string;
  points: string[];
};

const PLANS: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    blurb: "For a single small property.",
    featured: false,
    cta: "Start free",
    points: [
      "3 active tenant slots",
      "Automatic monthly bills in BS calendar",
      "Shareable bill receipts on WhatsApp",
      "Excel export of all your data",
    ],
  },
  {
    name: "Basic",
    monthly: 150,
    yearly: 1500,
    blurb: "For a growing building.",
    featured: true,
    cta: "Choose Basic",
    points: [
      "10 active tenant slots",
      "Everything in Free",
      "Multi-property grouping",
      "Pay via eSewa, Khalti, bank, or cash",
    ],
  },
  {
    name: "Pro",
    monthly: 300,
    yearly: 3000,
    blurb: "For multi-floor & multi-building landlords.",
    featured: false,
    cta: "Choose Pro",
    points: [
      "30 active tenant slots",
      "Everything in Basic",
      "Priority slot activation",
      "Custom plans available on request",
    ],
  },
];

const FAQS = [
  {
    q: "How does billing work?",
    a: "Pick a plan, sign up, and request the upgrade. You pay manually via eSewa, Khalti, bank transfer, or cash. Once payment is confirmed, the admin activates your tenant slots — usually the same day.",
  },
  {
    q: "What is a tenant slot?",
    a: "A slot is one active tenant you can manage. Archiving a tenant frees their slot. Your plan sets how many active tenants you can have at once.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Move up or down anytime. If you downgrade below your active tenant count, archive a few tenants to fit the new limit.",
  },
  {
    q: "Is there a refund if I stop?",
    a: "Plans are prepaid for the period you choose. You keep access until the period ends; there are no automatic charges after that.",
  },
];

function fmt(n: number) {
  return n === 0 ? "रू 0" : `रू ${n.toLocaleString()}`;
}

function PricingPage() {
  const [authed, setAuthed] = useState(false);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const dest = authed ? "/settings" : "/login";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Hamro Rent" className="h-7 w-7 rounded-full object-cover" />
            <span className="font-display text-base font-semibold tracking-tight">Hamro Rent</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-8 text-center">
        <p className="hr-reveal text-xs uppercase tracking-widest text-primary font-medium mb-5 inline-flex items-center gap-1.5 justify-center">
          <Sparkles className="h-3.5 w-3.5" /> Simple monthly pricing
        </p>
        <h1
          className="hr-reveal font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.08] max-w-2xl mx-auto"
          style={{ animationDelay: "60ms" }}
        >
          Pay for the tenants you manage.
        </h1>
        <p
          className="hr-reveal mt-6 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed"
          style={{ animationDelay: "120ms" }}
        >
          Start free for up to 3 tenants. Upgrade when your building grows — no card, no lock-in.
        </p>

        {/* Billing cycle toggle */}
        <div
          className="hr-reveal mt-9 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 text-sm"
          style={{ animationDelay: "180ms" }}
        >
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
                cycle === c
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "monthly" ? "Monthly" : "Yearly"}
              {c === "yearly" && (
                <span className="ml-1.5 text-[10px] uppercase tracking-wide text-primary">
                  2 months free
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {PLANS.map((pl, i) => {
            const price = cycle === "monthly" ? pl.monthly : pl.yearly;
            const note =
              pl.monthly === 0
                ? "forever"
                : cycle === "monthly"
                  ? "per month"
                  : "per year · manual payment";
            return (
              <div
                key={pl.name}
                className={`hr-pop relative rounded-2xl border p-6 flex flex-col bg-background transition-transform duration-200 hover:-translate-y-1 ${
                  pl.featured
                    ? "border-primary shadow-lg ring-1 ring-primary/20"
                    : "border-border hover:shadow-sm"
                }`}
                style={{ animationDelay: `${i * 90 + 120}ms` }}
              >
                {pl.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground rounded-full px-3 py-1 shadow-sm">
                    Most popular
                  </span>
                )}
                <p className="font-display font-semibold text-lg">{pl.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pl.blurb}</p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl tabular-nums">{fmt(price)}</span>
                  <span className="text-xs text-muted-foreground">{note}</span>
                </div>
                {pl.monthly > 0 && cycle === "yearly" && (
                  <p className="mt-1 text-xs text-primary">
                    Just रू {Math.round(pl.yearly / 12).toLocaleString()}/mo billed yearly
                  </p>
                )}

                <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground flex-1">
                  {pl.points.map((pt) => (
                    <li key={pt} className="flex gap-2 items-start">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={dest}
                  className={`mt-7 inline-flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                    pl.featured
                      ? "bg-foreground text-background hover:bg-foreground/85"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {pl.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="hr-reveal-fade mt-8 text-center text-xs text-muted-foreground max-w-lg mx-auto">
          After signing up, request an upgrade from Settings. The admin allocates your tenant slots
          once payment is confirmed. Need more than 30 tenants?{" "}
          <Link to="/about" className="text-primary underline">
            Talk to us
          </Link>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-8 text-center">
            Pricing questions
          </p>
          <div className="divide-y divide-border">
            {FAQS.map((f) => (
              <div key={f.q} className="py-5">
                <p className="text-sm font-semibold mb-1.5">{f.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl leading-tight">
          Start free. <span className="text-primary">Upgrade when ready.</span>
        </h2>
        <div className="mt-8 flex flex-wrap gap-3 items-center justify-center">
          <Link
            to={authed ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-foreground/85 transition-colors"
          >
            {authed ? "Open dashboard" : "Get started free"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-5 w-5 rounded-full object-cover opacity-70" />
            <span className="text-sm text-muted-foreground">Hamro Rent</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2082 Hamro Rent</p>
        </div>
      </footer>
    </div>
  );
}
