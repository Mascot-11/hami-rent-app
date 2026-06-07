import { createFileRoute, redirect, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { usePWAContext } from "@/components/PWAProvider";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Download, Settings, LogOut,
  Plus, Menu, X, Home, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/hamro-rent-logo.jpeg";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tenants", label: "Tenants", icon: Users },
  { to: "/bills", label: "Bills", icon: Receipt },
  { to: "/bills/new", label: "New Bill", icon: Plus },
  { to: "/export", label: "Export", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings },
];

function AuthLayout() {
  const nav = useNavigate();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pwa = usePWAContext();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    nav({ to: "/login" });
    toast.success("Signed out");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm no-print sticky top-0 z-50">
        <div className="px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-9 w-9"
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 font-display text-lg font-semibold flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-border">
                <img src={logo} alt="Hamro Rent" className="h-full w-full object-cover" />
              </div>
              <span className="hidden sm:inline">Hamro Rent</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Online / sync indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              {!pwa.isOnline ? (
                <span className="flex items-center gap-1 text-warning">
                  <WifiOff className="h-3.5 w-3.5" /> Offline
                </span>
              ) : pwa.pendingSync > 0 ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Syncing…
                </span>
              ) : pwa.lastSynced ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Wifi className="h-3.5 w-3.5 text-success" />
                </span>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-xs sm:text-sm h-8 sm:h-9 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-60 bg-sidebar border-r border-sidebar-border overflow-y-auto
            transition-transform duration-200 ease-in-out
            lg:relative lg:translate-x-0 lg:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            mt-[57px] lg:mt-0
          `}
          aria-label="Main navigation"
        >
          {/* Logo repeated in sidebar for desktop */}
          <div className="hidden lg:flex items-center gap-2.5 px-5 py-4 border-b border-sidebar-border">
            <div className="h-7 w-7 rounded-md overflow-hidden ring-1 ring-sidebar-border">
              <img src={logo} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-display font-semibold text-sidebar-foreground">Hamro Rent</span>
          </div>

          <nav className="flex flex-col gap-0.5 p-3 pt-4" aria-label="App navigation">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                activeProps={{
                  className: "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-primary-foreground bg-sidebar-primary shadow-sm",
                }}
              >
                <l.icon className="h-4 w-4 flex-shrink-0" />
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border lg:hidden">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-30 mt-[57px]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Main ────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 py-5 sm:py-7 max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>

          <footer className="border-t border-border bg-card/50 py-4 px-5 text-center no-print">
            <p className="text-xs text-muted-foreground">
              Developed by{" "}
              <a
                href="https://www.shreeyushdhungana.com.np/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Shreeyush Dhungana
              </a>
              {" "}· © 2026 Hamro Rent
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

