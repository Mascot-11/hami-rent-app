import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { toast } from "sonner";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Hamro Rent" }, { name: "description", content: "Sign in to manage tenants and bills." }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created");
      }
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <img src={logo} alt="Hamro Rent" className="h-16 sm:h-20 w-16 sm:w-20 rounded-full object-cover shadow-md" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-display">Hamro Rent</h1>
            <p className="text-xs sm:text-xs text-muted-foreground">Landlord&apos;s Auto Calculator · हाम्रो रेन्ट</p>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel help={HELP.authEmail} required>Email</FieldLabel>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <FieldLabel help={HELP.authPassword} required>Password</FieldLabel>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-1.5">
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary text-center">
            {mode === "signin" ? "Don&apos;t have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          <HelpTip text={HELP.authSwitchMode} label="Switch mode" />
        </div>
      </Card>
    </div>
  );
}
