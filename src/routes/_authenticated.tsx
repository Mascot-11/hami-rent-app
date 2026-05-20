import { createFileRoute, redirect, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Download, Settings, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/hamro-rent-logo.jpeg";

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
  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    nav({ to: "/login" });
    toast.success("Signed out");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tenants", label: "Tenants", icon: Users },
    { to: "/bills/new", label: "New Bill", icon: Plus },
    { to: "/export", label: "Export", icon: Download },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card no-print sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0">
            <Link to="/dashboard" className="flex items-center gap-2 font-display text-base sm:text-xl font-semibold flex-shrink-0">
              <img src={logo} alt="Hamro Rent" className="h-7 sm:h-9 w-7 sm:w-9 rounded-full object-cover" />
              <span className="hidden sm:inline">Hamro Rent</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-xs sm:text-sm h-8 sm:h-9">
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
          <nav className="flex gap-0.5 flex-wrap">
            {links.map((l) => (
              <Link key={l.to} to={l.to}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                activeProps={{ className: "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium text-primary bg-accent" }}>
                <l.icon className="h-4 w-4" /><span className="hidden sm:inline">{l.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
