import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetStats } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { fmtNPR } from "@/lib/calc";
import { Users, FileText, CreditCard, TrendingUp, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Overview — Hamro Rent" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fn = useServerFn(adminGetStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fn(),
  });

  const stats = [
    { label: "Registered Users",  value: data?.userCount  ?? "—", icon: <Users className="h-5 w-5" />,      color: "text-blue-500"  },
    { label: "Total Tenants",     value: data?.tenantCount ?? "—", icon: <Users className="h-5 w-5" />,      color: "text-green-500" },
    { label: "Total Bills",       value: data?.billCount  ?? "—",  icon: <FileText className="h-5 w-5" />,   color: "text-orange-500"},
    { label: "Total Revenue",     value: data ? fmtNPR(data.totalRevenue) : "—", icon: <TrendingUp className="h-5 w-5" />, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          Admin Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide statistics across all landlord accounts.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 sm:p-5">
            <div className={`flex items-center gap-2 mb-3 ${s.color}`}>
              {s.icon}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {s.label}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold">
              {isLoading ? <div className="h-8 w-20 bg-muted animate-pulse rounded" /> : String(s.value)}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Admin Capabilities</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "View and manage all registered users — grant or revoke admin access",
            "Read, update, and delete any tenant across all landlord accounts",
            "View and delete any bill regardless of owner",
            "View and delete any payment record",
            "All actions are server-side verified — cannot be bypassed from the client",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-destructive mt-0.5 flex-shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
