import { AdSlot } from "@/components/AdSlot";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPublicStats } from "@/lib/public-stats.functions";
import { ArrowRight, Menu, X, PlayCircle, Check, ChevronDown } from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hamro Rent — Rent Management for Nepali Landlords" },
      { name: "description", content: "Track tenants, electricity, water, and monthly bills in Bikram Sambat. Automatic calculations, shareable bill links — built for Nepal." },
      { name: "keywords", content: "hamro rent, rent management nepal, bikram sambat, landlord app nepal, tenant tracking, electricity bill calculator nepal" },
      { property: "og:title", content: "Hamro Rent — Rent Management for Nepali Landlords" },
      { property: "og:description", content: "Automatic monthly bills, BS calendar, tenant tracking. Free for Nepali landlords." },
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

function getDemoData() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.now() - p.createdAt > DEMO_TTL) { localStorage.removeItem(DEMO_KEY); return null; }
    return p;
  } catch { return null; }
}

function initDemoData() {
  const e = getDemoData();
  if (e) return e;
  const d = {
    createdAt: Date.now(),
    tenants: [
      { id: "t1", name: "Ram Bahadur Thapa", room: "2B", rent: 10000 },
      { id: "t2", name: "Sita Kumari Shrestha", room: "3A", rent: 8500 },
      { id: "t3", name: "Bikash Maharjan", room: "1C", rent: 12000 },
    ],
    bills: [
      { id: "b1", tenantId: "t1", tenant: "Ram Bahadur Thapa", room: "2B", rent: 10000, electricity: 1770, water: 500, total: 12270, paid: 0, status: "pending" },
      { id: "b2", tenantId: "t2", tenant: "Sita Kumari Shrestha", room: "3A", rent: 8500, electricity: 1200, water: 500, total: 10200, paid: 10200, status: "paid" },
      { id: "b3", tenantId: "t3", tenant: "Bikash Maharjan", room: "1C", rent: 12000, electricity: 2100, water: 500, total: 14600, paid: 7000, status: "partial" },
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

function Nav({ authed, onDemo }: { authed: boolean; onDemo: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Hamro Rent" className="h-7 w-7 rounded-full object-cover" />
          <span className="font-display text-base font-semibold tracking-tight">Hamro Rent</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <button onClick={onDemo} className="hover:text-foreground transition-colors">Demo</button>
          {!authed
            ? <Link to="/login" className="text-foreground font-medium hover:text-primary transition-colors">Sign in →</Link>
            : <Link to="/dashboard" className="text-foreground font-medium hover:text-primary transition-colors">Dashboard →</Link>}
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link to={authed ? "/dashboard" : "/login"} className="text-sm font-medium text-primary">
            {authed ? "Dashboard" : "Sign in"}
          </Link>
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background px-5 py-4 flex flex-col gap-3 text-sm">
          <Link to="/features" onClick={() => setOpen(false)} className="text-muted-foreground py-1">Features</Link>
          <Link to="/about" onClick={() => setOpen(false)} className="text-muted-foreground py-1">About</Link>
          <button onClick={() => { setOpen(false); onDemo(); }} className="text-left text-muted-foreground py-1">Try demo</button>
        </div>
      )}
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <>
    <div className="max-w-6xl mx-auto px-4"><AdSlot placement="landing" className="my-8" /></div>
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-5 w-5 rounded-full object-cover opacity-70" />
          <span className="text-sm text-muted-foreground">Hamro Rent</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
        </div>
        <p className="text-xs text-muted-foreground">© 2082 Hamro Rent</p>
      </div>
    </footer>
    </>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage() {
  const [authed, setAuthed] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoTab, setDemoTab] = useState<"dashboard" | "tenant" | "bill">("dashboard");
  const [demoData, setDemoData] = useState<any>(null);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2500); };

  const openDemo = () => { setDemoData(initDemoData()); setDemoOpen(true); };

  const markPaid = (id: string) => {
    const d = { ...demoData, bills: demoData.bills.map((b: any) => b.id === id ? { ...b, paid: b.total, status: "paid" } : b) };
    localStorage.setItem(DEMO_KEY, JSON.stringify(d)); setDemoData(d); toast("Marked as paid");
  };

  const addTenant = () => {
    if (!newTenant.name || !newTenant.room || !newTenant.rent) return;
    const d = { ...demoData, tenants: [...demoData.tenants, { id: `t${Date.now()}`, name: newTenant.name, room: newTenant.room, rent: Number(newTenant.rent) }] };
    localStorage.setItem(DEMO_KEY, JSON.stringify(d)); setDemoData(d);
    setNewTenant({ name: "", room: "", rent: "" }); toast(`${newTenant.name} added`);
  };

  const generateBill = () => {
    if (!billForm.tenantId || !billForm.electricity) return;
    const t = demoData.tenants.find((x: any) => x.id === billForm.tenantId);
    if (!t) return;
    const total = t.rent + Number(billForm.electricity) + Number(billForm.water);
    const bill = { id: `b${Date.now()}`, tenantId: t.id, tenant: t.name, room: t.room, rent: t.rent, electricity: Number(billForm.electricity), water: Number(billForm.water), total, paid: 0, status: "pending" };
    const bills = demoData.bills.filter((b: any) => b.tenantId !== t.id);
    const d = { ...demoData, bills: [...bills, bill] };
    localStorage.setItem(DEMO_KEY, JSON.stringify(d)); setDemoData(d);
    setBillForm({ tenantId: "", electricity: "", water: "500" }); toast(`Bill for ${t.name} created`);
  };

  const cta = authed ? "/dashboard" : "/login";
  const ctaLabel = authed ? "Open dashboard" : "Get started free";

  const liveStats = [
    { value: stats && stats.landlords > 0 ? `${stats.landlords}+` : "—", label: "Landlords" },
    { value: stats && stats.tenants > 0 ? `${stats.tenants}+` : "—", label: "Active tenants" },
    { value: stats && stats.paymentsNPR > 0 ? fmtNPR(stats.paymentsNPR) : "—", label: "Rent collected" },
  ];

  const features = [
    { title: "Bikram Sambat native", body: "Every bill, payment, and report in BS. No date conversion anywhere." },
    { title: "Smart electricity", body: "Per-unit meter readings or direct amount. Previous reading remembered." },
    { title: "Carry-forward", body: "Unpaid balance or credit rolls into next month automatically." },
    { title: "Shareable bill links", body: "One tap generates a public page your tenant opens on WhatsApp." },
    { title: "Payment tracking", body: "Cash, eSewa, Khalti, bank. Partial payments. Full history per tenant." },
    { title: "Excel export", body: "Monthly summary, tenant ledger, payment log — three sheets, one click." },
  ];

  const faqs = [
    { q: "Is it free?", a: "Yes — no credit card, no plan limits, no expiry." },
    { q: "Does it work in Bikram Sambat?", a: "BS is the default. Every bill, payment date, and report uses BS 2080–2090." },
    { q: "Can tenants see bills without an account?", a: "Yes. Each bill has a public shareable link — no login needed for tenants." },
    { q: "What if a tenant overpays or underpays?", a: "The balance carries forward automatically into next month's bill." },
    { q: "Can I export my data?", a: "Yes. Excel export with summary, tenant overview, and payment ledger sheets." },
    { q: "Does it work on mobile?", a: "Yes — fully responsive, no app installation needed." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background text-xs font-medium px-4 py-2 rounded-full shadow-lg">
          {toastMsg}
        </div>
      )}

      <Nav authed={authed} onDemo={openDemo} />

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-20 sm:pb-28">
        <p className="text-xs uppercase tracking-widest text-primary font-medium mb-6">
          Bikram Sambat · Nepal
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.08] max-w-2xl">
          Rent billing,<br />done in seconds.
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
          Track tenants, generate BS bills, calculate electricity, record payments, share receipts on WhatsApp. Everything a Nepali landlord needs.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 items-center">
          <Link to={cta} className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-foreground/85 transition-colors">
            {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button onClick={openDemo} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <PlayCircle className="h-4 w-4 text-primary" /> Try live demo
          </button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Free · No install · Works on phone</p>
      </section>

      {/* ── Live stats ── */}
      <section className="border-y border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-3 gap-4 sm:gap-8">
          {liveStats.map(({ value, label }) => (
            <div key={label}>
              <div className="font-display text-2xl sm:text-3xl lg:text-4xl tabular-nums">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-10">What it does</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
          {features.map(({ title, body }) => (
            <div key={title}>
              <div className="w-4 h-px bg-primary mb-4" />
              <p className="text-sm font-semibold mb-1.5">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-10 border-t border-border">
          <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
            See all features <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-border bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-10">How it works</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {[
              { n: "1", t: "Add tenants", d: "Name, room, rent. One minute each." },
              { n: "2", t: "Create a bill", d: "Pick tenant and BS month. Enter meter reading — done." },
              { n: "3", t: "Record payments", d: "Cash, eSewa, Khalti. Partial or full." },
              { n: "4", t: "Share receipt", d: "WhatsApp the link. Tenant opens it, no app needed." },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-display text-4xl text-primary mb-4">{s.n}</div>
                <p className="text-sm font-semibold text-background mb-1.5">{s.t}</p>
                <p className="text-sm text-background/60 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-10 border-t border-background/10">
            <button onClick={openDemo} className="inline-flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
              <PlayCircle className="h-4 w-4 text-primary" /> Try the demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-10">FAQ</p>
        <div className="max-w-2xl divide-y divide-border">
          {faqs.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left text-sm font-medium hover:text-primary transition-colors"
              >
                {f.q}
                <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 ml-4 transition-transform duration-200 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && (
                <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl max-w-lg leading-tight">
            Your bills,<br />
            <span className="text-primary">already calculated.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-sm leading-relaxed">
            Free for every Nepali landlord. No installation. Works on any phone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Link to={cta} className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-foreground/85 transition-colors">
              {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button onClick={openDemo} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Try demo first
            </button>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── Demo Modal ── */}
      {demoOpen && demoData && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="bg-background border border-border rounded-xl w-full max-w-3xl my-4 overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="border-b border-border px-5 sm:px-7 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">Live Demo</span>
                </div>
                <p className="font-display text-lg">Hamro Rent Simulator</p>
              </div>
              <button onClick={() => setDemoOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-5 sm:px-7 flex gap-0.5 bg-muted/20">
              {(["dashboard", "tenant", "bill"] as const).map((t) => (
                <button key={t} onClick={() => setDemoTab(t)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                    demoTab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>
                  {t === "dashboard" ? "Dashboard" : t === "tenant" ? "Tenants" : "New Bill"}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-7">
              {/* Dashboard */}
              {demoTab === "dashboard" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: "Tenants", v: String(demoData.tenants.length) },
                      { l: "Collected", v: `रू ${demoData.bills.reduce((s: number, b: any) => s + b.paid, 0).toLocaleString()}` },
                      { l: "Outstanding", v: `रू ${demoData.bills.reduce((s: number, b: any) => s + Math.max(0, b.total - b.paid), 0).toLocaleString()}` },
                      { l: "Bills", v: String(demoData.bills.length) },
                    ].map(({ l, v }) => (
                      <div key={l} className="border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{l}</p>
                        <p className="font-display text-lg">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bills — Jestha 2082</div>
                    <div className="divide-y divide-border">
                      {demoData.bills.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{b.tenant} <span className="text-muted-foreground font-normal">· Room {b.room}</span></p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              रू {b.paid.toLocaleString()} paid of रू {b.total.toLocaleString()}
                              {b.total - b.paid > 0 && <span className="text-red-500 ml-1.5">· रू {(b.total - b.paid).toLocaleString()} due</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "partial" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {b.status}
                            </span>
                            {b.status !== "paid" && (
                              <button onClick={() => markPaid(b.id)} className="text-xs text-primary hover:underline">Mark paid</button>
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
                      {demoData.tenants.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">Room {t.room} · रू {t.rent.toLocaleString()}/mo</p>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Add Tenant</p>
                    <div className="grid sm:grid-cols-3 gap-3 mb-4">
                      <input className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Full name" value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} />
                      <input className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Room number" value={newTenant.room} onChange={e => setNewTenant({ ...newTenant, room: e.target.value })} />
                      <input type="number" className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Rent (रू)" value={newTenant.rent} onChange={e => setNewTenant({ ...newTenant, rent: e.target.value })} />
                    </div>
                    <button onClick={addTenant} className="text-sm bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/85 transition-colors">Add tenant</button>
                  </div>
                </div>
              )}

              {/* New Bill */}
              {demoTab === "bill" && (
                <div className="space-y-5">
                  <div className="border border-border rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Tenant</p>
                      <select className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary" value={billForm.tenantId} onChange={e => setBillForm({ ...billForm, tenantId: e.target.value })}>
                        <option value="">Select tenant…</option>
                        {demoData.tenants.map((t: any) => <option key={t.id} value={t.id}>{t.name} · Room {t.room}</option>)}
                      </select>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Electricity (रू)</p>
                        <input type="number" className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary" placeholder="1500" value={billForm.electricity} onChange={e => setBillForm({ ...billForm, electricity: e.target.value })} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Water (रू)</p>
                        <input type="number" className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary" value={billForm.water} onChange={e => setBillForm({ ...billForm, water: e.target.value })} />
                      </div>
                    </div>
                    {billForm.tenantId && billForm.electricity && (() => {
                      const t = demoData.tenants.find((x: any) => x.id === billForm.tenantId);
                      const total = t ? t.rent + Number(billForm.electricity) + Number(billForm.water) : 0;
                      return (
                        <div className="border-t border-border pt-3 space-y-1.5">
                          {[["Rent", t?.rent], ["Electricity", billForm.electricity], ["Water", billForm.water]].map(([k, v]) => (
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
                  <button onClick={generateBill} disabled={!billForm.tenantId || !billForm.electricity} className="text-sm bg-foreground text-background px-4 py-2 rounded-md hover:bg-foreground/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Create bill
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-border px-5 sm:px-7 py-4 flex items-center justify-between bg-muted/10">
              <p className="text-xs text-muted-foreground">Data saved in browser · clears after 3 days</p>
              <Link to={authed ? "/dashboard" : "/login"} onClick={() => setDemoOpen(false)} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                {authed ? "Go to dashboard" : "Create account"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
