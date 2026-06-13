import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/hamro-rent-logo.jpeg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/language-context";

type ActivePage = "home" | "features" | "pricing" | "about";

function useNavLinks() {
  const { t } = useLanguage();
  return [
    { to: "/", label: t("pub.nav.home"), key: "home" as ActivePage },
    { to: "/features", label: t("pub.nav.features"), key: "features" as ActivePage },
    { to: "/pricing", label: t("pub.nav.pricing"), key: "pricing" as ActivePage },
    { to: "/about", label: t("pub.nav.about"), key: "about" as ActivePage },
  ];
}

/**
 * Single source of truth for the public/marketing site header.
 * Used across the landing page and all content pages so the nav bar is
 * identical everywhere. Auth state is resolved internally, so callers don't
 * need to pass it. The landing page may pass `onDemo` to surface its demo CTA.
 */
export function SiteHeader({
  active,
  onDemo,
}: {
  active?: ActivePage;
  onDemo?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const NAV_LINKS = useNavLinks();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const linkClass = (key: ActivePage) =>
    active === key
      ? "text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground transition-colors";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="Hamro Rent"
            className="h-7 w-7 rounded-full object-cover"
          />
          <span className="font-display text-base font-semibold tracking-tight">
            Hamro Rent
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV_LINKS.map((l) => (
            <Link key={l.key} to={l.to} className={linkClass(l.key)}>
              {l.label}
            </Link>
          ))}
          {onDemo && (
            <button
              onClick={onDemo}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("pub.nav.demo")}
            </button>
          )}
        </nav>

        {/* Right-side CTAs */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium px-2.5 border-dashed"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{lang === "ne" ? "🇳🇵 नेपाली" : "🇬🇧 EN"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => setLang("en")}
                className={lang === "en" ? "bg-accent font-medium" : ""}
              >
                <span className="mr-2">🇬🇧</span> English
                {lang === "en" && <span className="ml-auto text-[10px] text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLang("ne")}
                className={lang === "ne" ? "bg-accent font-medium" : ""}
              >
                <span className="mr-2">🇳🇵</span> नेपाली
                {lang === "ne" && <span className="ml-auto text-[10px] text-primary">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {authed ? (
            <Link to="/dashboard">
              <Button size="sm" className="rounded-full px-5">
                {t("pub.nav.dashboard")}
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  {t("pub.nav.signIn")}
                </Button>
              </Link>
              <Link to="/login">
                <Button size="sm" className="rounded-full px-5">
                  {t("pub.nav.getStarted")}
                </Button>
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md hover:bg-accent"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-background/95 px-4 py-4 flex flex-col gap-4 text-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.key}
              to={l.to}
              onClick={() => setOpen(false)}
              className={linkClass(l.key)}
            >
              {l.label}
            </Link>
          ))}
          {onDemo && (
            <button
              onClick={() => {
                setOpen(false);
                onDemo();
              }}
              className="text-left text-muted-foreground hover:text-foreground"
            >
              {t("pub.nav.demo")}
            </button>
          )}
          {/* Mobile language toggle */}
          <div className="flex gap-2 pt-1 border-t">
            <button
              onClick={() => setLang("en")}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors
                ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setLang("ne")}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors
                ${lang === "ne" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              🇳🇵 नेपाली
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
