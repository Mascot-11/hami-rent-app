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
import { useLanguage } from "@/lib/language-context";
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
  const { t } = useLanguage();
  const fn = useServerFn(getPublicStats);
  const { data, isLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });

  const stats = [
    { icon: <Building2 className="h-5 w-5" />, value: isLoading ? "…" : data && data.landlords > 0 ? `${data.landlords}+` : t("about.growing"), label: t("about.stats.1") },
    { icon: <Users className="h-5 w-5" />, value: isLoading ? "…" : data && data.tenants > 0 ? `${data.tenants}+` : t("about.growing"), label: t("about.stats.2") },
    { icon: <Banknote className="h-5 w-5" />, value: isLoading ? "…" : data && data.paymentsNPR > 0 ? fmtNPR(data.paymentsNPR) : t("about.growing"), label: t("about.stats.3") },
    { icon: <CheckCircle2 className="h-5 w-5" />, value: "100%", label: t("about.stats.4") },
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
            <Heart className="h-3.5 w-3.5" /> {t("about.badge")}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mb-6">
            {t("about.hero.title")} <span className="text-primary">{t("about.hero.title2")}</span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {t("about.hero.sub")}
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
                {t("about.story.title")}
              </h2>
              <div className="space-y-5 text-background/75 text-sm sm:text-base leading-relaxed">
                <p>{t("about.story.p1")}</p>
                <p>{t("about.story.p2")}</p>
                <p>{t("about.story.p3")}</p>
                <p className="text-background font-semibold text-base sm:text-lg">{t("about.story.pKey")}</p>
              </div>
            </div>
            <div className="space-y-5">
              {[
                { icon: <Lightbulb className="h-5 w-5" />, title: t("about.insight.title"), body: t("about.insight.body") },
                { icon: <Code2 className="h-5 w-5" />, title: t("about.build.title"), body: t("about.build.body") },
                { icon: <Heart className="h-5 w-5" />, title: t("about.mission.title"), body: t("about.mission.body") },
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
        <h2 className="font-display text-3xl sm:text-4xl max-w-2xl leading-tight mb-10">{t("about.missionSec.title")}</h2>
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
          <h2 className="font-display text-3xl sm:text-4xl mb-10">{t("about.builder.title")}</h2>
          <Card className="p-6 sm:p-8 max-w-2xl">
            <div className="flex items-start gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-display text-2xl">S</div>
              <div className="flex-1">
                <div className="font-display text-xl mb-0.5">Shreeyush Dhungana</div>
                <div className="text-sm text-primary font-medium mb-3">{t("about.builder.role")}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t("about.builder.bio")}</p>
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
        <h2 className="font-display text-3xl sm:text-4xl mb-4">{t("about.cta.title")}</h2>
        <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">{t("about.cta.sub")}</p>
        <Link to="/login">
          <Button size="lg" className="rounded-full px-8 h-12 shadow-lg shadow-primary/20">
            {t("about.cta.btn")} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}

export function PublicFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="" className="h-6 w-6 rounded-full object-cover" />
          <span className="font-display font-semibold text-foreground">Hamro Rent</span>
        </Link>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/" className="hover:text-foreground transition-colors">{t("pub.footer.home")}</Link>
          <Link to="/features" className="hover:text-foreground transition-colors">{t("pub.footer.features")}</Link>
          <Link to="/about" className="hover:text-foreground transition-colors">{t("pub.footer.about")}</Link>
          <Link to="/login" className="hover:text-foreground transition-colors">{t("pub.footer.signIn")}</Link>
        </div>
        <span className="text-xs">© 2082 Hamro Rent</span>
      </div>
    </footer>
  );
}
