import { createFileRoute, redirect, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { AdSlot } from "@/components/AdSlot";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Download, Settings, LogOut,
  Menu, X, ChevronRight, UserCircle, ShieldAlert,
  AlertTriangle, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/hamro-rent-logo.jpeg";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";
import { getMySubscription } from "@/lib/subscription.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const nav = useNavigate();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const adminFn = useServerFn(checkIsAdmin);
  const { data: adminData } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => adminFn().catch(() => null),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const isAdmin = !!adminData?.isAdmin;

  // ─── Subscription state ───────────────────────────────────────────────────
  const subFn = useServerFn(getMySubscription);
  const { data: sub } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => subFn(),
    staleTime: 60_000,
  });

  // Expired popup: show once per session, but re-show on page load as long as expired
  const [expiredDismissed, setExpiredDismissed] = useState(false);
  const isExpired = !!sub && sub.plan !== "free" && sub.expired;

  // Days remaining: show glow banner if ≤ 7 days left and not yet expired
  const daysLeft = (() => {
    if (!sub?.expires_at || sub.expired || sub.plan === "free") return null;
    const ms = new Date(sub.expires_at).getTime() - Date.now();
    const d = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return d >= 0 && d <= 7 ? d : null;
  })();

  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.invalidate();
    nav({ to: "/login" });
    toast.success("Signed out");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tenants", label: "Tenants", icon: Users },
    { to: "/export", label: "Export", icon: Download },
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* ── Expired Subscription Modal — persistent until renewed ───────────── */}
      <Dialog
        open={isExpired && !expiredDismissed}
        onOpenChange={(open) => {
          // Only allow dismiss via the button; clicking outside or pressing Esc
          // still keeps it open (persistent). We achieve this by ignoring `false`.
          if (!open) return;
        }}
      >
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl">
              Your subscription has expired
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-sm text-muted-foreground space-y-3 px-2">
            <p>
              Your <span className="font-semibold capitalize text-foreground">{sub?.plan}</span> plan
              expired on{" "}
              <span className="font-semibold text-foreground">
                {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—"}
              </span>.
              Some features have been restricted.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-left space-y-1">
              <p className="font-medium text-foreground">What's affected:</p>
              <p>• Bill sharing with tenants (Share link, WhatsApp)</p>
              <p>• Additional tenant slots beyond the free limit</p>
              <p>• Priority support</p>
            </div>
            <p className="text-xs">Renew your plan to restore full access.</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full">
              <Link to="/pricing">Renew subscription</Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setExpiredDismissed(true)}
            >
              Continue with limited access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Days-remaining glow banner ───────────────────────────────────────── */}
      {daysLeft !== null && (
        <div
          className="relative z-50 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-amber-900"
          style={{
            background: "linear-gradient(90deg, #fef3c7, #fde68a, #fef3c7)",
            boxShadow: "0 0 12px 2px rgba(251,191,36,0.55), 0 0 32px 4px rgba(251,191,36,0.25)",
            animation: "subscriptionGlow 2.5s ease-in-out infinite",
          }}
        >
          <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
          <span>
            {daysLeft === 0
              ? "Your subscription expires today!"
              : `Your ${sub?.plan} subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`}
            {" "}
            <Link to="/pricing" className="underline font-semibold text-amber-800 hover:text-amber-900">
              Renew now
            </Link>
          </span>
          <style>{`
            @keyframes subscriptionGlow {
              0%, 100% { box-shadow: 0 0 12px 2px rgba(251,191,36,0.55), 0 0 32px 4px rgba(251,191,36,0.25); }
              50% { box-shadow: 0 0 22px 6px rgba(251,191,36,0.85), 0 0 48px 10px rgba(251,191,36,0.45); }
            }
          `}</style>
        </div>
      )}
      {/* Top Bar */}
      <header className="border-b bg-card no-print sticky top-0 z-50 shadow-sm">
        <div className="px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-8 w-8 flex-shrink-0"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold text-base sm:text-lg flex-shrink-0 hover:opacity-80 transition-opacity">
              <img src={logo} alt="Hamro Rent" className="h-7 w-7 rounded-full object-cover ring-1 ring-border" />
              <span className="hidden sm:inline">Hamro Rent</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              disabled={signingOut}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              {signingOut
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <LogOut className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-60 bg-card border-r overflow-y-auto
          transition-transform duration-200 ease-in-out flex flex-col
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          mt-14 lg:mt-0 max-h-[calc(100vh-56px)] lg:max-h-full shadow-xl lg:shadow-none
        `}>
          <nav className="flex-1 flex flex-col gap-0.5 p-3 pt-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors group"
                activeProps={{ className: "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary" }}
              >
                <l.icon className="h-4 w-4 flex-shrink-0" />
                <span>{l.label}</span>
                <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
              </Link>
            ))}
          </nav>
          <AdminPanelLink onNavigate={() => setSidebarOpen(false)} />
          <div className="p-3 border-t">
            <button
              onClick={() => { setSidebarOpen(false); signOut(); }}
              disabled={signingOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full disabled:opacity-60"
            >
              {signingOut
                ? <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                : <LogOut className="h-4 w-4 flex-shrink-0" />}
              <span>{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-30 mt-14"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
          <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6">
            <div className="max-w-6xl mx-auto">
              <Outlet />
              <AdSlot placement="dashboard" className="mt-8" />
            </div>
          </div>
          <footer className="border-t bg-card no-print">
            <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Hamro Rent 🇳🇵</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                <Link to="/tenants" className="hover:text-primary transition-colors">Tenants</Link>
                <Link to="/export" className="hover:text-primary transition-colors">Export</Link>
                <Link to="/settings" className="hover:text-primary transition-colors">Settings</Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}


/** Shows a Super Admin shortcut in the sidebar only for admins. */
function AdminPanelLink({ onNavigate }: { onNavigate: () => void }) {
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-sidebar"],
    queryFn: async () => {
      const { data } = await supabase.rpc("is_current_user_super_admin");
      return data === true;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  if (!isAdmin) return null;
  return (
    <div className="p-3 border-t">
      <Link
        to="/admin/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
      >
        <ShieldAlert className="h-4 w-4 flex-shrink-0" />
        Super Admin
      </Link>
    </div>
  );
}
