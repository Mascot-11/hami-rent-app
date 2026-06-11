import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySubscription } from "@/lib/subscription.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Download, FileSpreadsheet, Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SubscriptionCard() {
  const subFn = useServerFn(getMySubscription);
  const { data: sub } = useQuery({ queryKey: ["my-subscription"], queryFn: () => subFn() });
  if (!sub) return null;
  const pct = sub.tenant_slots > 0 ? Math.min(100, (sub.tenants_used / sub.tenant_slots) * 100) : 100;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm capitalize">
            {sub.plan} plan
            {sub.status !== "active" && <span className="ml-2 text-xs text-destructive capitalize">({sub.status})</span>}
            {sub.expired && <span className="ml-2 text-xs text-warning">(lapsed — free tier limits apply)</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {sub.tenants_used} of {sub.tenant_slots} tenant slot{sub.tenant_slots !== 1 ? "s" : ""} used
            {sub.expires_at && ` · valid until ${new Date(sub.expires_at).toLocaleDateString("en-NP")}`}
          </p>
        </div>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground mt-3">
        Need more tenant slots? Payments are handled manually — contact the administrator to upgrade your plan.
      </p>
    </Card>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">Settings</h1>

      <SubscriptionCard />

      {/* Profile shortcut */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Landlord profile</p>
            <p className="text-xs text-muted-foreground">Name, phone & address used on bills</p>
          </div>
        </div>
        <Link to="/profile">
          <Button variant="outline" size="sm">Edit profile</Button>
        </Link>
      </Card>

      {/* Export data */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Export data</p>
            <p className="text-xs text-muted-foreground">Download your bills as Excel spreadsheet</p>
          </div>
        </div>
        <Link to="/export">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Go to export
          </Button>
        </Link>
      </Card>
    </div>
  );
}
