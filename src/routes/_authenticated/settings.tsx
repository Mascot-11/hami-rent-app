import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySubscription } from "@/lib/subscription.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Download, FileSpreadsheet, Crown } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SubscriptionCard() {
  const { t } = useLanguage();
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
            {t("settings.planLabel", { plan: sub.plan })}
            {sub.status !== "active" && <span className="ml-2 text-xs text-destructive capitalize">({sub.status})</span>}
            {sub.expired && <span className="ml-2 text-xs text-warning">{t("settings.lapsed")}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("settings.slotsUsed", { used: sub.tenants_used, slots: sub.tenant_slots })}
            {sub.expires_at && t("settings.validUntil", { date: new Date(sub.expires_at).toLocaleDateString("en-NP") })}
          </p>
        </div>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground mt-3">
        {t("settings.needMore")}
      </p>
    </Card>
  );
}

function SettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">{t("settings.title")}</h1>

      <SubscriptionCard />

      {/* Profile shortcut */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("settings.landlordProfile")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.profileDesc")}</p>
          </div>
        </div>
        <Link to="/profile">
          <Button variant="outline" size="sm">{t("settings.editProfile")}</Button>
        </Link>
      </Card>

      {/* Export data */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("settings.exportData")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.exportDesc")}</p>
          </div>
        </div>
        <Link to="/export">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            {t("settings.goToExport")}
          </Button>
        </Link>
      </Card>
    </div>
  );
}
