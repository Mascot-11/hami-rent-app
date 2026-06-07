import { createFileRoute, redirect, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, Download, Settings, LogOut, Plus, Menu, X, Beaker } from "lucide-react";
import { clearDemoStore, getDemoStore } from "@/lib/demo-data";
import { useState } from "react";
import logo from "@/assets/hamro-rent-logo.jpeg";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const store = getDemoStore();
    if (!store) throw redirect({ to: "/home" });
  },
  component: DemoLayout,
});

function DemoLayout() {
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const exitDemo = () => {
    clearDemoStore();
    nav({ to: "/home" });
    toast.success("Demo cleared");
  };

  const links = [
    { to: "/demo/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/demo/tenants", label: "Tenants", icon: Users },
    { to: "/demo/bills/new", label: "New Bill", icon: Plus },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo Banner */}
      <div className="bg-warning/15 border-b border-warning/30 px-4 py-2 flex items-center justify-between text-warning-foreground text-xs sm:text-sm no-print">
        <div className="flex items-center gap-2">
          <Beaker className="h-3.5 w-3.5 flex-shrink-0 text-warning" />
          <span className="font-medium">Demo mode</span>
          <span className="hidden sm:inline text-muted-foreground">— all data is stored locally and clears after 3 days</span>
        </div>
        <button
          onClick={exitDemo}
          className="flex items-center gap-1.5 text-xs font-medium border border-warning/40 rounded-full px-3 py-1 hover:bg-warning/20 transition-colors"
        >
          <X className="h-3 w-3" />
          Exit demo
        </button>
      </div>

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
            <Link to="/demo/dashboard" className="flex items-center gap-2 font-display text-base sm:text-xl font-semibold flex-shrink-0">
              <img src={logo} alt="Hamro Rent" className="h-7 sm:h-9 w-7 sm:w-9 rounded-full object-cover" />
              <span className="hidden sm:inline">Hamro Rent</span>
              <span className="text-xs font-normal text-warning bg-warning/15 rounded-full px-2 py-0.5">Demo</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => nav({ to: "/login" })} className="text-xs sm:text-sm h-8 sm:h-9">
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign up free</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border overflow-y-auto
          transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          mt-[113px] lg:mt-0 max-h-[calc(100vh-113px)] lg:max-h-full
        `}>
          <nav className="flex flex-col gap-1 p-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
                activeProps={{ className: "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-primary-foreground bg-sidebar-primary" }}
              >
                <l.icon className="h-5 w-5 flex-shrink-0" />
                <span>{l.label}</span>
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-sidebar-border">
              <button
                onClick={exitDemo}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="h-5 w-5" />
                Exit demo
              </button>
            </div>
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-30 mt-[113px]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 flex flex-col overflow-hidden w-full">
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-6">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>
          <footer className="border-t bg-card text-center py-4 px-4 text-xs text-muted-foreground no-print">
            <p>
              Hamro Rent Demo ·{" "}
              <button onClick={() => nav({ to: "/login" })} className="text-primary hover:underline">
                Create a free account
              </button>{" "}
              to save your data permanently
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
