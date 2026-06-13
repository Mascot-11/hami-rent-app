import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getPublicStats } from "@/lib/public-stats.functions";
import { PublicFooter } from "./about";
import { SiteHeader } from "@/components/SiteHeader";
import {
  ArrowRight, Calculator, Users, Calendar, Zap, Receipt, Share2,
  Download, BarChart3, Shield, Clock, CheckCircle2, Building2,
  Banknote, FileText, CreditCard, Bell, Lock, ChevronRight,
  Smartphone, WholeWord, TrendingUp, Star, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Hamro Rent | Billing Tools for Nepali Landlords" },
      { name: "description", content: "Bikram Sambat bills, electricity auto-calculation, carry-forward balances, WhatsApp receipts, Excel export. Built for Nepal." },
      { property: "og:title", content: "Features — Hamro Rent" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: FeaturesPage,
});

// ─── Intersection observer hook ───────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURE_GROUPS = [
  {
    id: "billing",
    label: "Billing",
    headline: "Generate bills in seconds,\nnot minutes.",
    subhead: "Every field auto-fills. Every calculation is automatic. You just review and send.",
    accent: "from-orange-500/10 to-orange-500/0",
    iconBg: "bg-orange-100 text-orange-600",
    features: [
      {
        icon: Calendar,
        title: "Bikram Sambat native",
        body: "Every bill uses a Nepali BS month — Baisakh to Chaitra. No AD conversion anywhere. Month picker, payment dates, and reports are all in BS 2080–2090.",
        badge: "Core",
        badgeColor: "bg-blue-100 text-blue-700",
        demo: {
          label: "BS month picker",
          rows: [
            { key: "Month", value: "Jestha 2082" },
            { key: "Tenant", value: "Ram Thapa · Room 2B" },
            { key: "Rent", value: "रू 10,000", highlight: true },
          ],
        },
      },
      {
        icon: Zap,
        title: "Smart electricity calculation",
        body: "Enter previous and current meter readings, pick your rate per unit (NEA slab) — total is calculated instantly. Or enter a flat NEA amount directly.",
        badge: "Unique",
        badgeColor: "bg-purple-100 text-purple-700",
        demo: {
          label: "Meter readings → auto total",
          rows: [
            { key: "Previous", value: "3,245 units" },
            { key: "Current", value: "3,381 units" },
            { key: "Units used", value: "136 × रू 13" },
            { key: "Electricity", value: "रू 1,768", highlight: true },
          ],
        },
      },
      {
        icon: TrendingUp,
        title: "Carry-forward balances",
        body: "Tenant paid रू 9,500 but owed रू 10,000? The रू 500 appears automatically in next month's bill. Overpayments create credits the same way — zero manual tracking.",
        badge: "Unique",
        badgeColor: "bg-purple-100 text-purple-700",
        demo: {
          label: "Auto balance rollover",
          rows: [
            { key: "This month total", value: "रू 11,200" },
            { key: "Prev. balance due", value: "रू 500", highlight: true },
            { key: "Grand total", value: "रू 11,700", highlight: true },
          ],
        },
      },
      {
        icon: FileText,
        title: "Additional charges",
        body: "Add custom line items to any bill — internet, maintenance, parking, or anything else. Each gets a label and amount, clearly shown to your tenant.",
        demo: {
          label: "Custom charge lines",
          rows: [
            { key: "Rent", value: "रू 8,000" },
            { key: "Internet", value: "रू 800" },
            { key: "Parking", value: "रू 500" },
            { key: "Total", value: "रू 9,300", highlight: true },
          ],
        },
      },
      {
        icon: Calculator,
        title: "Zero manual maths",
        body: "Rent + electricity + water + carry-forward + extra charges — summed instantly as you type. Change any field and the total updates live.",
        demo: {
          label: "Live total as you type",
          rows: [
            { key: "Rent", value: "रू 12,000" },
            { key: "Water", value: "रू 300" },
            { key: "Electricity", value: "रू 2,145" },
            { key: "Total", value: "रू 14,445", highlight: true },
          ],
        },
      },
    ],
  },
  {
    id: "tenants",
    label: "Tenants",
    headline: "All your tenants,\none place.",
    subhead: "Full profiles, smart defaults, instant bill history. Add a tenant once — bills fill themselves.",
    accent: "from-blue-500/10 to-blue-500/0",
    iconBg: "bg-blue-100 text-blue-600",
    features: [
      {
        icon: Users,
        title: "Full tenant profiles",
        body: "Name, room, phone, move-in date (BS), notes, and document attachments. Complete bill and payment history per tenant — one click away.",
        demo: {
          label: "Tenant card",
          rows: [
            { key: "Name", value: "Sita Shrestha" },
            { key: "Room", value: "3A · Move-in 2079-04-15" },
            { key: "Phone", value: "9841-XXXXXX" },
            { key: "Bills", value: "8 total · 7 paid", highlight: true },
          ],
        },
      },
      {
        icon: Building2,
        title: "Base rent & default water",
        body: "Set a default monthly rent and water charge once per tenant. Every new bill auto-fills them — you only touch what changed.",
        badge: "Saves time",
        badgeColor: "bg-green-100 text-green-700",
        demo: {
          label: "Auto-fill on new bill",
          rows: [
            { key: "Base rent", value: "रू 14,000 ← set once" },
            { key: "Default water", value: "रू 400 ← set once" },
            { key: "New bill", value: "Pre-filled ✓", highlight: true },
          ],
        },
      },
      {
        icon: Bell,
        title: "Billed / not billed view",
        body: "One page shows every active tenant and whether they've been billed for the selected BS month. Spot missing bills instantly.",
        badge: "Saves time",
        badgeColor: "bg-green-100 text-green-700",
        demo: {
          label: "Monthly billing status",
          rows: [
            { key: "Ram Thapa · 2B", value: "✓ Billed" },
            { key: "Sita Shrestha · 3A", value: "✓ Billed" },
            { key: "Bikash Maharjan · 1C", value: "⚠ Not billed", highlight: true },
          ],
        },
      },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    headline: "Every rupee tracked,\neffortlessly.",
    subhead: "Cash, eSewa, Khalti — record it all. Partial payments, overpayments, complete history.",
    accent: "from-green-500/10 to-green-500/0",
    iconBg: "bg-green-100 text-green-600",
    features: [
      {
        icon: CreditCard,
        title: "Multiple payment methods",
        body: "Record cash, bank transfer, eSewa, Khalti, or other. Each payment logs the method, BS date, amount, and an optional note.",
        demo: {
          label: "Payment log",
          rows: [
            { key: "2082-02-10 · Cash", value: "रू 5,000" },
            { key: "2082-02-18 · eSewa", value: "रू 5,000" },
            { key: "Status", value: "Paid in full ✓", highlight: true },
          ],
        },
      },
      {
        icon: CheckCircle2,
        title: "Partial payment tracking",
        body: "Tenant paid half? Record it. The remaining balance is shown clearly, and the status automatically switches: Pending → Partial → Paid.",
        badge: "Popular",
        badgeColor: "bg-orange-100 text-orange-700",
        demo: {
          label: "Live status update",
          rows: [
            { key: "Total owed", value: "रू 12,000" },
            { key: "Paid so far", value: "रू 7,000" },
            { key: "Remaining", value: "रू 5,000 · Partial", highlight: true },
          ],
        },
      },
      {
        icon: BarChart3,
        title: "Collection dashboard",
        body: "Total expected vs collected vs outstanding for any BS month. Collection rate bar, per-tenant breakdown, and month-over-month comparison — all in one screen.",
        demo: {
          label: "Monthly dashboard",
          rows: [
            { key: "Expected", value: "रू 1,59,000" },
            { key: "Collected", value: "रू 1,42,000" },
            { key: "Collection rate", value: "89% ↑", highlight: true },
          ],
        },
      },
    ],
  },
  {
    id: "sharing",
    label: "Share & Export",
    headline: "Send receipts in\none tap.",
    subhead: "Your tenant gets a clean bill on WhatsApp. Your accountant gets a clean Excel. You get 5 minutes back.",
    accent: "from-purple-500/10 to-purple-500/0",
    iconBg: "bg-purple-100 text-purple-600",
    features: [
      {
        icon: Share2,
        title: "WhatsApp-ready bill links",
        body: "Every bill generates a unique public URL. Hit the WhatsApp button — a pre-filled message with the link goes to your tenant. They open it in any browser, no login needed.",
        badge: "Popular",
        badgeColor: "bg-orange-100 text-orange-700",
        demo: {
          label: "Share options",
          rows: [
            { key: "Copy link", value: "hamrorent.app/share/…" },
            { key: "WhatsApp", value: "Pre-filled message ✓" },
            { key: "Download PNG", value: "Save to device ✓", highlight: true },
          ],
        },
      },
      {
        icon: Download,
        title: "Excel export",
        body: "3 sheets in one download: monthly bill summary, per-tenant payment overview, and full payment ledger. Filter by year or status.",
        demo: {
          label: "Export sheets",
          rows: [
            { key: "Sheet 1", value: "Monthly Summary" },
            { key: "Sheet 2", value: "Tenant Overview" },
            { key: "Sheet 3", value: "Payment Ledger", highlight: true },
          ],
        },
      },
      {
        icon: Receipt,
        title: "PDF statements",
        body: "Download a professional PDF rent collection statement — monthly, 3-month, 6-month, or full year. Includes logo, summary cards, bill table, and tenant breakdown.",
        badge: "New",
        badgeColor: "bg-blue-100 text-blue-700",
        demo: {
          label: "Statement periods",
          rows: [
            { key: "Monthly", value: "Current BS month" },
            { key: "Quarterly", value: "Last 3 months" },
            { key: "Yearly", value: "Full BS year", highlight: true },
          ],
        },
      },
    ],
  },
  {
    id: "security",
    label: "Security & Privacy",
    headline: "Your data stays\nyours.",
    subhead: "Row-level security means no one — including us — can read your tenant data without your login.",
    accent: "from-slate-500/10 to-slate-500/0",
    iconBg: "bg-slate-100 text-slate-600",
    features: [
      {
        icon: Lock,
        title: "Private to your account",
        body: "Row-level security at the database level. Even if someone guesses a URL, they cannot read any of your data. Your bills, tenants, and payments are yours alone.",
        badge: "Always on",
        badgeColor: "bg-slate-100 text-slate-700",
        demo: {
          label: "Access control",
          rows: [
            { key: "Your account", value: "Full access ✓" },
            { key: "Other users", value: "Blocked at DB level" },
            { key: "Shared links", value: "View-only, single bill", highlight: true },
          ],
        },
      },
      {
        icon: Shield,
        title: "Secure shared links",
        body: "Tenant share links are view-only and expose only that one bill — no other tenant data, no account information, and no way to modify anything.",
        demo: {
          label: "Share link scope",
          rows: [
            { key: "Can see", value: "Their own bill only" },
            { key: "Cannot see", value: "Other tenants ✗" },
            { key: "Can modify", value: "Nothing ✗", highlight: true },
          ],
        },
      },
      {
        icon: Smartphone,
        title: "Works everywhere",
        body: "No app to install. Open hamrorent.app in any smartphone browser and it works. Responsive from 320px screens to desktop monitors.",
        demo: {
          label: "Device support",
          rows: [
            { key: "Android / iOS", value: "Any browser ✓" },
            { key: "Desktop", value: "Chrome, Firefox, Safari ✓" },
            { key: "Installation", value: "None required", highlight: true },
          ],
        },
      },
    ],
  },
];

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ f, inView, delay }: { f: (typeof FEATURE_GROUPS)[0]["features"][0]; inView: boolean; delay: number }) {
  const Icon = f.icon;
  return (
    <div
      className={`group relative bg-card border border-border rounded-2xl overflow-hidden transition-all duration-700 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Top */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {f.badge && (
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${f.badgeColor}`}>
              {f.badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-base mb-2">{f.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
      </div>

      {/* Demo preview */}
      {f.demo && (
        <div className="border-t bg-muted/30 px-5 sm:px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{f.demo.label}</p>
          <div className="space-y-2">
            {f.demo.rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{row.key}</span>
                <span className={`text-xs font-semibold font-mono ${row.highlight ? "text-primary" : "text-foreground"}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
function FeaturesPage() {
  const fn = useServerFn(getPublicStats);
  const { data, isLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });

  const [activeGroup, setActiveGroup] = useState("billing");

  const heroSection   = useInView(0.1);
  const groupSections = FEATURE_GROUPS.map(() => useInView(0.08));
  const ctaSection    = useInView(0.15);

  const fmt = (n: number) => (n > 0 ? `${n.toLocaleString()}+` : "—");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader active="features" />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-12" ref={heroSection.ref}>
        {/* bg decorations */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/4 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          {/* Badge */}
          <div className={`transition-all duration-700 ${heroSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-8">
              <Sparkles className="h-3 w-3" /> Built for Nepal's real workflow
            </div>
          </div>

          <h1 className={`font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-3xl mb-5 transition-all duration-700 delay-100 ${heroSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Every feature you need —{" "}
            <span className="text-primary">none you don't.</span>
          </h1>

          <p className={`text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10 transition-all duration-700 delay-200 ${heroSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Hamro Rent is designed around the real workflow of a Nepali landlord — BS calendar, NEA electricity, eSewa payments, WhatsApp receipts. Nothing generic. Nothing bloated.
          </p>

          {/* Stats row */}
          <div className={`flex flex-wrap gap-8 sm:gap-12 mb-12 transition-all duration-700 delay-300 ${heroSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {[
              { label: "Active landlords", value: isLoading ? "…" : fmt(data?.landlords ?? 0) },
              { label: "Tenants tracked", value: isLoading ? "…" : fmt(data?.tenants ?? 0) },
              { label: "BS calendar range", value: "2080 – 2090" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl sm:text-3xl font-bold text-primary tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Group nav pills */}
          <div className={`flex flex-wrap gap-2 transition-all duration-700 delay-400 ${heroSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {FEATURE_GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`}
                onClick={() => setActiveGroup(g.id)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${activeGroup === g.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                {g.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE GROUPS ════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-24 space-y-28">
        {FEATURE_GROUPS.map((group, gi) => {
          const { ref, inView } = groupSections[gi];
          return (
            <section key={group.id} id={group.id} ref={ref} className="scroll-mt-24">
              {/* Group header */}
              <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                <div>
                  <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${group.iconBg} border border-current/10`}>
                    {group.label}
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] whitespace-pre-line">
                    {group.headline}
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xs leading-relaxed sm:text-right">
                  {group.subhead}
                </p>
              </div>

              {/* Gradient accent bar */}
              <div className={`h-px w-full bg-gradient-to-r ${group.accent} mb-10`} />

              {/* Cards grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.features.map((f, fi) => (
                  <FeatureCard key={f.title} f={f} inView={inView} delay={fi * 100} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ══ COMPARISON STRIP ═════════════════════════════════════════════════ */}
      <section className="border-y border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
          <h2 className="font-display text-2xl sm:text-3xl text-center mb-10">
            How does Hamro Rent compare?
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 font-medium text-muted-foreground w-1/3">Feature</th>
                  <th className="pb-3 font-semibold text-center w-1/4">
                    <span className="text-primary">Hamro Rent</span>
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground text-center w-1/4">Notebook / WhatsApp</th>
                  <th className="pb-3 font-medium text-muted-foreground text-center w-1/4">Generic apps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Bikram Sambat calendar",       true, false, false],
                  ["Auto electricity calculation", true, false, false],
                  ["Carry-forward balances",        true, false, "Manual"],
                  ["WhatsApp receipt sharing",      true, "Photo", false],
                  ["Partial payment tracking",      true, false, "Manual"],
                  ["Collection dashboard",          true, false, "Basic"],
                  ["Excel + PDF export",            true, false, "Paid"],
                  ["No app download needed",        true, true, false],
                  ["Free to use",                   true, true, "Limited"],
                ].map(([feature, hr, nb, ga]) => (
                  <tr key={String(feature)} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 font-medium">{feature}</td>
                    <td className="py-3 text-center">
                      {hr === true ? <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" /></span>
                        : <span className="text-xs font-medium text-green-700">{hr}</span>}
                    </td>
                    <td className="py-3 text-center">
                      {nb === true ? <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" /></span>
                        : nb === false ? <span className="text-muted-foreground/40 text-lg">—</span>
                        : <span className="text-xs font-medium text-muted-foreground">{nb}</span>}
                    </td>
                    <td className="py-3 text-center">
                      {ga === true ? <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" /></span>
                        : ga === false ? <span className="text-muted-foreground/40 text-lg">—</span>
                        : <span className="text-xs font-medium text-muted-foreground">{ga}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ QUICK-WIN STRIP ══════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Clock,  stat: "< 5 min", label: "to create your first bill after signup" },
            { icon: Star,   stat: "1 tap",   label: "to send a WhatsApp receipt to a tenant" },
            { icon: Shield, stat: "0 leaks", label: "other users can see your tenant data" },
          ].map(({ icon: Icon, stat, label }, i) => (
            <div key={stat} className="flex gap-4 items-start p-5 rounded-2xl bg-muted/30 border border-border">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-primary">{stat}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section className="bg-foreground text-background" ref={ctaSection.ref}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <div className={`transition-all duration-700 ${ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full mb-6">
                  <Sparkles className="h-3 w-3" /> Free forever for 3 tenants
                </div>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-4">
                  Ready to stop doing rent maths by hand?
                </h2>
                <p className="text-background/70 leading-relaxed">
                  Join Nepali landlords who've replaced their rent notebooks with Hamro Rent. No card, no install, no nonsense.
                </p>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:-translate-y-0.5">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/pricing" className="inline-flex items-center justify-center gap-2 border border-background/20 text-background text-sm font-medium px-8 py-3.5 rounded-full hover:bg-background/10 transition-all">
                  View pricing <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
