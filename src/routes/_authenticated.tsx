import { createFileRoute, redirect, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { AdSlot } from "@/components/AdSlot";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Download, Settings, LogOut,
  Plus, Menu, X, ChevronRight, UserCircle, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/hamro-rent-logo.jpeg";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";

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
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
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
            <Link to="/bills/new" className="hidden sm:flex">
              <Button size="sm" className="h-8 rounded-full px-4 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Bill
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
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
          <div className="p-3 border-t">
            <button
              onClick={() => { setSidebarOpen(false); signOut(); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Sign out</span>
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
                <Link to="/bills/new" className="hover:text-primary transition-colors">New Bill</Link>
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
