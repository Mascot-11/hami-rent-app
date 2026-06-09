import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListUsers, adminGrantAdmin, adminRevokeAdmin, adminDeleteUser,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ShieldOff, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const listFn    = useServerFn(adminListUsers);
  const grantFn   = useServerFn(adminGrantAdmin);
  const revokeFn  = useServerFn(adminRevokeAdmin);
  const deleteFn  = useServerFn(adminDeleteUser);
  const qc        = useQueryClient();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const grant = async (userId: string) => {
    setBusy(userId);
    try {
      await grantFn({ data: { user_id: userId } });
      toast.success("Admin granted");
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const revoke = async (userId: string) => {
    setBusy(userId);
    try {
      await revokeFn({ data: { user_id: userId } });
      toast.success("Admin revoked");
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const del = async (userId: string, email: string) => {
    if (!confirm(`Permanently delete user ${email}? This will also delete all their data.`)) return;
    setBusy(userId);
    try {
      await deleteFn({ data: { user_id: userId } });
      toast.success("User deleted");
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const filtered = users.filter((u: any) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Users
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} registered user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Joined</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Last sign in</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="px-4 py-2.5 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium truncate max-w-[200px]">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString("en-NP")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("en-NP") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/25 rounded-full px-2 py-0.5">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {u.is_admin ? (
                        <Button
                          variant="ghost" size="sm"
                          disabled={busy === u.id}
                          onClick={() => revoke(u.id)}
                          className="h-7 text-xs gap-1 text-warning hover:text-warning hover:bg-warning/10"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="sm"
                          disabled={busy === u.id}
                          onClick={() => grant(u.id)}
                          className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Make admin
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        disabled={busy === u.id}
                        onClick={() => del(u.id, u.email)}
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
