import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/hamro-rent-logo.jpeg";

type ActivePage = "home" | "features" | "pricing" | "about";

const NAV_LINKS: { to: string; label: string; key: ActivePage }[] = [
  { to: "/", label: "Home", key: "home" },
  { to: "/features", label: "Features", key: "features" },
  { to: "/pricing", label: "Pricing", key: "pricing" },
  { to: "/about", label: "About", key: "about" },
];

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
              Demo
            </button>
          )}
        </nav>

        {/* Right-side CTAs */}
        <div className="flex items-center gap-2">
          {authed ? (
            <Link to="/dashboard">
              <Button size="sm" className="rounded-full px-5">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/login">
                <Button size="sm" className="rounded-full px-5">
                  Get started
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
              Demo
            </button>
          )}
        </div>
      )}
    </header>
  );
}
