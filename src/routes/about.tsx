import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicStats } from "@/lib/public-stats.functions";
import logo from "@/assets/hamro-rent-logo.jpeg";
import { SiteHeader } from "@/components/SiteHeader";
import {
  ArrowRight, Building2, Users, Banknote, Code2,
  Lightbulb, Heart, CheckCircle2, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Hamro Rent — Built in Nepal for Nepali Landlords" },
      { name: "description", content: "Hamro Rent was built from real experience managing Nepali rental properties. Our story, mission, and the team behind the platform." },
      { property: "og:title", content: "About Hamro Rent" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: AboutPage,
});

function fmtNPR(n: number) {
  if (n >= 10_000_000) return `रू ${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `रू ${(n / 100_000).toFixed(1)} L`;
  if (n >= 1_000)      return `रू ${(n / 1_000).toFixed(0)}K+`;
  return `रू ${n.toLocaleString()}`;
}

// Public header is shared across every marketing page — see @/components/SiteHeader
const PublicNav = SiteHeader;

function AboutPage() {
  const fn = useServerFn(getPublicStats);
  const { data, isLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });

  const stats = [
    { icon: <Building2 className="h-5 w-5" />, value: isLoading ? "…" : data && data.landlords > 0 ? `${data.landlords}+` : "Growing", label: "Landlords on the platform" },
    { icon: <Users className="h-5 w-5" />, value: isLoading ? "…" : data && data.tenants > 0 ? `${data.tenants}+` : "Growing", label: "Active tenants tracked" },
    { icon: <Banknote className="h-5 w-5" />, value: isLoading ? "…" : data && data.paymentsNPR > 0 ? fmtNPR(data.paymentsNPR) : "Growing", label: "Rent collected via platform" },
    { icon: <CheckCircle2 className="h-5 w-5" />, value: "100%", label: "Bikram Sambat native" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="about" />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-16 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase mb-8">
            <Heart className="h-3.5 w-3.5" /> Built in Nepal · For Nepal
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mb-6">
            Hamro Rent was built from a <span className="text-primary">real problem.</span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Not a side project. Not an experiment. A direct answer to the chaos of managing rental properties in Nepal — with paper ledgers, mental Bikram Sambat conversions, and bills calculated on a phone's calculator app.
          </p>
        </div>
      </section>

      {/* Live stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-primary/8 border border-primary/20 rounded-2xl p-5 sm:p-6">
              <div className="text-primary mb-3">{s.icon}</div>
              <div className={`font-display text-2xl sm:text-3xl font-bold mb-1 transition-all ${isLoading ? "opacity-40" : ""}`}>{s.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story — dark section */}
      <section className="bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">Our Story</div>
              <h2 className="font-display text-3xl sm:text-4xl leading-tight mb-6">
                From a landlord's frustration to Nepal's rent platform.
              </h2>
              <div className="space-y-5 text-background/75 text-sm sm:text-base leading-relaxed">
                <p>Managing rental properties in Nepal means living in two worlds — the Bikram Sambat calendar your tenants use for everything, and the chaos of tracking who paid, how much, and when.</p>
                <p>Every month: notebooks for each tenant, a phone calculator for electricity units, manual addition of water charges, remembering which tenant still owed रू 800 from last month. Then WhatsApp messages trying to explain the bill.</p>
                <p>We tried spreadsheets. We tried generic rent apps from India. Nothing handled BS months natively. Nothing understood that the "Jestha bill" contains Baisakh's electricity readings. Nothing carried forward the previous balance automatically.</p>
                <p className="text-background font-semibold text-base sm:text-lg">So we built exactly what was missing.</p>
              </div>
            </div>
            <div className="space-y-5">
              {[
                { icon: <Lightbulb className="h-5 w-5" />, title: "The insight", body: "Nepal's rental workflow is unique — BS calendar, carry-forward balances, per-unit NEA electricity, and tenants who need a receipt on WhatsApp. No existing tool understood this." },
                { icon: <Code2 className="h-5 w-5" />, title: "The build", body: "Designed around real landlord workflows. BS 2080–2090 calendar. Per-unit meter readings with automatic carry-forward. Payment tracking with partial payments. One-tap shareable bill links." },
                { icon: <Heart className="h-5 w-5" />, title: "The mission", body: "Give every Nepali landlord — whether they have 2 rooms or 20 — the same professional billing infrastructure, completely free." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 bg-background/5 rounded-2xl p-5 border border-background/10">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">{item.icon}</div>
                  <div>
                    <div className="font-display text-lg text-background mb-1">{item.title}</div>
                    <p className="text-sm text-background/65 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">Our Mission</div>
        <h2 className="font-display text-3xl sm:text-4xl max-w-2xl leading-tight mb-10">Why we built Hamro Rent for Nepal specifically.</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: "Bikram Sambat — not an afterthought", body: "Every bill, every payment date, every report uses BS. This isn't a Gregorian app with a conversion layer bolted on. BS is the foundation." },
            { title: "The carry-forward problem — solved", body: "Tenant paid रू 9,500 but owed रू 10,000? Next month's bill automatically shows the रू 500 due. No manual tracking, no forgetting." },
            { title: "NEA electricity, correctly calculated", body: "Enter previous and current meter readings. The app calculates units consumed, applies the rate, adds the service charge. You just read the meter." },
            { title: "Receipts your tenants can actually open", body: "Every bill generates a public link. Tenants open it on WhatsApp, see a clean professional bill — no app download, no account needed." },
            { title: "All your data, private to you", body: "Your tenant list, payment history, and bills are private to your account. No one else can see them. Export your full ledger anytime." },
            { title: "Free — because it should be", body: "Small landlords shouldn't pay SaaS fees for basic billing. Hamro Rent is free to use. Professional tools shouldn't be for big businesses only." },
          ].map((item) => (
            <Card key={item.title} className="p-5 sm:p-6 hover:border-primary/30 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm sm:text-base mb-1.5">{item.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Founder */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">The Builder</div>
          <h2 className="font-display text-3xl sm:text-4xl mb-10">Built by someone who needed it.</h2>
          <Card className="p-6 sm:p-8 max-w-2xl">
            <div className="flex items-start gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-display text-2xl">S</div>
              <div className="flex-1">
                <div className="font-display text-xl mb-0.5">Shreeyush Dhungana</div>
                <div className="text-sm text-primary font-medium mb-3">Founder & Developer</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">Built Hamro Rent to solve a real problem — tracking rent, electricity, and water for Nepali tenants without the chaos of notebooks and calculators. Every feature was driven by actual landlord workflows.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Full-stack development", "Nepal real estate", "Bikram Sambat systems"].map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 bg-primary/8 text-primary rounded-full font-medium">{tag}</span>
                  ))}
                </div>
                <a href="https://www.shreeyushdhungana.com.np/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                  shreeyushdhungana.com.np <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl mb-4">Ready to bring order to your rentals?</h2>
        <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">Free to start. No installation. Works on your phone. Bikram Sambat throughout.</p>
        <Link to="/login">
          <Button size="lg" className="rounded-full px-8 h-12 shadow-lg shadow-primary/20">
            Create free account <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="" className="h-6 w-6 rounded-full object-cover" />
          <span className="font-display font-semibold text-foreground">Hamro Rent</span>
        </Link>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link>
        </div>
        <span className="text-xs">© 2082 Hamro Rent</span>
      </div>
    </footer>
  );
}
