/**
 * ⚠️ TEMPORARY — DELETE AFTER USE ⚠️
 *
 * /admin/reveal-key — one-time page for a verified SUPER ADMIN to read the
 * SUPABASE_SERVICE_ROLE_KEY that Lovable Cloud injects at runtime, so it can
 * be copied into another deployment's (e.g. Vercel) environment variables.
 *
 * Security:
 * - Server function verifies the caller's JWT AND super-admin status via the
 *   SECURITY DEFINER RPC (is_current_user_super_admin) before returning anything.
 * - Nothing is logged; the key only travels over HTTPS to the admin's browser.
 *
 * REMOVE THIS FILE (and redeploy) as soon as the key has been copied.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const revealServiceKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Hard gate: super admin only, verified server-side via auth.uid()
    const { data: isAdmin, error } = await context.supabase.rpc(
      "is_current_user_super_admin",
    );
    if (error || isAdmin !== true) {
      throw new Error("Forbidden: super admin access required");
    }
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not present in THIS deployment's runtime. " +
        "Open this page on the deployment where it is injected (Lovable Cloud preview/published URL).",
      );
    }
    return { key };
  });

export const Route = createFileRoute("/admin/reveal-key")({
  head: () => ({ meta: [{ title: "Reveal key — Admin" }, { name: "robots", content: "noindex" }] }),
  component: RevealKeyPage,
});

function RevealKeyPage() {
  const revealFn = useServerFn(revealServiceKey);
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reveal = async () => {
    setBusy(true);
    try {
      const res = await revealFn();
      setKey(res.key);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const copy = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    toast.success("Copied — now paste it into Vercel env vars and DELETE this page");
  };

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <KeyRound className="h-6 w-6" /> Reveal service-role key
      </h1>

      <div className="flex gap-3 items-start bg-destructive/10 border border-destructive/25 rounded-xl p-4 text-sm">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="text-muted-foreground text-xs leading-relaxed">
          <p className="font-medium text-destructive text-sm mb-1">Temporary page — delete after use</p>
          This key bypasses ALL row-level security on your database. Copy it directly
          into your hosting provider's server environment variables
          (<code className="bg-muted px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>, never{" "}
          <code className="bg-muted px-1 rounded">VITE_</code>-prefixed), then remove this
          page from the codebase and redeploy.
        </div>
      </div>

      <Card className="p-5 space-y-4">
        {!key ? (
          <Button onClick={reveal} disabled={busy}>
            {busy ? "Verifying admin…" : "Reveal key (super admin only)"}
          </Button>
        ) : (
          <>
            <p className="text-xs font-mono break-all bg-muted rounded-lg p-3 select-all">{key}</p>
            <Button onClick={copy} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-1.5" /> Copy to clipboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
