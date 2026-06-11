/**
 * _admin.tsx — Super admin layout + auth gate.
 * Completely separate from _authenticated — admin has its own sidebar.
 */
import {
  createFileRoute,
  redirect,
  Link,
  Outlet,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, Users, FileText, CreditCard, Crown, Settings,
  LogOut, ShieldAlert, Menu, X,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users",     label: "Users",    icon: Users },
  { to: "/admin/tenants",   label: "Tenants",  icon: Users },
  { to: "/admin/bills",     label: "Bills",    icon: FileText },
  { to: "/admin/payments",  label: "Payments", icon: CreditCard },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: Crown },
  { to: "/admin/settings",  label: "Settings", icon: Settings },
];

function AdminLayout() {
  const nav = useNavigate();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verify admin server-side on every render
  const adminFn = useServerFn(checkIsAdmin);
  const { data: adminCheck, isLoading, error } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => adminFn(),
    retry: false,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    nav({ to: "/login" });
    toast.success("Signed out");
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
          <ShieldAlert className="h-5 w-5 animate-pulse" />
          Verifying admin access…
        </div>
      </div>
    );

  if (error || !adminCheck?.isAdmin)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You don't have super admin access to this area.
          </p>
          <Button onClick={() => nav({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );

  if (!adminCheck.serviceKeyConfigured)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="h-12 w-12 text-warning mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Admin panel not configured</h1>
          <p className="text-sm text-muted-foreground mb-3">
            You <b>are</b> a super admin, but this deployment is missing the{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            environment variable, which admin operations require.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Get it from Supabase Dashboard → Project Settings → API → <b>service_role</b>,
            add it as a server-side environment variable in your hosting provider
            (e.g. Vercel → Settings → Environment Variables), then redeploy.
            Never expose it with a <code className="bg-muted px-1 rounded">VITE_</code> prefix.
          </p>
          <Button onClick={() => nav({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Admin Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-destructive/30 bg-destructive/5 backdrop-blur-sm no-print">
        <div className="px-4 py-3 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Link to="/admin/dashboard" className="flex items-center gap-2 font-display font-semibold text-base hover:opacity-80 transition-opacity">
              <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0" />
              <span>Hamro Rent</span>
              <span className="text-xs font-semibold bg-destructive text-destructive-foreground rounded px-1.5 py-0.5">
                SUPER ADMIN
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              ← Back to app
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-xs gap-1.5 h-8">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-56 bg-card border-r border-border overflow-y-auto
          transition-transform duration-200
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          mt-[57px] lg:mt-0
        `}>
          <nav className="flex flex-col gap-0.5 p-3 pt-4">
            {NAV.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                activeProps={{ className: "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive-foreground bg-destructive/90 shadow-sm" }}
              >
                <l.icon className="h-4 w-4 flex-shrink-0" />
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 lg:hidden z-30 mt-[57px]" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
