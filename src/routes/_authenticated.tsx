import { createFileRoute, redirect, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Download, Settings, LogOut, Plus, Menu, X } from "lucide-react";
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

function AuthLayout() {
  const nav = useNavigate();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
      {/* Top Bar */}
      <header className="border-b bg-card no-print sticky top-0 z-50">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-9 w-9"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2 font-display text-base sm:text-xl font-semibold flex-shrink-0">
              <img src={logo} alt="Hamro Rent" className="h-7 sm:h-9 w-7 sm:w-9 rounded-full object-cover" />
              <span className="hidden sm:inline">Hamro Rent</span>
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-xs sm:text-sm h-8 sm:h-9">
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border overflow-y-auto
          transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          mt-[73px] lg:mt-0 max-h-[calc(100vh-73px)] lg:max-h-full
        `}>
          <nav className="flex flex-col gap-1 p-4">
            {links.map((l) => (
              <Link 
                key={l.to} 
                to={l.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
                activeProps={{ className: "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-sidebar-primary-foreground bg-sidebar-primary" }}>
                <l.icon className="h-5 w-5 flex-shrink-0" />
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 lg:hidden z-30 mt-[73px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden w-full">
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-6">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t bg-card text-center py-6 px-4 text-sm text-muted-foreground no-print">
            <div className="space-y-2">
              <p className="font-medium">Hamro Rent — Rental Management, Reinvented.</p>
              <p>
                Developed by{" "}
                <a 
                  href="https://www.shreeyushdhungana.com.np/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline transition-colors"
                >
                  Shreeyush Dhungana
                </a>
              </p>
              <p className="text-xs">© 2026 Hamro Rent Technologies</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
