import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { toast } from "sonner";
import { Home, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Hamro Rent" },
      { name: "description", content: "Sign in to manage your tenants and bills with Hamro Rent." },
    ],
  }),
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
        toast.success("Account created — check your email to confirm");
      }
      nav({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Home className="h-4 w-4" />
          </div>
          <span className="font-display text-xl font-semibold">Hamro Rent</span>
        </div>
        <div>
          <blockquote className="font-display text-2xl leading-snug italic opacity-90 mb-6">
            "Auto-calculates electricity, water, and rent every month. Saves me hours."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center font-semibold text-sm">H</div>
            <div>
              <div className="text-sm font-medium">Hari K.</div>
              <div className="text-xs opacity-70">Landlord, Lalitpur</div>
            </div>
          </div>
        </div>
        <div className="text-xs opacity-50">© 2026 Hamro Rent · Made in Nepal 🇳🇵</div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative">
        <Link
          to="/home"
          className="absolute top-5 left-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Hamro Rent</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-1.5">
              {mode === "signin" ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to your account to continue"
                : "Create your free account — no credit card needed"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <FieldLabel help={HELP.authEmail} required>Email</FieldLabel>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11"
              />
            </div>
            <div>
              <FieldLabel help={HELP.authPassword} required>Password</FieldLabel>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signin" ? "Your password" : "Min. 6 characters"}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold mt-2"
              disabled={loading}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "signin"
                ? <>Don't have an account? <span className="text-primary font-medium">Sign up free</span></>
                : <>Already have an account? <span className="text-primary font-medium">Sign in</span></>}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground mb-3">Want to explore first?</p>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              Try the live demo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
