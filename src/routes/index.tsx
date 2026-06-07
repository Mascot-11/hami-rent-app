import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calculator, Users, FileText, Share2, Download, Shield,
  ArrowRight, Check, Calendar, Zap, Receipt, BarChart3, Menu, X,
} from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hamro Rent — Rent Management for Nepali Landlords" },
      { name: "description", content: "Track tenants, electricity, water, and monthly bills in Bikram Sambat. Automatic calculations, shareable bill links, and clean exports — built for Nepal." },
      { property: "og:title", content: "Hamro Rent — Rent Management for Nepali Landlords" },
      { property: "og:description", content: "Automatic monthly bills, BS calendar, tenant tracking, and shareable receipts." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [authed, setAuthed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, s) => setAuthed(!!s)
    );
    return () => subscription.unsubscribe();
  }, []);

  const ctaTo = authed ? "/dashboard" : "/login";
  const ctaLabel = authed ? "Open dashboard" : "Get started free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Hamro Rent" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-xl">Hamro Rent</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#why" className="hover:text-foreground transition-colors">Why Hamro Rent</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {!authed && (
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
            )}
            <Link to={ctaTo}>
              <Button size="sm" className="rounded-full px-4">{ctaLabel}</Button>
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 -mr-2"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-3 flex flex-col gap-3 text-sm">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#why" onClick={() => setMenuOpen(false)}>Why Hamro Rent</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for Nepali landlords · Bikram Sambat native
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Rent, electricity & water bills —{" "}
              <span className="text-primary">calculated for you.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Stop juggling notebooks and calculators. Hamro Rent tracks every
              tenant, generates monthly bills in Bikram Sambat, handles meter
              readings and carry-forward balances, and sends a clean shareable
              receipt to your tenant — automatically.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={ctaTo}>
                <Button size="lg" className="rounded-full px-6 h-12 text-base">
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" className="rounded-full px-6 h-12 text-base">
                  See how it works
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Free to start</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No installation</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Works on mobile</span>
            </div>
          </div>

          {/* Mock bill preview */}
          <div className="mt-16 sm:mt-20 relative">
            <div className="absolute -inset-6 sm:-inset-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-3xl blur-2xl" />
            <Card className="relative max-w-3xl mx-auto p-6 sm:p-8 shadow-2xl shadow-black/10 border-2">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Bill receipt</div>
                  <div className="font-display text-2xl mt-1">Ram Bahadur · Room 2B</div>
                  <div className="text-sm text-muted-foreground">Jestha 2082</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total due</div>
                  <div className="font-display text-3xl text-primary">रू 14,250</div>
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  ["Room rent", "रू 10,000"],
                  ["Electricity (118 units × ₨15)", "रू 1,770"],
                  ["Water", "रू 500"],
                  ["Previous balance", "रू 1,980"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Share2 className="h-3.5 w-3.5" /> Shareable link auto-generated</span>
                <span className="px-2 py-1 rounded-full bg-warning/15 text-warning-foreground font-medium">Pending</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats / trust band */}
      <section className="border-y bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["BS 2080–2090", "Calendar coverage"],
            ["3 sheets", "Excel export"],
            ["1 click", "Share to WhatsApp"],
            ["100%", "Auto-calculated"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-2xl sm:text-3xl text-foreground">{n}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-primary font-medium">Features</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl">Everything you'd write in a notebook — done for you.</h2>
          <p className="mt-4 text-muted-foreground text-lg">Designed around the real workflow of a Nepali landlord.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { i: Users, t: "Tenant register", d: "Names, rooms, phone, move-in date, documents — one tidy list with lifetime totals." },
            { i: Calendar, t: "Bikram Sambat native", d: "Every bill, payment and report uses the BS calendar. No mental conversions." },
            { i: Zap, t: "Electricity made simple", d: "Per-unit readings or direct amount. Previous reading carries forward automatically." },
            { i: Calculator, t: "Auto-calculations", d: "Rent + electricity + water + extra charges + previous balance — all summed for you." },
            { i: Receipt, t: "Carry-forward built in", d: "Unpaid balance from last month or overpayment credit flows into the next bill automatically." },
            { i: Share2, t: "Shareable bill links", d: "One tap to send a clean public bill page to your tenant on WhatsApp." },
            { i: Download, t: "Excel & PDF exports", d: "Monthly summary, tenant overview, payment ledger — and printable PDF bills." },
            { i: BarChart3, t: "Dashboard at a glance", d: "Active tenants, expected, collected, pending — for the current BS month." },
            { i: Shield, t: "Your data, secured", d: "Private to your account. Backup and restore your whole ledger as JSON anytime." },
          ].map(({ i: Icon, t, d }) => (
            <Card key={t} className="p-6 hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-display text-xl">{t}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-primary font-medium">How it works</div>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl">From sign-up to first bill in 5 minutes.</h2>
          </div>

          <div className="mt-14 grid md:grid-cols-4 gap-8 md:gap-6">
            {[
              { n: "01", t: "Create your account", d: "Sign up with email. Your ledger is private to you." },
              { n: "02", t: "Add your tenants", d: "Name, room, phone, monthly rent. Takes a minute per tenant." },
              { n: "03", t: "Generate a bill", d: "Pick a tenant and BS month. Punch in meter readings and you're done." },
              { n: "04", t: "Share & collect", d: "Send the link, record payments, watch your dashboard update." },
            ].map((s, i) => (
              <div key={s.n} className="relative">
                <div className="font-display text-5xl text-primary">{s.n}</div>
                <div className="mt-3 font-display text-xl">{s.t}</div>
                <p className="mt-2 text-sm text-background/70 leading-relaxed">{s.d}</p>
                {i < 3 && (
                  <ArrowRight className="hidden md:block absolute top-4 -right-3 h-5 w-5 text-background/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-medium">Why Hamro Rent</div>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl">Built for the way Nepali landlords actually work.</h2>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
              Most rent apps assume the Gregorian calendar, ignore meter
              readings, and don't understand how previous-month balances roll
              forward. Hamro Rent was designed from day one for Nepali
              households and small landlords.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                ["Bikram Sambat throughout — Baisakh to Chaitra.", "No date conversion gymnastics."],
                ["Per-unit electricity with previous reading memory.", "Just enter this month's reading."],
                ["Carry-forward credits and dues, automatic.", "Last month's leftover slides into this month's bill."],
                ["A receipt your tenant can actually read.", "Public link, mobile-friendly, no login needed."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{t}</div>
                    <div className="text-sm text-muted-foreground">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-8 border-2 bg-gradient-to-br from-muted/30 to-background">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium uppercase tracking-wider">Monthly summary</span>
            </div>
            {[
              ["Active tenants", "8"],
              ["Expected this month", "रू 96,400"],
              ["Collected", "रू 82,150"],
              ["Pending", "रू 14,250"],
            ].map(([k, v], i, arr) => (
              <div key={k} className={`flex justify-between py-3.5 ${i < arr.length - 1 ? "border-b" : ""}`}>
                <span className="text-muted-foreground">{k}</span>
                <span className="font-display text-xl tabular-nums">{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/40 border-y">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-primary font-medium">FAQ</div>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl">Common questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Is it really free?", a: "Yes — sign up and use it. No credit card required." },
              { q: "Does it work in Bikram Sambat?", a: "Yes. Every bill, payment, and report is BS native. We support BS 2080 to 2090." },
              { q: "Can my tenants see their bills without an account?", a: "Yes. Every bill gets a public shareable link you can send on WhatsApp." },
              { q: "What if my tenant overpays or underpays?", a: "The balance carries forward automatically — credit or due — into next month's bill." },
              { q: "Can I export my data?", a: "Yes. Excel exports with 3 sheets (summary, tenants, payments) and a full JSON backup anytime." },
              { q: "Will it work on my phone?", a: "Yes. The whole app is mobile-friendly. No installation needed." },
            ].map((f) => (
              <details key={f.q} className="group bg-background rounded-xl border p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-medium">
                  {f.q}
                  <span className="text-primary text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <h2 className="font-display text-4xl sm:text-6xl leading-tight">
          Your next month's bills,<br />
          <span className="text-primary">already calculated.</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto">
          Join Nepali landlords running their rentals on Hamro Rent.
        </p>
        <Link to={ctaTo} className="inline-block mt-8">
          <Button size="lg" className="rounded-full px-8 h-12 text-base">
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-7 w-7 rounded-full object-cover" />
            <span className="font-display text-base text-foreground">Hamro Rent</span>
            <span>· Rental Management, Reinvented.</span>
          </div>
          <div>
            Built by{" "}
            <a href="https://www.shreeyushdhungana.com.np/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Shreeyush Dhungana
            </a>
            {" "}· © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
