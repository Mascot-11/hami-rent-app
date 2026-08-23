import { AdSlot } from "@/components/AdSlot";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPublicStats } from "@/lib/public-stats.functions";
import {
  ArrowRight,
  X,
  PlayCircle,
  Check,
  ChevronDown,
  Sparkles,
  CalendarDays,
  Zap,
  TrendingUp,
  ReceiptText,
  Calculator,
  Share2,
  Users,
  Building2,
  Banknote,
} from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroScene } from "@/components/three/HeroScene";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hamro Rent — Rent Management for Nepali Landlords" },
      {
        name: "description",
        content:
          "Track tenants, electricity, water, and monthly bills in Bikram Sambat. Automatic calculations, shareable bill links — built for Nepal.",
      },
      {
        name: "keywords",
        content:
          "hamro rent, rent management nepal, bikram sambat, landlord app nepal, tenant tracking, electricity bill calculator nepal",
      },
      { property: "og:title", content: "Hamro Rent — Rent Management for Nepali Landlords" },
      {
        property: "og:description",
        content:
          "Automatic monthly bills, BS calendar, tenant tracking. Free for Nepali landlords.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: LandingPage,
});

// ─── Demo helpers ─────────────────────────────────────────────────────────────

const DEMO_KEY = "hamrorent_demo";
const DEMO_TTL = 3 * 24 * 60 * 60 * 1000;

type DemoTenant = { id: string; name: string; room: string; rent: number };
type DemoBill = {
  id: string;
  tenantId: string;
  tenant: string;
  room: string;
  rent: number;
  electricity: number;
  water: number;
  total: number;
  paid: number;
  status: "pending" | "partial" | "paid";
};
type DemoData = { createdAt: number; tenants: DemoTenant[]; bills: DemoBill[] };

function getDemoData(): DemoData | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as DemoData;
    if (Date.now() - p.createdAt > DEMO_TTL) {
      localStorage.removeItem(DEMO_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function initDemoData(): DemoData {
  const e = getDemoData();
  if (e) return e;
  const d: DemoData = {
    createdAt: Date.now(),
    tenants: [
      { id: "t1", name: "Ram Bahadur Thapa", room: "2B", rent: 10000 },
      { id: "t2", name: "Sita Kumari Shrestha", room: "3A", rent: 8500 },
      { id: "t3", name: "Bikash Maharjan", room: "1C", rent: 12000 },
    ],
    bills: [
      {
        id: "b1",
        tenantId: "t1",
        tenant: "Ram Bahadur Thapa",
        room: "2B",
        rent: 10000,
        electricity: 1770,
        water: 500,
        total: 12270,
        paid: 0,
        status: "pending",
      },
      {
        id: "b2",
        tenantId: "t2",
        tenant: "Sita Kumari Shrestha",
        room: "3A",
        rent: 8500,
        electricity: 1200,
        water: 500,
        total: 10200,
        paid: 10200,
        status: "paid",
      },
      {
        id: "b3",
        tenantId: "t3",
        tenant: "Bikash Maharjan",
        room: "1C",
        rent: 12000,
        electricity: 2100,
        water: 500,
        total: 14600,
        paid: 7000,
        status: "partial",
      },
    ],
  };
  localStorage.setItem(DEMO_KEY, JSON.stringify(d));
  return d;
}

function fmtNPR(n: number) {
  if (n >= 10_000_000) return `रू ${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `रू ${(n / 100_000).toFixed(1)} L`;
  if (n >= 1_000) return `रू ${(n / 1_000).toFixed(0)}K+`;
  return `रू ${n.toLocaleString()}`;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
// The public header now lives in @/components/SiteHeader and is shared across
// every marketing page. See <SiteHeader /> usage below.

// ─── Footer ───────────────────────────────────────────────────────────────────

// ─── Pricing plans (slots are allocated manually by the admin after payment) ──
// NOTE: keep these in sync with what the super admin actually grants.

function Footer() {
  const { t } = useLanguage();
  return (
    <>
      <div className="max-w-6xl mx-auto px-4">
        <AdSlot placement="landing" className="my-8" />
      </div>
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            <Link to="/about" className="hover:text-foreground transition-colors">
              {t("pub.footer.about")}
            </Link>
            <Link to="/login" className="hover:text-foreground transition-colors">
              {t("pub.footer.signIn")}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2082 Hamro Rent</p>
        </div>
      </footer>
    </>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage() {
  const { t } = useLanguage();

  const plans = [
    {
      name: t("plan.free.name"),
      price: "रू 0",
      priceNote: t("land.price.forever"),
      featured: false,
      cta: t("plan.free.cta"),
      points: [t("plan.free.p1"), t("plan.free.p2"), t("plan.free.p3"), t("plan.free.p4")],
    },
    {
      name: t("plan.basic.name"),
      price: "रू 150",
      priceNote: t("land.price.perMonth"),
      featured: true,
      cta: t("plan.basic.cta"),
      points: [t("plan.basic.p1"), t("plan.basic.p2"), t("plan.basic.p3"), t("plan.basic.p4")],
    },
    {
      name: t("plan.pro.name"),
      price: "रू 300",
      priceNote: t("land.price.perMonth"),
      featured: false,
      cta: t("plan.pro.cta"),
      points: [t("plan.pro.p1"), t("plan.pro.p2"), t("plan.pro.p3"), t("plan.pro.p4")],
    },
  ];

  const [authed, setAuthed] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoTab, setDemoTab] = useState<"dashboard" | "tenant" | "bill">("dashboard");
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [newTenant, setNewTenant] = useState({ name: "", room: "", rent: "" });
  const [billForm, setBillForm] = useState({ tenantId: "", electricity: "", water: "500" });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const statsFn = useServerFn(getPublicStats);
  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => statsFn(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const openDemo = () => {
    setDemoData(initDemoData());
    setDemoOpen(true);
  };

  const markPaid = (id: string) => {
    if (!demoData) return;
    const d = {
      ...demoData,
      bills: demoData.bills.map((b) =>
        b.id === id ? { ...b, paid: b.total, status: "paid" as const } : b,
      ),
    };
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    setDemoData(d);
    toast("Marked as paid");
  };

  const addTenant = () => {
    if (!newTenant.name || !newTenant.room || !newTenant.rent) return;
    if (!demoData) return;
    const d = {
      ...demoData,
      tenants: [
        ...demoData.tenants,
        {
          id: `t${Date.now()}`,
          name: newTenant.name,
          room: newTenant.room,
          rent: Number(newTenant.rent),
        },
      ],
    };
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    setDemoData(d);
    setNewTenant({ name: "", room: "", rent: "" });
    toast(`${newTenant.name} added`);
  };

  const generateBill = () => {
    if (!billForm.tenantId || !billForm.electricity) return;
    if (!demoData) return;
    const t = demoData.tenants.find((x) => x.id === billForm.tenantId);
    if (!t) return;
    const total = t.rent + Number(billForm.electricity) + Number(billForm.water);
    const bill = {
      id: `b${Date.now()}`,
      tenantId: t.id,
      tenant: t.name,
      room: t.room,
      rent: t.rent,
      electricity: Number(billForm.electricity),
      water: Number(billForm.water),
      total,
      paid: 0,
      status: "pending" as const,
    };
    const bills = demoData.bills.filter((b) => b.tenantId !== t.id);
    const d = { ...demoData, bills: [...bills, bill] };
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
    setDemoData(d);
    setBillForm({ tenantId: "", electricity: "", water: "500" });
    toast(`Bill for ${t.name} created`);
  };

  const cta = authed ? "/dashboard" : "/login";
  const ctaLabel = authed ? t("land.hero.ctaDash") : t("land.hero.cta");

  const liveStats = [
    {
      value: stats && stats.landlords > 0 ? `${stats.landlords}+` : "—",
      label: t("land.stats.landlords"),
    },
    {
      value: stats && stats.tenants > 0 ? `${stats.tenants}+` : "—",
      label: t("land.stats.tenants"),
    },
    {
      value: stats && stats.paymentsNPR > 0 ? fmtNPR(stats.paymentsNPR) : "—",
      label: t("land.stats.collected"),
    },
  ];

  const features = [
    { title: t("land.feat.1.title"), body: t("land.feat.1.body"), Icon: CalendarDays },
    { title: t("land.feat.2.title"), body: t("land.feat.2.body"), Icon: Zap },
    { title: t("land.feat.3.title"), body: t("land.feat.3.body"), Icon: TrendingUp },
    { title: t("land.feat.4.title"), body: t("land.feat.4.body"), Icon: ReceiptText },
    { title: t("land.feat.5.title"), body: t("land.feat.5.body"), Icon: Calculator },
    { title: t("land.feat.6.title"), body: t("land.feat.6.body"), Icon: Share2 },
  ];

  const statIcons = [Users, Building2, Banknote];

  const faqs = [
    { q: t("land.faq.1.q"), a: t("land.faq.1.a") },
    { q: t("land.faq.2.q"), a: t("land.faq.2.a") },
    { q: t("land.faq.3.q"), a: t("land.faq.3.a") },
    { q: t("land.faq.4.q"), a: t("land.faq.4.a") },
    { q: t("land.faq.5.q"), a: t("land.faq.5.a") },
    { q: t("land.faq.6.q"), a: t("land.faq.6.a") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background text-xs font-medium px-4 py-2 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      <SiteHeader active="home" onDemo={openDemo} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 hr-dots opacity-70 [mask-image:radial-gradient(ellipse_65%_60%_at_50%_35%,black,transparent)]" />
          <div className="absolute -top-40 right-[-8%] h-[480px] w-[480px] rounded-full bg-primary/15 hr-orb" />
          <div
            className="absolute top-72 left-[-12%] h-[380px] w-[380px] rounded-full bg-accent/50 hr-orb"
            style={{ animationDelay: "-4.5s" }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-16 sm:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
          <div>
            <p className="hr-reveal inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3.5 py-1.5 text-[11px] uppercase tracking-widest text-primary font-semibold mb-7">
              <Sparkles className="h-3 w-3" /> {t("land.badge")}
            </p>
            <h1
              className="hr-reveal font-display text-4xl sm:text-5xl xl:text-6xl leading-[1.06] tracking-tight max-w-xl"
              style={{ animationDelay: "70ms" }}
            >
              {t("land.hero.title").split("\n")[0]}{" "}
              <span className="text-gradient">{t("land.hero.title").split("\n")[1]}</span>
            </h1>
            <p
              className="hr-reveal mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed"
              style={{ animationDelay: "140ms" }}
            >
              {t("land.hero.sub")}
            </p>
            <div
              className="hr-reveal mt-9 flex flex-wrap gap-3 items-center"
              style={{ animationDelay: "210ms" }}
            >
              <Link
                to={cta}
                className="hr-glow group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                {ctaLabel}{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={openDemo}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
              >
                <PlayCircle className="h-4 w-4 text-primary" /> {t("land.hero.demo")}
              </button>
            </div>
            <p
              className="hr-reveal mt-6 text-xs text-muted-foreground"
              style={{ animationDelay: "280ms" }}
            >
              {t("land.hero.fine")}
            </p>
          </div>

          <div className="hr-reveal relative" style={{ animationDelay: "180ms" }}>
            <div
              className="absolute inset-x-10 bottom-6 h-40 rounded-full bg-primary/20 blur-[90px]"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card to-muted/40 shadow-2xl shadow-foreground/10">
              <HeroScene className="h-72 sm:h-96 lg:h-[440px] xl:h-[500px] w-full" />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                aria-hidden="true"
              />
            </div>

            <div className="hr-float absolute -left-3 sm:-left-8 top-8 flex items-center gap-2.5 rounded-xl border border-border bg-background/90 backdrop-blur px-3.5 py-2.5 shadow-lg">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 text-success">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold leading-none">रू 12,270</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Bill paid · Jestha</p>
              </div>
            </div>

            <div
              className="hr-float absolute -right-2 sm:-right-6 bottom-10 flex items-center gap-2.5 rounded-xl border border-border bg-background/90 backdrop-blur px-3.5 py-2.5 shadow-lg"
              style={{ animationDelay: "-2s" }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Banknote className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-semibold leading-none">रू 34,800</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Collected this month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live stats ── */}
      <section className="border-y border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid sm:grid-cols-3 gap-4">
          {liveStats.map(({ value, label }, i) => {
            const Icon = statIcons[i];
            return (
              <div
                key={label}
                className="hr-card hr-pop group relative overflow-hidden rounded-2xl border border-border bg-background p-6 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-foreground/5"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.07] blur-2xl transition-colors duration-300 group-hover:bg-primary/20"
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between">
                  <div className="font-display text-3xl sm:text-4xl tabular-nums">{value}</div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">{label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-xl mb-12">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            What it does
          </p>
          <h2 className="font-display text-2xl sm:text-3xl leading-tight">
            Everything a Nepali landlord needs, nothing they don't
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ title, body, Icon }, i) => (
            <div
              key={title}
              className="hr-card group relative rounded-2xl border border-border bg-card p-6 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-foreground/5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-semibold">{title}</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-10 border-t border-border">
          <Link
            to="/features"
            className="group text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            {t("land.feat.seeAll")}{" "}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        id="how-it-works"
        className="relative border-t border-border bg-foreground text-background overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true">
          <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-primary/10 blur-[90px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-12">
            How it works
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {[
              { n: "1", t: t("land.how.1.t"), d: t("land.how.1.d") },
              { n: "2", t: t("land.how.2.t"), d: t("land.how.2.d") },
              { n: "3", t: t("land.how.3.t"), d: t("land.how.3.d") },
              { n: "4", t: t("land.how.4.t"), d: t("land.how.4.d") },
            ].map((s) => (
              <div key={s.n}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 font-display text-lg text-primary mb-5">
                  {s.n}
                </div>
                <p className="text-sm font-semibold text-background mb-1.5">{s.t}</p>
                <p className="text-sm text-background/60 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 pt-10 border-t border-background/10">
            <button
              onClick={openDemo}
              className="group inline-flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors"
            >
              <PlayCircle className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />{" "}
              {t("land.how.demo")}
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className="max-w-xl mb-12">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
              Pricing
            </p>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight mb-3">
              {t("land.price.title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("land.price.sub")}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 items-stretch">
            {plans.map((pl, i) => (
              <div
                key={pl.name}
                style={{ animationDelay: `${i * 90}ms` }}
                className={`hr-pop hr-card rounded-[1.3rem] hover:-translate-y-1 ${
                  pl.featured
                    ? "bg-gradient-to-b from-primary/70 via-primary/25 to-primary/5 p-[1.5px] shadow-xl shadow-primary/10"
                    : "border border-border bg-background hover:border-primary/25 hover:shadow-lg"
                }`}
              >
                <div
                  className={`relative flex flex-col h-full rounded-[calc(1.3rem-1.5px)] p-6 ${pl.featured ? "bg-background" : ""}`}
                >
                  {pl.featured && (
                    <>
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground rounded-full px-3 py-1 shadow-sm whitespace-nowrap">
                        Popular
                      </span>
                      <span
                        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                        aria-hidden="true"
                      />
                    </>
                  )}
                  <p className="font-display font-semibold">{pl.name}</p>
                  <p className="mt-3 text-3xl font-display tabular-nums">{pl.price}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pl.priceNote}</p>
                  <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground flex-1">
                    {pl.points.map((pt) => (
                      <li key={pt} className="flex gap-2 items-start">
                        <span className="flex h-4.5 w-4.5 mt-0.5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                        </span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={pl.name === "Free" ? cta : "/pricing"}
                    className={`mt-7 inline-flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full transition-all duration-300 ${
                      pl.featured
                        ? "bg-primary text-primary-foreground hr-glow hover:-translate-y-0.5 hover:shadow-xl"
                        : "border border-border hover:bg-muted hover:border-primary/30"
                    }`}
                  >
                    {pl.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            {t("land.price.seeAll")}
            <br />
            {t("land.price.note")}
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">FAQ</p>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight max-w-xs">
              Questions, answered
            </h2>
          </div>
          <div className="max-w-2xl space-y-3">
            {faqs.map((f, i) => (
              <div
                key={f.q}
                className={`hr-card rounded-xl border transition-colors ${
                  faqOpen === i
                    ? "border-primary/30 bg-muted/40 shadow-sm"
                    : "border-border bg-background hover:border-primary/20"
                }`}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium"
                >
                  {f.q}
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors ${faqOpen === i ? "bg-primary/10" : "bg-muted"}`}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${faqOpen === i ? "rotate-180 text-primary" : "text-muted-foreground"}`}
                    />
                  </span>
                </button>
                {faqOpen === i && (
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-foreground text-background px-6 sm:px-12 py-16 sm:py-24 text-center">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-primary/25 blur-[110px]" />
            <div className="absolute inset-0 hr-dots opacity-20 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_40%,black,transparent)]" />
          </div>
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl max-w-lg mx-auto leading-tight tracking-tight">
              {t("land.cta.title")}
              <br />
              <span className="text-primary">{t("land.cta.title2")}</span>
            </h2>
            <p className="mt-5 text-base text-background/70 max-w-md mx-auto leading-relaxed">
              {t("land.cta.sub")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3 items-center justify-center">
              <Link
                to={cta}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
              >
                {ctaLabel}{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={openDemo}
                className="rounded-full border border-background/20 px-7 py-3 text-sm text-background/80 transition-colors hover:bg-background/10 hover:text-background"
              >
                {t("land.cta.demoBtn")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Demo Modal ── */}
      {demoOpen && demoData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="bg-background border border-border rounded-2xl w-full max-w-3xl my-4 overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="border-b border-border px-5 sm:px-7 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Live Demo
                  </span>
                </div>
                <p className="font-display text-lg">{t("demo.title")}</p>
              </div>
              <button
                onClick={() => setDemoOpen(false)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-5 sm:px-7 flex gap-0.5 bg-muted/20">
              {(["dashboard", "tenant", "bill"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDemoTab(tab)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                    demoTab === tab
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "dashboard"
                    ? t("demo.tab.dash")
                    : tab === "tenant"
                      ? t("demo.tab.tenant")
                      : t("demo.tab.bill")}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-7">
              {/* Dashboard */}
              {demoTab === "dashboard" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: t("demo.stat.tenants"), v: String(demoData.tenants.length) },
                      {
                        l: t("demo.stat.collected"),
                        v: `रू ${demoData.bills.reduce((s: number, b: DemoBill) => s + b.paid, 0).toLocaleString()}`,
                      },
                      {
                        l: t("demo.stat.outstanding"),
                        v: `रू ${demoData.bills.reduce((s: number, b: DemoBill) => s + Math.max(0, b.total - b.paid), 0).toLocaleString()}`,
                      },
                      { l: t("demo.stat.bills"), v: String(demoData.bills.length) },
                    ].map(({ l, v }) => (
                      <div key={l} className="border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{l}</p>
                        <p className="font-display text-lg">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Bills — Jestha 2082
                    </div>
                    <div className="divide-y divide-border">
                      {demoData.bills.map((b: DemoBill) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between px-4 py-3 gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {b.tenant}{" "}
                              <span className="text-muted-foreground font-normal">
                                · Room {b.room}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              रू {b.paid.toLocaleString()} paid of रू {b.total.toLocaleString()}
                              {b.total - b.paid > 0 && (
                                <span className="text-red-500 ml-1.5">
                                  · रू {(b.total - b.paid).toLocaleString()} due
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-medium ${b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                            >
                              {b.status}
                            </span>
                            {b.status !== "paid" && (
                              <button
                                onClick={() => markPaid(b.id)}
                                className="text-xs text-primary hover:underline"
                              >
                                Mark paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tenants */}
              {demoTab === "tenant" && (
                <div className="space-y-5">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="divide-y divide-border">
                      {demoData.tenants.map((t: DemoTenant) => (
                        <div key={t.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Room {t.room} · रू {t.rent.toLocaleString()}/mo
                            </p>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                      Add Tenant
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3 mb-4">
                      <input
                        className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={t("demo.namePlaceholder")}
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                      />
                      <input
                        className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={t("demo.roomPlaceholder")}
                        value={newTenant.room}
                        onChange={(e) => setNewTenant({ ...newTenant, room: e.target.value })}
                      />
                      <input
                        type="number"
                        className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={t("demo.rentPlaceholder")}
                        value={newTenant.rent}
                        onChange={(e) => setNewTenant({ ...newTenant, rent: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={addTenant}
                      className="text-sm bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/85 transition-colors"
                    >
                      Add tenant
                    </button>
                  </div>
                </div>
              )}

              {/* New Bill */}
              {demoTab === "bill" && (
                <div className="space-y-5">
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Tenant</p>
                      <select
                        className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        value={billForm.tenantId}
                        onChange={(e) => setBillForm({ ...billForm, tenantId: e.target.value })}
                      >
                        <option value="">{t("demo.selectTenant")}</option>
                        {demoData.tenants.map((t: DemoTenant) => (
                          <option key={t.id} value={t.id}>
                            {t.name} · Room {t.room}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {t("demo.electricity")}
                        </p>
                        <input
                          type="number"
                          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="1500"
                          value={billForm.electricity}
                          onChange={(e) =>
                            setBillForm({ ...billForm, electricity: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">{t("demo.water")}</p>
                        <input
                          type="number"
                          className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          value={billForm.water}
                          onChange={(e) => setBillForm({ ...billForm, water: e.target.value })}
                        />
                      </div>
                    </div>
                    {billForm.tenantId &&
                      billForm.electricity &&
                      (() => {
                        const t = demoData.tenants.find((x) => x.id === billForm.tenantId);
                        const total = t
                          ? t.rent + Number(billForm.electricity) + Number(billForm.water)
                          : 0;
                        return (
                          <div className="border-t border-border pt-3 space-y-1.5">
                            {[
                              ["Rent", t?.rent],
                              ["Electricity", billForm.electricity],
                              ["Water", billForm.water],
                            ].map(([k, v]) => (
                              <div key={String(k)} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{k}</span>
                                <span>रू {Number(v).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-border">
                              <span>Total</span>
                              <span className="text-primary">रू {total.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                  <button
                    onClick={generateBill}
                    disabled={!billForm.tenantId || !billForm.electricity}
                    className="text-sm bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Create bill
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-border px-5 sm:px-7 py-4 flex items-center justify-between bg-muted/10">
              <p className="text-xs text-muted-foreground">{t("demo.footer")}</p>
              <Link
                to={authed ? "/dashboard" : "/login"}
                onClick={() => setDemoOpen(false)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {authed ? t("demo.goToDash") : t("demo.createAccount")}{" "}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
