import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
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
// Monthly pricing; yearly shown as a discounted equivalent ({t("pricing.2free")}).
type Plan = {
  name: string;
  monthly: number;
  yearly: number;
  blurb: string;
  featured: boolean;
  cta: string;
  points: string[];
};



function fmt(n: number) {
  return n === 0 ? "रू 0" : `रू ${n.toLocaleString()}`;
}

function PricingPage() {
  const { t } = useLanguage();
  const PLANS: Plan[] = [
    {
      name: t("plan.free.name"),
      monthly: 0,
      yearly: 0,
      blurb: t("plan.free.blurb"),
      featured: false,
      cta: t("plan.free.cta"),
      points: [t("plan.free.p1"), t("plan.free.p2"), t("plan.free.p3"), t("plan.free.p4")],
    },
    {
      name: t("plan.basic.name"),
      monthly: 150,
      yearly: 1500,
      blurb: t("plan.basic.blurb"),
      featured: true,
      cta: t("plan.basic.cta"),
      points: [t("plan.basic.p1"), t("plan.basic.p2"), t("plan.basic.p3"), t("plan.basic.p4")],
    },
    {
      name: t("plan.pro.name"),
      monthly: 300,
      yearly: 3000,
      blurb: t("plan.pro.blurb"),
      featured: false,
      cta: t("plan.pro.cta"),
      points: [t("plan.pro.p1.pricing"), t("plan.pro.p2"), t("plan.pro.p3.pricing"), t("plan.pro.p4.pricing")],
    },
  ];

  const FAQS = [
    { q: t("pricing.faq.1.q"), a: t("pricing.faq.1.a") },
    { q: t("pricing.faq.2.q"), a: t("pricing.faq.2.a") },
    { q: t("pricing.faq.3.q"), a: t("pricing.faq.3.a") },
    { q: t("pricing.faq.4.q"), a: t("pricing.faq.4.a") },
  ];

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
      <SiteHeader active="pricing" />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-8 text-center">
        <p className="hr-reveal text-xs uppercase tracking-widest text-primary font-medium mb-5 inline-flex items-center gap-1.5 justify-center">
          <Sparkles className="h-3.5 w-3.5" /> {t("pricing.badge")}
        </p>
        <h1
          className="hr-reveal font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.08] max-w-2xl mx-auto"
          style={{ animationDelay: "60ms" }}
        >
          {t("pricing.title")}
        </h1>
        <p
          className="hr-reveal mt-6 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed"
          style={{ animationDelay: "120ms" }}
        >
          {t("pricing.sub")}
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
              {c === "monthly" ? t("pricing.monthly") : t("pricing.yearly")}
              {c === "yearly" && (
                <span className="ml-1.5 text-[10px] uppercase tracking-wide text-primary">
                  {t("pricing.2free")}
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
                ? t("pricing.forever")
                : cycle === "monthly"
                  ? t("pricing.perMonth")
                  : t("pricing.perYear");
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
                    {t("pricing.justPerMo", { n: Math.round(pl.yearly / 12).toLocaleString() })}
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
          {t("pricing.note")}{" "}
          <Link to="/about" className="text-primary underline">
            {t("pricing.talkToUs")}
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
          {t("pricing.finalTitle")} <span className="text-primary">{t("pricing.finalTitle2")}</span>
        </h2>
        <div className="mt-8 flex flex-wrap gap-3 items-center justify-center">
          <Link
            to={authed ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-foreground/85 transition-colors"
          >
            {authed ? t("pricing.getDash") : t("pricing.getFree")} <ArrowRight className="h-3.5 w-3.5" />
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
              {t("pub.footer.features")}
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              {t("pub.footer.pricing")}
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {t("pub.footer.terms")}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2082 Hamro Rent</p>
        </div>
      </footer>
    </div>
  );
}
