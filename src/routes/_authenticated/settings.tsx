import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Download, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">Settings</h1>

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
